import { REGION_SPECS } from "./region-data";

const DEFAULT_ACCEPT_LANGUAGE = "en-US";
const FX_ENDPOINT = "https://open.er-api.com/v6/latest/";
const DEFAULT_ALLOWED_HEADERS = "content-type";

const REGION_META: Record<string, { currency: string; symbol: string }> = Object.fromEntries(
  REGION_SPECS.map(({ code, currency, symbol }) => [
    code.toLowerCase(),
    { currency, symbol },
  ]),
);

const CURRENCY_CODES = Array.from(
  new Set(Object.values(REGION_META).map((meta) => meta.currency.toUpperCase())),
);

const CURRENCY_SYMBOL_MAP: Record<string, string> = {};
const SYMBOL_TO_CURRENCY: Record<string, string> = {};

for (const meta of Object.values(REGION_META)) {
  const code = meta.currency.toUpperCase();
  if (!CURRENCY_SYMBOL_MAP[code]) {
    CURRENCY_SYMBOL_MAP[code] = meta.symbol;
  }
  if (!SYMBOL_TO_CURRENCY[meta.symbol]) {
    SYMBOL_TO_CURRENCY[meta.symbol] = code;
  }
}

const SYMBOL_LOOKUP = Object.keys(SYMBOL_TO_CURRENCY).sort(
  (a, b) => b.length - a.length,
);

type SoftwareOffer = {
  "@type"?: string;
  price?: number | string;
  priceCurrency?: string;
  category?: string;
};

type SoftwareApplication = {
  "@type"?: string;
  name?: string;
  offers?: SoftwareOffer | SoftwareOffer[];
  [key: string]: unknown;
};

type InAppSection = {
  title?: string;
  summary?: string;
  items?: Array<{ textPairs?: Array<[string, string]> }>;
  [key: string]: unknown;
};

type InAppPurchases = {
  available: boolean;
  summary: string | null;
  items: InAppPurchaseItem[];
};

type InAppPurchaseItem = {
  name: string;
  priceText: string;
  price: InAppItemPrice | null;
};

type InAppItemPrice = {
  text: string;
  amount: number | null;
  currency: string | null;
  symbol: string | null;
  converted?: ConvertedPrice | null;
};

type PriceInfo = {
  amount: number | null;
  currency: string | null;
  category: string | null;
  converted?: ConvertedPrice | null;
};

type ConvertedPrice = {
  amount: number | null;
  currency: string;
  symbol: string;
  rate: number;
  sourceCurrency: string;
  targetRegion: string;
  fetchedAt: string;
};

type FxResponse = {
  result?: string;
  rates?: Record<string, number>;
  time_last_update_utc?: string;
};

type FxCacheEntry = {
  rates: Record<string, number>;
  fetchedAt: string;
};

type FxCache = Map<string, FxCacheEntry>;

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method === "OPTIONS") {
      return handleOptions(request);
    }

    if (request.method !== "GET") {
      return jsonError("Only GET is supported", request, 405);
    }

    const url = new URL(request.url);
    const params = url.searchParams;
    const targetUrl = resolveAppStoreUrl(params);
    const toRegion = params.get("toregion")?.toLowerCase() ?? null;

    if (!targetUrl) {
      return jsonError("Provide either `url` or both `appId` and `region`.", request, 400);
    }

    const upstream = await fetch(targetUrl.url, {
      headers: {
        "accept-language": params.get("acceptLanguage") ?? DEFAULT_ACCEPT_LANGUAGE,
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36",
      },
    });

    if (!upstream.ok) {
      return jsonError(
        `App Store responded with ${upstream.status} for ${targetUrl.url}`,
        request,
        upstream.status,
      );
    }

    const html = await upstream.text();
    const softwarePayload = parseSoftwareApplication(extractScript(html, "software-application"));
    const iapPayloadRaw = parseInAppPurchases(extractScript(html, "serialized-server-data"));
    const fxCache: FxCache = new Map();
    const enrichedPrice = await enrichPriceWithConversion(
      softwarePayload?.price ?? null,
      toRegion,
      fxCache,
    );
    const enrichedIap = await enrichInAppPurchases(
      iapPayloadRaw,
      toRegion,
      fxCache,
      softwarePayload?.price?.currency ?? null,
    );

    const responseBody = {
      sourceUrl: targetUrl.url,
      region: targetUrl.region,
      appId: targetUrl.appId,
      targetRegion: toRegion,
      extractedAt: new Date().toISOString(),
      name: softwarePayload?.name ?? null,
      price: enrichedPrice,
      inAppPurchases: enrichedIap,
    };

    return jsonResponse(responseBody, request);
  },
};

function resolveAppStoreUrl(params: URLSearchParams) {
  const explicitUrl = params.get("url");
  if (explicitUrl) {
    try {
      const asUrl = new URL(explicitUrl);
      const meta = deriveMetaFromAppStoreUrl(asUrl);
      return { url: asUrl.toString(), ...meta };
    } catch {
      return null;
    }
  }

  const appId = params.get("appId") ?? params.get("id");
  if (!appId) {
    return null;
  }

  const region = params.get("region")?.toLowerCase() ?? "us";
  const name = params.get("name") ?? "app";
  const slug = slugify(name);
  const constructed = `https://apps.apple.com/${region}/app/${slug}/id${appId}`;
  return { url: constructed, region, appId };
}

function deriveMetaFromAppStoreUrl(url: URL) {
  const region = url.pathname.split("/").filter(Boolean)[0] ?? "us";
  const appIdMatch = url.pathname.match(/id(\d+)/i);
  const appId = appIdMatch ? appIdMatch[1] : null;
  return { region, appId };
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "app";
}

function extractScript(html: string, id: string) {
  const pattern = new RegExp(
    `<script[^>]*id=(?:"|')?${id}(?:"|')?[^>]*>([\\s\\S]*?)<\\/script>`,
    "i",
  );
  const match = html.match(pattern);
  return match?.[1]?.trim() ?? null;
}

type SoftwareDetails = {
  name: string | null;
  price: PriceInfo | null;
};

function parseSoftwareApplication(payload: string | null): SoftwareDetails | null {
  if (!payload) return null;
  let data: unknown;
  try {
    data = JSON.parse(payload);
  } catch {
    return null;
  }

  const node = findSoftwareApplication(data);
  if (!node) return null;

  let offers: SoftwareOffer | undefined;
  if (Array.isArray(node.offers)) {
    offers = node.offers[0];
  } else if (node.offers && typeof node.offers === "object") {
    offers = node.offers as SoftwareOffer;
  }

  const priceValue =
    typeof offers?.price === "number"
      ? offers.price
      : typeof offers?.price === "string"
        ? Number(offers.price.replace(/[^\d.]/g, ""))
        : null;

  const normalizedPrice = Number.isFinite(priceValue) ? Number(priceValue) : null;

  return {
    name: node.name ?? null,
    price: offers
      ? {
          amount: normalizedPrice,
          currency: offers.priceCurrency ?? null,
          category: offers.category ?? null,
        }
      : null,
  };
}

function findSoftwareApplication(value: unknown): SoftwareApplication | null {
  if (!value) return null;

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findSoftwareApplication(item);
      if (found) return found;
    }
    return null;
  }

  if (typeof value === "object") {
    const typed = value as Record<string, unknown>;
    if (
      typed["@type"] === "SoftwareApplication" ||
      (typed["name"] && typed["offers"])
    ) {
      return typed as SoftwareApplication;
    }

    if (typed["@graph"]) {
      const fromGraph = findSoftwareApplication(typed["@graph"]);
      if (fromGraph) return fromGraph;
    }

    for (const child of Object.values(typed)) {
      const found = findSoftwareApplication(child);
      if (found) return found;
    }
  }

  return null;
}

function parseInAppPurchases(payload: string | null): InAppPurchases | null {
  if (!payload) return null;
  let data: unknown;
  try {
    data = JSON.parse(payload);
  } catch {
    return null;
  }

  const section = findSectionByTitle(data, "In-App Purchases");
  if (!section) return null;

  const items =
    section.items
      ?.flatMap((item) => item.textPairs ?? [])
      .map(([name, price]) => createIapItem(name, price)) ?? [];

  return {
    available: (section.summary ?? "").toLowerCase() === "yes",
    summary: section.summary ?? null,
    items,
  };
}

function findSectionByTitle(value: unknown, title: string): InAppSection | null {
  if (!value) return null;

  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = findSectionByTitle(entry, title);
      if (found) return found;
    }
    return null;
  }

  if (typeof value === "object") {
    const typed = value as Record<string, unknown>;
    if (typeof typed.title === "string" && typed.title === title) {
      return typed as InAppSection;
    }

    for (const child of Object.values(typed)) {
      const found = findSectionByTitle(child, title);
      if (found) return found;
    }
  }

  return null;
}

function createIapItem(name: string | undefined, price: string | undefined): InAppPurchaseItem {
  const safeName = typeof name === "string" && name.trim().length > 0 ? name : "Unnamed item";
  const safePriceText = typeof price === "string" ? price : "";
  return {
    name: safeName,
    priceText: safePriceText,
    price: safePriceText ? parseItemPrice(safePriceText) : null,
  };
}

function parseItemPrice(text: string): InAppItemPrice {
  const trimmed = text.trim();
  if (!trimmed) {
    return { text, amount: null, currency: null, symbol: null };
  }

  const amount = parseNumericAmount(trimmed);
  const currency = detectCurrencyCode(trimmed);
  const symbol = detectCurrencySymbol(trimmed, currency);

  return {
    text,
    amount,
    currency,
    symbol,
  };
}

async function enrichPriceWithConversion(
  price: PriceInfo | null,
  toRegion: string | null,
  fxCache: FxCache,
): Promise<PriceInfo | null> {
  if (!price || price.amount == null || !price.currency || !toRegion) {
    return price;
  }

  const targetMeta = REGION_META[toRegion];
  if (!targetMeta) {
    return price;
  }

  const converted = await convertCurrency(
    price.amount,
    price.currency,
    targetMeta.currency,
    fxCache,
  );
  if (!converted) {
    return price;
  }

  return {
    ...price,
    converted: {
      amount: converted.amount !== null ? roundTo(converted.amount) : null,
      currency: targetMeta.currency,
      symbol: targetMeta.symbol,
      rate: converted.rate,
      sourceCurrency: price.currency,
      targetRegion: toRegion,
      fetchedAt: converted.fetchedAt,
    },
  };
}

async function enrichInAppPurchases(
  iap: InAppPurchases | null,
  toRegion: string | null,
  fxCache: FxCache,
  fallbackCurrency: string | null,
): Promise<InAppPurchases | null> {
  if (!iap) return null;

  const targetMeta = toRegion ? REGION_META[toRegion] : null;
  const items = await Promise.all(
    iap.items.map(async (item) => {
      const price = normalizeItemCurrency(item.price, fallbackCurrency);
      if (
        !price ||
        price.amount == null ||
        !price.currency ||
        !targetMeta ||
        !toRegion
      ) {
        return { ...item, price };
      }

      const converted = await convertCurrency(
        price.amount,
        price.currency,
        targetMeta.currency,
        fxCache,
      );

      if (!converted) return { ...item, price };

      return {
        ...item,
        price: {
          ...price,
          converted: {
            amount: converted.amount !== null ? roundTo(converted.amount) : null,
            currency: targetMeta.currency,
            symbol: targetMeta.symbol,
            rate: converted.rate,
            sourceCurrency: price.currency,
            targetRegion: toRegion,
            fetchedAt: converted.fetchedAt,
          },
        },
      };
    }),
  );

  return { ...iap, items };
}

function normalizeItemCurrency(price: InAppItemPrice | null, fallbackCurrency: string | null) {
  if (!price) return null;
  if (price.currency) return price;
  if (!fallbackCurrency) return price;
  const code = fallbackCurrency.toUpperCase();
  return {
    ...price,
    currency: code,
    symbol: price.symbol ?? CURRENCY_SYMBOL_MAP[code] ?? null,
  };
}

async function convertCurrency(
  amount: number,
  from: string,
  to: string,
  cache: FxCache,
) {
  const source = from.toUpperCase();
  const target = to.toUpperCase();

  if (source === target) {
    return { amount, rate: 1, fetchedAt: new Date().toISOString() };
  }

  const fxData = await getFxData(source, cache);
  if (!fxData) return null;

  const rate = fxData.rates[target];
  if (typeof rate !== "number") {
    return null;
  }

  return {
    amount: amount * rate,
    rate,
    fetchedAt: fxData.fetchedAt,
  };
}

async function getFxData(base: string, cache: FxCache) {
  const normalized = base.toUpperCase();
  if (cache.has(normalized)) {
    return cache.get(normalized)!;
  }

  const endpoint = `${FX_ENDPOINT}${encodeURIComponent(normalized)}`;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      cf: { cacheTtl: 3600, cacheEverything: true },
    });
  } catch {
    return null;
  }

  if (!response.ok) return null;

  let data: FxResponse;
  try {
    data = (await response.json()) as FxResponse;
  } catch {
    return null;
  }

  if (data.result !== "success" || !data.rates) {
    return null;
  }

  const entry: FxCacheEntry = {
    rates: data.rates,
    fetchedAt: data.time_last_update_utc ?? new Date().toISOString(),
  };

  cache.set(normalized, entry);
  return entry;
}

function detectCurrencyCode(text: string) {
  const upper = text.toUpperCase();

  const codeMatch = upper.match(/\b([A-Z]{3})\b/);
  if (codeMatch && CURRENCY_CODES.includes(codeMatch[1])) {
    return codeMatch[1];
  }

  for (const code of CURRENCY_CODES) {
    if (upper.includes(code)) return code;
  }

  for (const symbol of SYMBOL_LOOKUP) {
    if (symbol && text.includes(symbol)) {
      return SYMBOL_TO_CURRENCY[symbol];
    }
  }

  return null;
}

function detectCurrencySymbol(text: string, currency: string | null) {
  for (const symbol of SYMBOL_LOOKUP) {
    if (symbol && text.includes(symbol)) {
      return symbol;
    }
  }

  if (currency) {
    return CURRENCY_SYMBOL_MAP[currency.toUpperCase()] ?? null;
  }

  return null;
}

function parseNumericAmount(text: string) {
  const cleaned = text.replace(/[^\d,.\-]/g, "");
  if (!cleaned) return null;

  const decimalSeparator = determineDecimalSeparator(cleaned);
  let normalized = cleaned;

  if (decimalSeparator === ",") {
    normalized = normalized.replace(/\./g, "");
    normalized = normalized.replace(/,/g, ".");
  } else if (decimalSeparator === ".") {
    normalized = normalized.replace(/,/g, "");
  } else {
    normalized = normalized.replace(/[^\d\-]/g, "");
  }

  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

function determineDecimalSeparator(value: string) {
  const lastComma = value.lastIndexOf(",");
  const lastDot = value.lastIndexOf(".");

  const commaValid =
    lastComma !== -1 && value.length - lastComma - 1 > 0 && value.length - lastComma - 1 <= 2;
  const dotValid = lastDot !== -1 && value.length - lastDot - 1 > 0 && value.length - lastDot - 1 <= 2;

  if (commaValid && (!dotValid || lastComma > lastDot)) return ",";
  if (dotValid && (!commaValid || lastDot > lastComma)) return ".";
  return null;
}

function roundTo(value: number, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function handleOptions(request: Request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request),
  });
}

function corsHeaders(request: Request) {
  const origin = request.headers.get("Origin") ?? "*";
  const requestHeaders = request.headers.get("Access-Control-Request-Headers");
  const headers: Record<string, string> = {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET,OPTIONS",
    "access-control-allow-headers": requestHeaders ?? DEFAULT_ALLOWED_HEADERS,
    "access-control-max-age": "86400",
    vary: "Origin",
  };
  return headers;
}

function jsonResponse(data: unknown, request: Request, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  const cors = corsHeaders(request);
  for (const [key, value] of Object.entries(cors)) {
    headers.set(key, value);
  }
  const body = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  return new Response(body, { ...init, headers });
}

function jsonError(message: string, request: Request, status = 500) {
  return jsonResponse({ error: message }, request, { status });
}

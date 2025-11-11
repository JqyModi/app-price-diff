var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-jPGUgW/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// .wrangler/tmp/bundle-jPGUgW/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// shared/regions.ts
var REGION_SPECS = [
  { code: "ad", currency: "EUR", symbol: "\u20AC" },
  { code: "ae", currency: "AED", symbol: "\u062F.\u0625" },
  { code: "ag", currency: "XCD", symbol: "EC$" },
  { code: "al", currency: "ALL", symbol: "L" },
  { code: "am", currency: "AMD", symbol: "\u058F" },
  { code: "ao", currency: "AOA", symbol: "Kz" },
  { code: "ba", currency: "BAM", symbol: "KM" },
  { code: "ar", currency: "ARS", symbol: "$" },
  { code: "at", currency: "EUR", symbol: "\u20AC" },
  { code: "au", currency: "AUD", symbol: "A$" },
  { code: "bb", currency: "BBD", symbol: "Bds$" },
  { code: "bd", currency: "BDT", symbol: "\u09F3" },
  { code: "be", currency: "EUR", symbol: "\u20AC" },
  { code: "bf", currency: "XOF", symbol: "CFA" },
  { code: "bg", currency: "BGN", symbol: "\u043B\u0432" },
  { code: "bh", currency: "BHD", symbol: "\u0628.\u062F" },
  { code: "bj", currency: "XOF", symbol: "CFA" },
  { code: "bn", currency: "BND", symbol: "B$" },
  { code: "bo", currency: "BOB", symbol: "Bs" },
  { code: "br", currency: "BRL", symbol: "R$" },
  { code: "bs", currency: "BSD", symbol: "$" },
  { code: "bt", currency: "BTN", symbol: "Nu." },
  { code: "bw", currency: "BWP", symbol: "P" },
  { code: "bz", currency: "BZD", symbol: "BZ$" },
  { code: "ca", currency: "CAD", symbol: "CA$" },
  { code: "cl", currency: "CLP", symbol: "$" },
  { code: "cn", currency: "CNY", symbol: "\xA5" },
  { code: "co", currency: "COP", symbol: "$" },
  { code: "cr", currency: "CRC", symbol: "\u20A1" },
  { code: "cv", currency: "CVE", symbol: "Esc" },
  { code: "ch", currency: "CHF", symbol: "CHF" },
  { code: "cy", currency: "EUR", symbol: "\u20AC" },
  { code: "cz", currency: "CZK", symbol: "K\u010D" },
  { code: "de", currency: "EUR", symbol: "\u20AC" },
  { code: "dk", currency: "DKK", symbol: "kr" },
  { code: "dm", currency: "XCD", symbol: "EC$" },
  { code: "do", currency: "DOP", symbol: "RD$" },
  { code: "dz", currency: "DZD", symbol: "\u062F.\u062C" },
  { code: "ec", currency: "USD", symbol: "$" },
  { code: "ee", currency: "EUR", symbol: "\u20AC" },
  { code: "es", currency: "EUR", symbol: "\u20AC" },
  { code: "fi", currency: "EUR", symbol: "\u20AC" },
  { code: "fj", currency: "FJD", symbol: "FJ$" },
  { code: "fm", currency: "USD", symbol: "$" },
  { code: "fr", currency: "EUR", symbol: "\u20AC" },
  { code: "ga", currency: "XAF", symbol: "FCFA" },
  { code: "gb", currency: "GBP", symbol: "\xA3" },
  { code: "gd", currency: "XCD", symbol: "EC$" },
  { code: "ge", currency: "GEL", symbol: "\u20BE" },
  { code: "gh", currency: "GHS", symbol: "\u20B5" },
  { code: "gm", currency: "GMD", symbol: "D" },
  { code: "gn", currency: "GNF", symbol: "FG" },
  { code: "gr", currency: "EUR", symbol: "\u20AC" },
  { code: "gt", currency: "GTQ", symbol: "Q" },
  { code: "gw", currency: "XOF", symbol: "CFA" },
  { code: "gy", currency: "GYD", symbol: "G$" },
  { code: "hk", currency: "HKD", symbol: "HK$" },
  { code: "hn", currency: "HNL", symbol: "L" },
  { code: "hr", currency: "EUR", symbol: "\u20AC" },
  { code: "hu", currency: "HUF", symbol: "Ft" },
  { code: "id", currency: "IDR", symbol: "Rp" },
  { code: "ie", currency: "EUR", symbol: "\u20AC" },
  { code: "il", currency: "ILS", symbol: "\u20AA" },
  { code: "in", currency: "INR", symbol: "\u20B9" },
  { code: "is", currency: "ISK", symbol: "kr" },
  { code: "it", currency: "EUR", symbol: "\u20AC" },
  { code: "jm", currency: "JMD", symbol: "J$" },
  { code: "jo", currency: "JOD", symbol: "\u062F.\u0627" },
  { code: "jp", currency: "JPY", symbol: "\xA5" },
  { code: "ke", currency: "KES", symbol: "KSh" },
  { code: "kg", currency: "KGS", symbol: "c" },
  { code: "kh", currency: "KHR", symbol: "\u17DB" },
  { code: "ki", currency: "AUD", symbol: "A$" },
  { code: "kn", currency: "XCD", symbol: "EC$" },
  { code: "kr", currency: "KRW", symbol: "\u20A9" },
  { code: "kw", currency: "KWD", symbol: "\u062F.\u0643" },
  { code: "kz", currency: "KZT", symbol: "\u20B8" },
  { code: "la", currency: "LAK", symbol: "\u20AD" },
  { code: "lb", currency: "LBP", symbol: "\u0644.\u0644" },
  { code: "lc", currency: "XCD", symbol: "EC$" },
  { code: "lk", currency: "LKR", symbol: "\u20A8" },
  { code: "ls", currency: "LSL", symbol: "L" },
  { code: "lr", currency: "LRD", symbol: "$" },
  { code: "lt", currency: "EUR", symbol: "\u20AC" },
  { code: "lu", currency: "EUR", symbol: "\u20AC" },
  { code: "lv", currency: "EUR", symbol: "\u20AC" },
  { code: "mg", currency: "MGA", symbol: "Ar" },
  { code: "mw", currency: "MWK", symbol: "MK" },
  { code: "my", currency: "MYR", symbol: "RM" },
  { code: "mv", currency: "MVR", symbol: "Rf" },
  { code: "ml", currency: "XOF", symbol: "CFA" },
  { code: "mt", currency: "EUR", symbol: "\u20AC" },
  { code: "mr", currency: "MRU", symbol: "UM" },
  { code: "mu", currency: "MUR", symbol: "\u20A8" },
  { code: "mx", currency: "MXN", symbol: "MX$" },
  { code: "md", currency: "MDL", symbol: "L" },
  { code: "mn", currency: "MNT", symbol: "\u20AE" },
  { code: "me", currency: "EUR", symbol: "\u20AC" },
  { code: "ma", currency: "MAD", symbol: "\u062F.\u0645" },
  { code: "mo", currency: "MOP", symbol: "MOP$" },
  { code: "mz", currency: "MZN", symbol: "MT" },
  { code: "na", currency: "NAD", symbol: "N$" },
  { code: "nr", currency: "AUD", symbol: "A$" },
  { code: "np", currency: "NPR", symbol: "\u20A8" },
  { code: "nl", currency: "EUR", symbol: "\u20AC" },
  { code: "nz", currency: "NZD", symbol: "NZ$" },
  { code: "ni", currency: "NIO", symbol: "C$" },
  { code: "ne", currency: "XOF", symbol: "CFA" },
  { code: "ng", currency: "NGN", symbol: "\u20A6" },
  { code: "mk", currency: "MKD", symbol: "\u0434\u0435\u043D" },
  { code: "no", currency: "NOK", symbol: "kr" },
  { code: "om", currency: "OMR", symbol: "\u0631.\u0639" },
  { code: "pa", currency: "PAB", symbol: "B/." },
  { code: "pg", currency: "PGK", symbol: "K" },
  { code: "pe", currency: "PEN", symbol: "S/." },
  { code: "ph", currency: "PHP", symbol: "\u20B1" },
  { code: "pl", currency: "PLN", symbol: "z\u0142" },
  { code: "pt", currency: "EUR", symbol: "\u20AC" },
  { code: "pw", currency: "USD", symbol: "$" },
  { code: "py", currency: "PYG", symbol: "\u20B2" },
  { code: "qa", currency: "QAR", symbol: "\u0631.\u0642" },
  { code: "ro", currency: "RON", symbol: "lei" },
  { code: "rs", currency: "RSD", symbol: "\u0434\u0438\u043D" },
  { code: "rw", currency: "RWF", symbol: "FRw" },
  { code: "sa", currency: "SAR", symbol: "\uFDFC" },
  { code: "sb", currency: "SBD", symbol: "SI$" },
  { code: "sc", currency: "SCR", symbol: "\u20A8" },
  { code: "se", currency: "SEK", symbol: "kr" },
  { code: "sg", currency: "SGD", symbol: "S$" },
  { code: "si", currency: "EUR", symbol: "\u20AC" },
  { code: "sk", currency: "EUR", symbol: "\u20AC" },
  { code: "sl", currency: "SLE", symbol: "Le" },
  { code: "sm", currency: "EUR", symbol: "\u20AC" },
  { code: "st", currency: "STN", symbol: "Db" },
  { code: "sn", currency: "XOF", symbol: "CFA" },
  { code: "sr", currency: "SRD", symbol: "SR$" },
  { code: "sv", currency: "USD", symbol: "$" },
  { code: "th", currency: "THB", symbol: "\u0E3F" },
  { code: "tj", currency: "TJS", symbol: "SM" },
  { code: "tl", currency: "USD", symbol: "$" },
  { code: "tn", currency: "TND", symbol: "\u062F.\u062A" },
  { code: "to", currency: "TOP", symbol: "T$" },
  { code: "tr", currency: "TRY", symbol: "\u20BA" },
  { code: "tt", currency: "TTD", symbol: "TT$" },
  { code: "tv", currency: "AUD", symbol: "A$" },
  { code: "tw", currency: "TWD", symbol: "NT$" },
  { code: "tz", currency: "TZS", symbol: "TSh" },
  { code: "ug", currency: "UGX", symbol: "USh" },
  { code: "ua", currency: "UAH", symbol: "\u20B4" },
  { code: "us", currency: "USD", symbol: "$" },
  { code: "uy", currency: "UYU", symbol: "$U" },
  { code: "uz", currency: "UZS", symbol: "so'm" },
  { code: "vc", currency: "XCD", symbol: "EC$" },
  { code: "ws", currency: "WST", symbol: "WS$" },
  { code: "vu", currency: "VUV", symbol: "VT" },
  { code: "vn", currency: "VND", symbol: "\u20AB" },
  { code: "za", currency: "ZAR", symbol: "R" },
  { code: "zm", currency: "ZMW", symbol: "K" },
  { code: "zw", currency: "ZWL", symbol: "Z$" }
];

// src/worker.ts
var DEFAULT_ACCEPT_LANGUAGE = "en-US";
var FX_ENDPOINT = "https://open.er-api.com/v6/latest/";
var DEFAULT_ALLOWED_HEADERS = "content-type";
var REGION_META = Object.fromEntries(
  REGION_SPECS.map(({ code, currency, symbol }) => [
    code.toLowerCase(),
    { currency, symbol }
  ])
);
var CURRENCY_CODES = Array.from(
  new Set(Object.values(REGION_META).map((meta) => meta.currency.toUpperCase()))
);
var CURRENCY_SYMBOL_MAP = {};
var SYMBOL_TO_CURRENCY = {};
for (const meta of Object.values(REGION_META)) {
  const code = meta.currency.toUpperCase();
  if (!CURRENCY_SYMBOL_MAP[code]) {
    CURRENCY_SYMBOL_MAP[code] = meta.symbol;
  }
  if (!SYMBOL_TO_CURRENCY[meta.symbol]) {
    SYMBOL_TO_CURRENCY[meta.symbol] = code;
  }
}
var SYMBOL_LOOKUP = Object.keys(SYMBOL_TO_CURRENCY).sort(
  (a, b) => b.length - a.length
);
var worker_default = {
  async fetch(request) {
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
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36"
      }
    });
    if (!upstream.ok) {
      return jsonError(
        `App Store responded with ${upstream.status} for ${targetUrl.url}`,
        request,
        upstream.status
      );
    }
    const html = await upstream.text();
    const softwarePayload = parseSoftwareApplication(extractScript(html, "software-application"));
    const iapPayloadRaw = parseInAppPurchases(extractScript(html, "serialized-server-data"));
    const fxCache = /* @__PURE__ */ new Map();
    const enrichedPrice = await enrichPriceWithConversion(
      softwarePayload?.price ?? null,
      toRegion,
      fxCache
    );
    const enrichedIap = await enrichInAppPurchases(
      iapPayloadRaw,
      toRegion,
      fxCache,
      softwarePayload?.price?.currency ?? null
    );
    const responseBody = {
      sourceUrl: targetUrl.url,
      region: targetUrl.region,
      appId: targetUrl.appId,
      targetRegion: toRegion,
      extractedAt: (/* @__PURE__ */ new Date()).toISOString(),
      name: softwarePayload?.name ?? null,
      price: enrichedPrice,
      inAppPurchases: enrichedIap
    };
    return jsonResponse(responseBody, request);
  }
};
function resolveAppStoreUrl(params) {
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
__name(resolveAppStoreUrl, "resolveAppStoreUrl");
function deriveMetaFromAppStoreUrl(url) {
  const region = url.pathname.split("/").filter(Boolean)[0] ?? "us";
  const appIdMatch = url.pathname.match(/id(\d+)/i);
  const appId = appIdMatch ? appIdMatch[1] : null;
  return { region, appId };
}
__name(deriveMetaFromAppStoreUrl, "deriveMetaFromAppStoreUrl");
function slugify(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "app";
}
__name(slugify, "slugify");
function extractScript(html, id) {
  const pattern = new RegExp(
    `<script[^>]*id=(?:"|')?${id}(?:"|')?[^>]*>([\\s\\S]*?)<\\/script>`,
    "i"
  );
  const match = html.match(pattern);
  return match?.[1]?.trim() ?? null;
}
__name(extractScript, "extractScript");
function parseSoftwareApplication(payload) {
  if (!payload)
    return null;
  let data;
  try {
    data = JSON.parse(payload);
  } catch {
    return null;
  }
  const node = findSoftwareApplication(data);
  if (!node)
    return null;
  let offers;
  if (Array.isArray(node.offers)) {
    offers = node.offers[0];
  } else if (node.offers && typeof node.offers === "object") {
    offers = node.offers;
  }
  const priceValue = typeof offers?.price === "number" ? offers.price : typeof offers?.price === "string" ? Number(offers.price.replace(/[^\d.]/g, "")) : null;
  const normalizedPrice = Number.isFinite(priceValue) ? Number(priceValue) : null;
  return {
    name: node.name ?? null,
    price: offers ? {
      amount: normalizedPrice,
      currency: offers.priceCurrency ?? null,
      category: offers.category ?? null
    } : null
  };
}
__name(parseSoftwareApplication, "parseSoftwareApplication");
function findSoftwareApplication(value) {
  if (!value)
    return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findSoftwareApplication(item);
      if (found)
        return found;
    }
    return null;
  }
  if (typeof value === "object") {
    const typed = value;
    if (typed["@type"] === "SoftwareApplication" || typed["name"] && typed["offers"]) {
      return typed;
    }
    if (typed["@graph"]) {
      const fromGraph = findSoftwareApplication(typed["@graph"]);
      if (fromGraph)
        return fromGraph;
    }
    for (const child of Object.values(typed)) {
      const found = findSoftwareApplication(child);
      if (found)
        return found;
    }
  }
  return null;
}
__name(findSoftwareApplication, "findSoftwareApplication");
function parseInAppPurchases(payload) {
  if (!payload)
    return null;
  let data;
  try {
    data = JSON.parse(payload);
  } catch {
    return null;
  }
  const section = findSectionByTitle(data, "In-App Purchases");
  if (!section)
    return null;
  const items = section.items?.flatMap((item) => item.textPairs ?? []).map(([name, price]) => createIapItem(name, price)) ?? [];
  return {
    available: (section.summary ?? "").toLowerCase() === "yes",
    summary: section.summary ?? null,
    items
  };
}
__name(parseInAppPurchases, "parseInAppPurchases");
function findSectionByTitle(value, title) {
  if (!value)
    return null;
  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = findSectionByTitle(entry, title);
      if (found)
        return found;
    }
    return null;
  }
  if (typeof value === "object") {
    const typed = value;
    if (typeof typed.title === "string" && typed.title === title) {
      return typed;
    }
    for (const child of Object.values(typed)) {
      const found = findSectionByTitle(child, title);
      if (found)
        return found;
    }
  }
  return null;
}
__name(findSectionByTitle, "findSectionByTitle");
function createIapItem(name, price) {
  const safeName = typeof name === "string" && name.trim().length > 0 ? name : "Unnamed item";
  const safePriceText = typeof price === "string" ? price : "";
  return {
    name: safeName,
    priceText: safePriceText,
    price: safePriceText ? parseItemPrice(safePriceText) : null
  };
}
__name(createIapItem, "createIapItem");
function parseItemPrice(text) {
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
    symbol
  };
}
__name(parseItemPrice, "parseItemPrice");
async function enrichPriceWithConversion(price, toRegion, fxCache) {
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
    fxCache
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
      fetchedAt: converted.fetchedAt
    }
  };
}
__name(enrichPriceWithConversion, "enrichPriceWithConversion");
async function enrichInAppPurchases(iap, toRegion, fxCache, fallbackCurrency) {
  if (!iap)
    return null;
  const targetMeta = toRegion ? REGION_META[toRegion] : null;
  const items = await Promise.all(
    iap.items.map(async (item) => {
      const price = normalizeItemCurrency(item.price, fallbackCurrency);
      if (!price || price.amount == null || !price.currency || !targetMeta || !toRegion) {
        return { ...item, price };
      }
      const converted = await convertCurrency(
        price.amount,
        price.currency,
        targetMeta.currency,
        fxCache
      );
      if (!converted)
        return { ...item, price };
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
            fetchedAt: converted.fetchedAt
          }
        }
      };
    })
  );
  return { ...iap, items };
}
__name(enrichInAppPurchases, "enrichInAppPurchases");
function normalizeItemCurrency(price, fallbackCurrency) {
  if (!price)
    return null;
  if (price.currency)
    return price;
  if (!fallbackCurrency)
    return price;
  const code = fallbackCurrency.toUpperCase();
  return {
    ...price,
    currency: code,
    symbol: price.symbol ?? CURRENCY_SYMBOL_MAP[code] ?? null
  };
}
__name(normalizeItemCurrency, "normalizeItemCurrency");
async function convertCurrency(amount, from, to, cache) {
  const source = from.toUpperCase();
  const target = to.toUpperCase();
  if (source === target) {
    return { amount, rate: 1, fetchedAt: (/* @__PURE__ */ new Date()).toISOString() };
  }
  const fxData = await getFxData(source, cache);
  if (!fxData)
    return null;
  const rate = fxData.rates[target];
  if (typeof rate !== "number") {
    return null;
  }
  return {
    amount: amount * rate,
    rate,
    fetchedAt: fxData.fetchedAt
  };
}
__name(convertCurrency, "convertCurrency");
async function getFxData(base, cache) {
  const normalized = base.toUpperCase();
  if (cache.has(normalized)) {
    return cache.get(normalized);
  }
  const endpoint = `${FX_ENDPOINT}${encodeURIComponent(normalized)}`;
  let response;
  try {
    response = await fetch(endpoint, {
      cf: { cacheTtl: 3600, cacheEverything: true }
    });
  } catch {
    return null;
  }
  if (!response.ok)
    return null;
  let data;
  try {
    data = await response.json();
  } catch {
    return null;
  }
  if (data.result !== "success" || !data.rates) {
    return null;
  }
  const entry = {
    rates: data.rates,
    fetchedAt: data.time_last_update_utc ?? (/* @__PURE__ */ new Date()).toISOString()
  };
  cache.set(normalized, entry);
  return entry;
}
__name(getFxData, "getFxData");
function detectCurrencyCode(text) {
  const upper = text.toUpperCase();
  const codeMatch = upper.match(/\b([A-Z]{3})\b/);
  if (codeMatch && CURRENCY_CODES.includes(codeMatch[1])) {
    return codeMatch[1];
  }
  for (const code of CURRENCY_CODES) {
    if (upper.includes(code))
      return code;
  }
  for (const symbol of SYMBOL_LOOKUP) {
    if (symbol && text.includes(symbol)) {
      return SYMBOL_TO_CURRENCY[symbol];
    }
  }
  return null;
}
__name(detectCurrencyCode, "detectCurrencyCode");
function detectCurrencySymbol(text, currency) {
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
__name(detectCurrencySymbol, "detectCurrencySymbol");
function parseNumericAmount(text) {
  const cleaned = text.replace(/[^\d,.\-]/g, "");
  if (!cleaned)
    return null;
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
__name(parseNumericAmount, "parseNumericAmount");
function determineDecimalSeparator(value) {
  const lastComma = value.lastIndexOf(",");
  const lastDot = value.lastIndexOf(".");
  const commaValid = lastComma !== -1 && value.length - lastComma - 1 > 0 && value.length - lastComma - 1 <= 2;
  const dotValid = lastDot !== -1 && value.length - lastDot - 1 > 0 && value.length - lastDot - 1 <= 2;
  if (commaValid && (!dotValid || lastComma > lastDot))
    return ",";
  if (dotValid && (!commaValid || lastDot > lastComma))
    return ".";
  return null;
}
__name(determineDecimalSeparator, "determineDecimalSeparator");
function roundTo(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
__name(roundTo, "roundTo");
function handleOptions(request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request)
  });
}
__name(handleOptions, "handleOptions");
function corsHeaders(request) {
  const origin = request.headers.get("Origin") ?? "*";
  const requestHeaders = request.headers.get("Access-Control-Request-Headers");
  const headers = {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET,OPTIONS",
    "access-control-allow-headers": requestHeaders ?? DEFAULT_ALLOWED_HEADERS,
    "access-control-max-age": "86400",
    vary: "Origin"
  };
  return headers;
}
__name(corsHeaders, "corsHeaders");
function jsonResponse(data, request, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  const cors = corsHeaders(request);
  for (const [key, value] of Object.entries(cors)) {
    headers.set(key, value);
  }
  const body = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  return new Response(body, { ...init, headers });
}
__name(jsonResponse, "jsonResponse");
function jsonError(message, request, status = 500) {
  return jsonResponse({ error: message }, request, { status });
}
__name(jsonError, "jsonError");

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError2;

// .wrangler/tmp/bundle-jPGUgW/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-jPGUgW/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=worker.js.map

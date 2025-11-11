# App Store Inspector Worker

Cloudflare Worker that fetches an App Store product page, extracts basic offer information plus the "In‑App Purchases" section, and returns the data as structured JSON.

## Quick Start

```bash
npm install
npm run dev     # local preview
npm run deploy  # deploy with your Cloudflare account
```

The worker entry lives in `src/worker.ts`. No external scraping libraries are required; the code parses the HTML returned by the public App Store page.

## API

```
GET /?url=<full-app-store-url>
GET /?appId=<id>&region=<storefront>&name=<slug>&toregion=<target-storefront>
```

- `url` – preferred. Pass the full App Store URL such as `https://apps.apple.com/tr/app/chatgpt/id6448311069`.
- `appId` – numeric identifier (e.g., `6448311069`) used when `url` is not provided.
- `region` – storefront code (defaults to `us`).
- `name` – optional slug to keep the constructed URL valid; falls back to `app`.
- `toregion` – optional destination storefront code. When supplied and可解析到金额+货币时，主价格与内购项目都会使用 `open.er-api.com` 最新汇率添加 `converted` 字段。
- `acceptLanguage` – optional override for the `Accept-Language` header sent to Apple.

### Sample Response

```json
{
  "sourceUrl": "https://apps.apple.com/tr/app/chatgpt/id6448311069",
  "region": "tr",
  "appId": "6448311069",
  "targetRegion": "cn",
  "extractedAt": "2024-06-04T15:00:00.000Z",
  "name": "ChatGPT",
  "price": {
    "amount": 0,
    "currency": "TRY",
    "category": "free",
    "converted": {
      "amount": 0,
      "currency": "CNY",
      "symbol": "¥",
      "rate": 0.22,
      "sourceCurrency": "TRY",
      "targetRegion": "cn",
      "fetchedAt": "2024-06-04T14:00:00.000Z"
    }
  },
  "inAppPurchases": {
    "available": true,
    "summary": "Yes",
    "items": [
      {
        "name": "ChatGPT Plus",
        "priceText": "₺499,99",
        "price": {
          "text": "₺499,99",
          "amount": 499.99,
          "currency": "TRY",
          "symbol": "₺",
          "converted": {
            "amount": 84.1,
            "currency": "CNY",
            "symbol": "¥",
            "rate": 0.1682,
            "sourceCurrency": "TRY",
            "targetRegion": "cn",
            "fetchedAt": "2024-06-04T14:00:00.000Z"
          }
        }
      }
    ]
  }
}
```

When either of the relevant script blocks is missing or parsing fails, the corresponding sections are returned as `null`. Errors (missing parameters, non‑200 responses from Apple, etc.) are emitted with an informative JSON payload.

> ⚠️ FX数据由 `open.er-api.com` 提供，缓存 1 小时左右。若目标国家代码未知或汇率不可用，主价格与内购 `price.converted` 都会缺失，仅返回原始文本价格。

## CORS

Worker 默认允许来自任意来源的 `GET`/`OPTIONS` 请求，并返回 `Access-Control-Allow-Origin`、`Access-Control-Allow-Methods`、`Access-Control-Allow-Headers` 头，以便浏览器前端（如 `client/` 项目或本地调试站点）可直接调用。如需限制来源，可在 `corsHeaders` 函数中加入白名单逻辑。

## Deployment Notes

1. Configure your Cloudflare account locally with `wrangler login`.
2. Update the `name` inside `wrangler.toml` if needed.
3. Deploy via `npm run deploy`.

The worker does not require any secret bindings. If Apple starts rate-limiting your traffic, consider enabling caching via `fetch` options or Cloudflare KV/R2 to store recent responses.
# app-price-diff

# App Store Inspector API 文档

本文档描述部署在 Cloudflare Workers 上的 App Store Inspector 服务，用于拉取 Apple App Store 页面并返回结构化 JSON，包括应用基础信息、价格、以及内购项目，并支持按照目标国家汇率转换。

## 基本信息

| 项目 | 内容 |
| --- | --- |
| 请求方法 | `GET` |
| 基础路径 | `/`（部署 Worker 后的根路径） |
| MIME 类型 | `application/json` |
| 认证 | 无需认证（可根据需要在 Cloudflare 侧增加限制） |

## 查询参数

| 参数 | 是否必填 | 说明 |
| --- | --- | --- |
| `url` | 二选一 | 完整的 App Store 应用链接，如 `https://apps.apple.com/tr/app/chatgpt/id6448311069`。与 `appId`/`region` 至少提供其一。 |
| `appId` | 二选一 | App Store 应用 ID（纯数字），如 `6448311069`。若未提供 `url`，需与 `region` 搭配使用。 |
| `region` | 否 | Storefront 代码（默认 `us`）。当仅提供 `appId` 时用于构造 App Store URL。 |
| `name` | 否 | 构造 URL 时的 slug，默认 `app`。仅在缺少 `url` 时使用。 |
| `toregion` | 否 | 目标国家/地区代码，用于将主价格及内购项目转换成该地区的货币。需出现在内置 `REGION_META` 映射中。 |
| `acceptLanguage` | 否 | 自定义 `Accept-Language` 头，默认 `en-US`。可用于切换不同语言的页面内容。 |

> **提示**：当 `url` 与 `appId`/`region` 同时提供时，优先使用 `url`。

## 响应示例

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
      "rate": 0.1682,
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

## 字段说明

### 顶层字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `sourceUrl` | string | 实际抓取的 App Store 链接。 |
| `region` | string | 源数据所属的 App Store 国家代码。 |
| `appId` | string | 应用 ID。 |
| `targetRegion` | string \| null | 请求中的 `toregion`，若未提供则为 `null`。 |
| `extractedAt` | string | ISO8601 时间戳，表示 Worker 返回数据的时间。 |
| `name` | string \| null | 应用名称（来源于 `software-application` JSON-LD）。 |
| `price` | object \| null | 应用的基础价格信息，结构见下表。 |
| `inAppPurchases` | object \| null | “In-App Purchases” 区域的解析结果。 |

### `price` 对象

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `amount` | number \| null | 原始金额；若 App 为免费或 Apple 未提供数字则为 `null`。 |
| `currency` | string \| null | ISO 4217 货币代码。 |
| `category` | string \| null | Apple 返回的 offer 类别（如 `free` 或 `paid`）。 |
| `converted` | object \| null | 当传入 `toregion` 且成功获取汇率时存在，结构如下。 |

`converted` 字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `amount` | number \| null | 按目标货币换算后的金额（四舍五入到两位小数）。 |
| `currency` | string | 目标货币代码。 |
| `symbol` | string | 目标货币符号，按 `REGION_META` 映射。 |
| `rate` | number | 源币种到目标币种的汇率。 |
| `sourceCurrency` | string | 原始货币代码。 |
| `targetRegion` | string | 请求传入的 `toregion`。 |
| `fetchedAt` | string | 汇率数据的更新时间（UTC）。 |

### `inAppPurchases` 对象

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `available` | boolean | Apple 页面是否显示存在内购。 |
| `summary` | string \| null | 摘要文本（通常为 `"Yes"` 或 `"No"`）。 |
| `items` | array | 每个元素代表一个内购项目。 |

每个 `items[n]` 结构：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `name` | string | 内购项目名称。 |
| `priceText` | string | Apple 页面展示的原始价格字符串。 |
| `price` | object \| null | 解析后的价格详情，包含： |
| `price.text` | string | 与 `priceText` 相同，便于保留原始文本。 |
| `price.amount` | number \| null | 从文本解析出的金额。支持识别`,`/`.` 小数分隔。 |
| `price.currency` | string \| null | 货币代码。若文本无币种且主价格提供了币种，会继承主价格货币。 |
| `price.symbol` | string \| null | 货币符号。 |
| `price.converted` | object \| null | 与主 `price` 的 `converted` 结构一致，当满足换算条件时存在。 |

## 错误响应

所有错误都会返回 `application/json`，并包含 `error` 字段。

| HTTP 状态 | 示例 | 说明 |
| --- | --- | --- |
| `400` | `{"error":"Provide either `url` or both `appId` and `region`."}` | 缺少必要参数。 |
| `404` / `5xx` | `{"error":"App Store responded with 404 for ... "}` | Apple 返回非 200 状态。 |
| `500` | `{"error":"..."} ` | Worker 内部错误或汇率服务异常。 |

## 汇率与缓存策略

- 汇率由 `https://open.er-api.com/v6/latest/{BASE}` 提供，默认缓存 1 小时（Cloudflare 边缘缓存 + 本地 Map）。  
- 只有在解析到有效 `amount` + `currency` 并且 `toregion` 在 `REGION_META` 映射中时，才会返回 `converted` 字段。  
- 若汇率服务不可用，Worker 将保留原始价格，不会报错。

## 示例调用

```bash
curl "https://your-worker.example.com/?appId=6448311069&region=tr&toregion=cn"
```

```bash
curl "https://your-worker.example.com/?url=https://apps.apple.com/us/app/chatgpt/id6448311069"
```

## 常见问题

1. **如何添加新的目标国家？**  
   更新 `src/worker.ts` 中的 `REGION_META`，包含 `currency` 和 `symbol`，即可同时支持主价格与内购转换。

2. **能否自定义汇率来源？**  
   可以在 `convertCurrency`/`getFxData` 内替换为自有服务或付费 API，并保留缓存逻辑。

3. **页面变动导致解析失败怎么办？**  
   Apple 调整页面结构时可通过 `extractScript` 函数重新定位 `script` 标签。建议在 Worker 中增加日志上报或监控。

---

如需进一步集成（例如添加认证、速率限制或缓存），请结合 Cloudflare Workers、KV、R2 等能力自行扩展。

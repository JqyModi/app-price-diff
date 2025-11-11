# Client Web App

基于 Vite + TypeScript + 原生 Web Components 风格的前端，用于调用 Cloudflare Worker API 并展示跨国价格对比。

## 本地启动

```bash
cd client
npm install        # 首次需要
npm run dev        # http://localhost:5173
```

若有自定义 Worker 地址，可在 `.env` 中设置：

```
VITE_WORKER_URL=https://your-worker.workers.dev
```

## 功能概览

- 预置 ChatGPT，支持自定义添加 Apple App（填入名称 + AppID 或 URL）。
- 自由选择多个对比地区，以及目标汇率地区。
- 一键发起批量查询，表格展示原币价格、换算价格、差值及关键内购项目。
- 轻量化历史记录（存储在内存），便于快速回溯最近的查询组合。

页面已按 Apple 设计语言构建柔和的玻璃态界面，可直接部署到任意静态站点托管服务。

# MovieBox Mini App V3 — Telegram Mini App

- Telegram WebApp SDK integrated (ready/expand, header colors, safe areas, native BackButton).
- Server-side verification of Telegram `initData` (HMAC-SHA256) + optional `REQUIRE_TELEGRAM=1` lock on `/api/search`.
- Bot webhook: `/start` sends an "Open MovieBox" Mini App button; `npm run setup-bot` sets webhook + menu button.
- Downloads inside Telegram use `WebApp.downloadFile` (Bot API 8.0+) with `openLink` fallback, since blob downloads don't work in Telegram WebViews.
- Service worker is now network-first (no stale code inside Telegram).
- Fix: favoriting a card no longer fires an empty search toast.
- Vercel-ready (`api/index.js`, `vercel.json`).

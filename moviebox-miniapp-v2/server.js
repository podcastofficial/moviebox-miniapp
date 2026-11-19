import express from "express";
import dotenv from "dotenv";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config();
const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const { BOT_TOKEN, WEBAPP_URL, WEBHOOK_SECRET } = process.env;
const REQUIRE_TELEGRAM = process.env.REQUIRE_TELEGRAM === "1";

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

// ---- Telegram initData verification (https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app)
function verifyInitData(initData, maxAgeSec = 86400) {
  if (!BOT_TOKEN || !initData) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;
  params.delete("hash");
  const dataCheckString = [...params.entries()].map(([k, v]) => `${k}=${v}`).sort().join("\n");
  const secret = crypto.createHmac("sha256", "WebAppData").update(BOT_TOKEN).digest();
  const calc = crypto.createHmac("sha256", secret).update(dataCheckString).digest("hex");
  const a = Buffer.from(calc, "hex"), b = Buffer.from(hash, "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  const authDate = Number(params.get("auth_date"));
  if (!authDate || Date.now() / 1000 - authDate > maxAgeSec) return null;
  try { return JSON.parse(params.get("user") || "null"); } catch { return null; }
}

function telegramAuth(req, res, next) {
  const user = verifyInitData(req.get("x-telegram-init-data"));
  if (user) req.tgUser = user;
  if (REQUIRE_TELEGRAM && !user) return res.status(401).json({ error: "Open this app from Telegram." });
  next();
}

app.get("/api/health", (_req, res) => res.json({ ok: true, app: "MovieBox Mini App", telegram: Boolean(BOT_TOKEN) }));

app.get("/api/me", telegramAuth, (req, res) => res.json({ user: req.tgUser || null }));

// Metadata only. Playback URLs are supplied by the user from sources they are
// authorized to access; this server does not scrape or proxy copyrighted streams.
app.get("/api/search", telegramAuth, async (req, res) => {
  const q = String(req.query.q || "").trim();
  const type = ["movie", "tv", "multi"].includes(req.query.type) ? req.query.type : "multi";
  if (!q) return res.status(400).json({ error: "Search query is required." });
  if (!process.env.TMDB_API_KEY) {
    return res.status(503).json({ error: "TMDB_API_KEY is not configured. Add it to .env to enable live metadata search." });
  }
  try {
    const url = new URL(`https://api.themoviedb.org/3/search/${type}`);
    url.searchParams.set("query", q);
    url.searchParams.set("include_adult", "false");
    url.searchParams.set("language", "en-US");
    const response = await fetch(url, { headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}`, accept: "application/json" } });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.status_message || "Metadata provider error." });
    res.json({ results: data.results || [] });
  } catch {
    res.status(502).json({ error: "Could not reach the metadata provider." });
  }
});

// ---- Telegram bot webhook: /start opens the Mini App
async function tgApi(method, body) {
  const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
  });
  return r.json();
}

app.post("/api/telegram/webhook", async (req, res) => {
  if (!BOT_TOKEN || !WEBAPP_URL) return res.sendStatus(503);
  if (WEBHOOK_SECRET && req.get("x-telegram-bot-api-secret-token") !== WEBHOOK_SECRET) return res.sendStatus(403);
  const msg = req.body?.message;
  try {
    if (msg?.chat?.id && typeof msg.text === "string" && /^\/(start|app|help)\b/.test(msg.text)) {
      await tgApi("sendMessage", {
        chat_id: msg.chat.id,
        text: "🎬 MovieBox — discover titles, build your library and play your authorized media.",
        reply_markup: { inline_keyboard: [[{ text: "Open MovieBox", web_app: { url: WEBAPP_URL } }]] }
      });
    }
  } catch (e) { console.error("webhook error", e.message); }
  res.sendStatus(200); // always ack so Telegram doesn't retry
});

app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

if (!process.env.VERCEL) {
  app.listen(PORT, "0.0.0.0", () => console.log(`MovieBox Mini App running at http://localhost:${PORT}`));
}
export default app;

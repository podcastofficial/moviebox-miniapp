// Usage: node scripts/setup-bot.js
// Reads BOT_TOKEN, WEBAPP_URL (https), WEBHOOK_SECRET from .env, then:
//  1) sets the webhook  2) sets the bot's menu button to open the Mini App
import "dotenv/config";

const { BOT_TOKEN, WEBAPP_URL, WEBHOOK_SECRET } = process.env;
if (!BOT_TOKEN || !WEBAPP_URL?.startsWith("https://")) {
  console.error("Set BOT_TOKEN and an https WEBAPP_URL in .env first."); process.exit(1);
}
const call = async (m, b) => (await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${m}`, {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b)
})).json();

console.log("setWebhook:", await call("setWebhook", {
  url: `${WEBAPP_URL.replace(/\/$/, "")}/api/telegram/webhook`,
  secret_token: WEBHOOK_SECRET || undefined,
  allowed_updates: ["message"]
}));
console.log("setChatMenuButton:", await call("setChatMenuButton", {
  menu_button: { type: "web_app", text: "MovieBox", web_app: { url: WEBAPP_URL } }
}));

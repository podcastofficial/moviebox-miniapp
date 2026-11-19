import express from "express";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config();
const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (_req, res) => res.json({ ok: true, app: "MovieBox Mini App" }));

// Metadata only. Playback URLs are supplied by the user from sources they are
// authorized to access; this server does not scrape or proxy copyrighted streams.
app.get("/api/search", async (req, res) => {
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

app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.listen(PORT, "0.0.0.0", () => console.log(`MovieBox Mini App running at http://localhost:${PORT}`));

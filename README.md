# MovieBox Mini App — V2

A mobile-first, self-hosted movie discovery and personal media organizer inspired by the feature categories of [MovieBox-TUI](https://github.com/mesamirh/MovieBox-Tui). This is an independent web app, not a port of the Rust terminal UI.

## Included

- Responsive dark cinematic home page
- TMDB movie / TV metadata search (optional API key)
- Personal favorites, watch history and continue-watching list (browser local storage)
- Add authorized direct-play URLs to your personal stream library
- HTML5 video playback, playback speed and local WebVTT subtitle selection
- M3U playlist text import for authorized IPTV streams
- V2 Download Manager for direct, CORS-enabled media file URLs
- Download progress display and browser Downloads-folder handoff
- Download history with re-download and remove actions
- PWA shell/offline caching for app assets
- Express backend health endpoint and metadata search proxy

## Important limitations

This starter does **not** scrape MovieBox provider endpoints, bypass DRM, or provide copyrighted streams. It does not host media. Supply only streams/playlists you own or are licensed/authorized to access. Playback depends on browser codecs, CORS, source authentication and format support. HLS/DASH and DRM may need a dedicated player integration and a lawful provider's documented API. The V2 Download Manager fetches direct files only when the source permits access and the server allows browser CORS. It shows transfer progress and hands the completed file to the browser download manager. It does not support pause/resume, protected/DRM streams, scraping provider endpoints, or bypassing access controls. Large downloads are buffered by the browser and may consume substantial memory. For reliable large/background downloads, use a native Android app or a provider-supported download workflow.

## Requirements

- Node.js 18+ (20 LTS recommended)
- npm
- Optional TMDB API key for metadata search: https://www.themoviedb.org/settings/api

## Run locally

```bash
npm install
cp .env.example .env
# Add TMDB_API_KEY=... to .env if you want live search
npm start
```

Open `http://localhost:3000`.

## Termux (Android)

```bash
pkg update -y
pkg install -y nodejs-lts git unzip
termux-setup-storage
cd ~/storage/downloads
unzip moviebox-miniapp.zip
cd moviebox-miniapp
cp .env.example .env
nano .env
npm install
npm start
```

Open `http://127.0.0.1:3000` in your phone browser. Keep Termux running while using the local server. For public access, deploy to a Node.js host with HTTPS; do not expose a development server directly to the internet.

## Create a new GitHub repository and push

First create an **empty public or private repository** named `moviebox-miniapp` under your GitHub account at https://github.com/new. Do not initialize it with a README, license or .gitignore.

Then, in Termux, from the extracted project folder:

```bash
git init
git add .
git commit -m "Initial MovieBox Mini App"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/moviebox-miniapp.git
git push -u origin main
```

Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username. GitHub may ask you to authenticate; use a Personal Access Token or GitHub CLI, never paste your token into chat or commit it into the repository.

## Configure TMDB

For local testing, place the TMDB API Read Access Token in `.env` as `TMDB_API_KEY=...`, then restart `npm start`. Keep `.env` private; `.gitignore` excludes it. TMDB attribution and API terms apply. The browser settings field is a convenience only; the backend `.env` setting is the supported search configuration.

## Project structure

```text
moviebox-miniapp/
├── public/
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   ├── manifest.webmanifest
│   └── sw.js
├── .env.example
├── .gitignore
├── package.json
├── server.js
└── README.md
```

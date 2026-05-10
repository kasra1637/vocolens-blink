# PRD - VocoLens Voice Journal App

## Overview
React Native / Expo Voice Journal with AI Emotion Analysis (OpenRouter GPT-4o). Runs seamlessly in the Emergent ecosystem: native phone mockup in the App Preview + Expo Go QR code for real-device testing.

## Architecture
| Service | Port | Description |
|---------|------|-------------|
| Phone Mockup Proxy | 3000 | Node.js — serves iPhone frame, proxies to Metro, handles WS HMR |
| Metro Dev Server | 3001 | Expo bundler with ngrok tunnel (web + native) |
| FastAPI Backend | 8001 | Journal analysis (OpenRouter), usage tracking |

## How the Preview Works
1. Emergent opens `https://XXX.preview.emergentagent.com` → `proxy-server.js` returns iPhone mockup HTML
2. Inside the mockup, `<iframe src="/app.html">` loads the Expo web app (proxied from Metro:3001)
3. All assets + WebSocket HMR proxied transparently to Metro
4. Right panel polls `/tunnel-url` every 3 s — shows live QR code for Expo Go

## Automation
### After every `npm install` (automatic via `postinstall`)
```
bash /app/scripts/cleanup-watchable.sh   # removes heavy non-runtime dirs
sudo supervisorctl restart frontend       # restarts Metro cleanly
```
This is wired into `/app/package.json` → `"postinstall"` so it fires automatically.

### Why cleanup is needed
Container inotify limit: **12,288** watches. Full node_modules has **13,000+** dirs.
Cleanup removes:
- `@sinclair/typebox` nested in jest packages (test-only)
- `lib/typescript` type-def dirs from native packages (IDE only)
- `android/`, `ios/`, `cpp/` native source trees (EAS Build only, not needed by Metro)

## Tunnel Auto-Refresh
`proxy-server.js` polls ngrok API every 3 s (always, not just until first URL). If the tunnel restarts and the URL changes, the QR code updates instantly in the browser with no page reload.

## Key Files
| File | Purpose |
|------|---------|
| `/app/frontend/proxy-server.js` | Phone mockup + proxy server |
| `/app/frontend/package.json` | Start script: Metro (3001) + proxy (3000) |
| `/app/backend/server.py` | Python FastAPI backend |
| `/app/metro.config.js` | Metro config — uses METRO_PORT=3001 |
| `/app/scripts/cleanup-watchable.sh` | Post-install cleanup script |
| `/app/package.json` | `postinstall` hook wired in |

## Backlog
- P1: EAS Build setup for App Store / Google Play distribution
- P2: MongoDB persistence for usage data

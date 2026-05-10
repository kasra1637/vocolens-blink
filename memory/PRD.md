# PRD - VocoLens Voice Journal App

## Original Problem Statement
Use the source code from the connected GitHub repository for a native mobile app (iOS/Android). Make this mobile app run seamlessly in the app.emergent.sh ecosystem, showing directly in the App Preview inside an iPhone mockup frame.

## App Overview
VocoLens is a React Native / Expo Voice Journal App with Plutchik emotion wheel analysis (OpenRouter GPT-4o).

## Architecture
- **Phone Mockup Proxy (port 3000)**: Node.js server — serves iPhone frame HTML at `/`, proxies everything else to Metro on 3001, handles WebSocket upgrades for HMR
- **Metro Dev Server (port 3001)**: Expo web bundler — hot reload enabled
- **Backend (port 8001)**: Python FastAPI — journal analysis (OpenRouter), usage tracking
- **Tunnel**: @expo/ngrok available for native Expo Go testing

## How the Preview Works
1. Emergent App Preview opens `https://XXX.preview.emergentagent.com`
2. `proxy-server.js` returns iPhone mockup HTML (CSS phone frame)
3. Inside the mockup, `<iframe src="/app.html">` loads the Expo web app
4. `/app.html` is proxied to Metro on port 3001
5. All asset requests (`/_expo/static/*`) proxy to Metro as-is
6. WebSocket upgrades (HMR) proxied to Metro for live hot reload

## Key Files
- `/app/frontend/proxy-server.js` - iPhone mockup + proxy (port 3000)
- `/app/frontend/package.json` - starts Metro (3001) + proxy server (3000)
- `/app/backend/server.py` - Python FastAPI backend (port 8001)
- `/app/metro.config.js` - uses METRO_PORT env var (3001)
- `/app/scripts/cleanup-watchable.sh` - run after npm install

## Node_modules Cleanup (inotify limit fix)
Run after any `npm install`: `bash /app/scripts/cleanup-watchable.sh`

## Prioritized Backlog
- P0: None
- P1: Auto-cleanup script wired into postinstall
- P2: EAS Build for App Store / Google Play distribution

/**
 * VocoLens Phone Mockup Proxy Server
 *
 * Port 3000 (public via Emergent ingress):
 *   GET /         → phone mockup HTML (iPhone frame with embedded app)
 *   GET /app.html → proxied to Metro port 3001 root (Expo web app)
 *   GET /*        → proxied to Metro port 3001 (assets, bundles, HMR)
 *   WS  upgrade   → proxied to Metro port 3001 (hot reload)
 */

const http = require('http');
const net = require('net');

const PORT = parseInt(process.env.PORT) || 3000;
const METRO_PORT = 3001;

// ── Phone mockup HTML ─────────────────────────────────────────────────────────
const MOCKUP_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>VocoLens</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      height: 100%;
      background: #0f0f0f;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      overflow: hidden;
    }

    /* ── Outer phone shell ── */
    .phone {
      position: relative;
      width: 393px;
      height: 852px;
      background: #1a1a1a;
      border-radius: 54px;
      box-shadow:
        0 0 0 2px #3a3a3a,
        0 0 0 6px #111,
        0 40px 80px rgba(0,0,0,0.8),
        inset 0 0 0 1px #2a2a2a;
      display: flex;
      flex-direction: column;
      align-items: center;
      overflow: hidden;
    }

    /* ── Side buttons ── */
    .phone::before {
      content: '';
      position: absolute;
      left: -5px;
      top: 160px;
      width: 4px;
      height: 36px;
      background: #2a2a2a;
      border-radius: 2px 0 0 2px;
      box-shadow: 0 54px 0 #2a2a2a, 0 100px 0 #2a2a2a;
    }
    .phone::after {
      content: '';
      position: absolute;
      right: -5px;
      top: 210px;
      width: 4px;
      height: 70px;
      background: #2a2a2a;
      border-radius: 0 2px 2px 0;
    }

    /* ── Dynamic Island ── */
    .dynamic-island {
      position: absolute;
      top: 14px;
      left: 50%;
      transform: translateX(-50%);
      width: 126px;
      height: 37px;
      background: #000;
      border-radius: 20px;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 12px;
      gap: 6px;
    }
    .camera-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #1a1a1a;
      border: 2px solid #0a0a0a;
    }
    .camera-dot::after {
      content: '';
      display: block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #0a0a0a;
      margin: 1px auto;
    }

    /* ── Screen area ── */
    .screen {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      border-radius: 54px;
      overflow: hidden;
      background: #000;
    }

    /* ── Home indicator ── */
    .home-bar {
      position: absolute;
      bottom: 10px;
      left: 50%;
      transform: translateX(-50%);
      width: 134px;
      height: 5px;
      background: rgba(255,255,255,0.3);
      border-radius: 3px;
      z-index: 10;
    }

    /* ── App iframe ── */
    iframe {
      position: absolute;
      top: 0; left: 0;
      width: 100%;
      height: 100%;
      border: none;
      border-radius: 54px;
    }

    /* ── Loading overlay ── */
    #loading {
      position: absolute;
      inset: 0;
      background: #1a0b3b;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      z-index: 20;
      border-radius: 54px;
      transition: opacity 0.5s ease;
    }
    #loading.hidden { opacity: 0; pointer-events: none; }
    .loading-text { color: rgba(255,255,255,0.7); font-size: 15px; }
    .spinner {
      width: 32px; height: 32px;
      border: 3px solid rgba(255,255,255,0.15);
      border-top-color: #a78bfa;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Responsive scale ── */
    @media (max-height: 900px) {
      .phone { transform: scale(0.92); transform-origin: center; }
    }
    @media (max-height: 800px) {
      .phone { transform: scale(0.82); transform-origin: center; }
    }
    @media (max-height: 700px) {
      .phone { transform: scale(0.72); transform-origin: center; }
    }
    @media (max-width: 450px) {
      .phone {
        width: 100vw; height: 100vh;
        border-radius: 0; box-shadow: none;
      }
      .phone::before, .phone::after { display: none; }
      .dynamic-island { display: none; }
      .home-bar { display: none; }
      iframe { border-radius: 0; }
      #loading { border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="phone">
    <div class="screen">
      <div id="loading">
        <div class="spinner"></div>
        <span class="loading-text">Starting VocoLens…</span>
      </div>
      <iframe id="app"
        src="/app.html"
        allow="microphone; camera; autoplay"
        allowfullscreen
      ></iframe>
    </div>
    <div class="dynamic-island">
      <div class="camera-dot"></div>
    </div>
    <div class="home-bar"></div>
  </div>

  <script>
    var frame = document.getElementById('app');
    var loading = document.getElementById('loading');
    frame.addEventListener('load', function() {
      setTimeout(function() { loading.classList.add('hidden'); }, 300);
    });
    // Fallback: hide loading after 15s even if load doesn't fire
    setTimeout(function() { loading.classList.add('hidden'); }, 15000);
  </script>
</body>
</html>`;

// ── Proxy helper ──────────────────────────────────────────────────────────────
function proxyRequest(req, res, metroPath) {
  const options = {
    hostname: 'localhost',
    port: METRO_PORT,
    path: metroPath,
    method: req.method,
    headers: { ...req.headers, host: 'localhost:' + METRO_PORT },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    if (!res.headersSent) {
      res.writeHead(502);
    }
    res.end('Metro not ready: ' + err.message);
  });

  req.pipe(proxyReq, { end: true });
}

// ── HTTP server ───────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const url = req.url || '/';

  // Root → phone mockup
  if (url === '/' || url === '') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(MOCKUP_HTML);
    return;
  }

  // /app.html → proxy to Metro's root
  if (url === '/app.html') {
    proxyRequest(req, res, '/');
    return;
  }

  // Everything else → proxy as-is to Metro
  proxyRequest(req, res, url);
});

// ── WebSocket proxy (Metro hot reload / HMR) ──────────────────────────────────
server.on('upgrade', (req, socket, head) => {
  const target = net.createConnection({ host: 'localhost', port: METRO_PORT });

  target.on('connect', () => {
    // Replay the HTTP upgrade request to Metro
    const headers = Object.entries(req.headers)
      .map(([k, v]) => k + ': ' + v)
      .join('\r\n');
    target.write(
      req.method + ' ' + req.url + ' HTTP/' + req.httpVersion + '\r\n' +
      headers + '\r\n\r\n'
    );
    if (head && head.length) target.write(head);
    target.pipe(socket, { end: false });
    socket.pipe(target, { end: false });
  });

  target.on('error', () => socket.destroy());
  socket.on('error', () => target.destroy());
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('[VocoLens] Phone mockup proxy ready on port', PORT);
  console.log('[VocoLens] Metro dev server expected on port', METRO_PORT);
});

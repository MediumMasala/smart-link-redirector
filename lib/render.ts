import type { BridgePageOptions, DeepLinkPageOptions } from './types';

/**
 * Common security headers for HTML responses.
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data:; connect-src 'none'; frame-ancestors 'none'",
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY'
  };
}

/**
 * Escape HTML special characters.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Render a bridge page that uses JavaScript to detect the device
 * and redirect appropriately.
 */
export function renderBridgePage(options: BridgePageOptions): Response {
  const { androidStoreUrl, iosStoreUrl, fallbackUrl, queryString } = options;

  const fallbackWithQuery = queryString
    ? `${fallbackUrl}${fallbackUrl.includes('?') ? '&' : '?'}${queryString}`
    : fallbackUrl;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Redirecting...</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
      padding: 20px;
      text-align: center;
    }
    .container {
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 40px;
      max-width: 400px;
      width: 100%;
    }
    h1 { font-size: 24px; margin-bottom: 16px; }
    p { font-size: 16px; opacity: 0.9; margin-bottom: 24px; }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 24px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .buttons { display: flex; flex-direction: column; gap: 12px; }
    a.btn {
      display: block;
      padding: 14px 24px;
      background: #fff;
      color: #667eea;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    a.btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    .btn.secondary {
      background: rgba(255,255,255,0.2);
      color: #fff;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner" id="spinner"></div>
    <h1>Opening App...</h1>
    <p>Detecting your device. If you're not redirected automatically, choose an option below.</p>
    <div class="buttons">
      <a href="${escapeHtml(iosStoreUrl)}" class="btn" id="ios-btn">Download on App Store</a>
      <a href="${escapeHtml(androidStoreUrl)}" class="btn" id="android-btn">Get it on Google Play</a>
      <a href="${escapeHtml(fallbackWithQuery)}" class="btn secondary">Visit Website</a>
    </div>
  </div>
  <script>
    (function() {
      var androidUrl = ${JSON.stringify(androidStoreUrl)};
      var iosUrl = ${JSON.stringify(iosStoreUrl)};
      var fallbackUrl = ${JSON.stringify(fallbackWithQuery)};

      function detectDevice() {
        var ua = navigator.userAgent || '';
        var platform = navigator.platform || '';
        var maxTouch = navigator.maxTouchPoints || 0;

        if (/android/i.test(ua)) {
          return 'android';
        }

        if (/iphone|ipad|ipod/i.test(ua)) {
          return 'ios';
        }

        if (/macintosh/i.test(ua) && maxTouch > 1) {
          return 'ios';
        }

        if (/iphone|ipad|ipod/i.test(platform)) {
          return 'ios';
        }

        if (/win|mac|linux/i.test(platform) && maxTouch <= 1) {
          return 'desktop';
        }

        return 'unknown';
      }

      var device = detectDevice();

      setTimeout(function() {
        if (device === 'android') {
          document.getElementById('ios-btn').style.display = 'none';
          window.location.href = androidUrl;
        } else if (device === 'ios') {
          document.getElementById('android-btn').style.display = 'none';
          window.location.href = iosUrl;
        } else {
          window.location.href = fallbackUrl;
        }
      }, 300);
    })();
  </script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: getSecurityHeaders()
  });
}

/**
 * Render a deep link page that attempts to open the app first,
 * then falls back to the store.
 */
export function renderDeepLinkPage(options: DeepLinkPageOptions): Response {
  const { deepLink, storeUrl, device, queryString } = options;

  const deepLinkWithQuery = queryString
    ? `${deepLink}${deepLink.includes('?') ? '&' : '?'}${queryString}`
    : deepLink;

  const storeName = device === 'ios' ? 'App Store' : 'Google Play';
  const storeLabel = device === 'ios' ? 'Download on App Store' : 'Get it on Google Play';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Opening App...</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
      padding: 20px;
      text-align: center;
    }
    .container {
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 40px;
      max-width: 400px;
      width: 100%;
    }
    h1 { font-size: 24px; margin-bottom: 16px; }
    p { font-size: 16px; opacity: 0.9; margin-bottom: 24px; }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 24px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .buttons { display: flex; flex-direction: column; gap: 12px; }
    a.btn {
      display: block;
      padding: 14px 24px;
      background: #fff;
      color: #667eea;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    a.btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    .status { font-size: 14px; opacity: 0.8; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner" id="spinner"></div>
    <h1>Opening App...</h1>
    <p>Attempting to open the app. If it doesn't open, tap the button below.</p>
    <div class="buttons">
      <a href="${escapeHtml(storeUrl)}" class="btn" id="store-btn">${storeLabel}</a>
    </div>
    <p class="status" id="status">Trying to open app...</p>
  </div>
  <script>
    (function() {
      var deepLink = ${JSON.stringify(deepLinkWithQuery)};
      var storeUrl = ${JSON.stringify(storeUrl)};
      var status = document.getElementById('status');
      var spinner = document.getElementById('spinner');

      var appOpened = false;
      document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
          appOpened = true;
        }
      });

      window.addEventListener('blur', function() {
        appOpened = true;
      });

      var start = Date.now();
      window.location.href = deepLink;

      setTimeout(function() {
        if (!appOpened && Date.now() - start < 2000) {
          status.textContent = 'App not installed. Redirecting to ${storeName}...';
          setTimeout(function() {
            window.location.href = storeUrl;
          }, 500);
        } else if (appOpened) {
          status.textContent = 'App opened successfully!';
          spinner.style.display = 'none';
        }
      }, 800);
    })();
  </script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: getSecurityHeaders()
  });
}

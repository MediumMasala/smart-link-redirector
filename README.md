# Smart Link Redirector

A production-ready, device-aware app store redirection service built on Vercel Edge Functions. Detects the visitor's device and redirects to the appropriate app store or fallback landing page.

## Features

- **Smart Device Detection**: Uses Client Hints headers first, falls back to User-Agent parsing
- **In-App Browser Support**: Works reliably in LinkedIn, Instagram, X (Twitter), and other embedded browsers
- **iPadOS Edge Cases**: Handles iPadOS 13+ devices that report as "Macintosh"
- **Deep Link Support**: Optional deep linking to open the app directly before falling back to store
- **UTM Preservation**: Keeps query parameters for analytics tracking
- **Privacy-Safe Logging**: Hashes IP addresses, no PII stored
- **Tiny & Fast**: Edge runtime, sub-millisecond responses globally

## Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /tal` | Main redirect endpoint |
| `GET /go` | Alias for `/tal` |
| `GET /health` | Health check (returns JSON status) |
| `GET /debug` | Debug info (only when `DEBUG=true`) |

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- [Vercel CLI](https://vercel.com/docs/cli) (optional for local dev)

### Installation

```bash
# Install dependencies
npm install

# Login to Vercel (first time only)
npx vercel login
```

### Local Development

```bash
# Start local dev server
npm run dev
```

The service will be available at `http://localhost:3000`.

Test URLs:
- http://localhost:3000/tal
- http://localhost:3000/health
- http://localhost:3000/debug (when DEBUG=true)

### Deploy to Vercel

#### Option 1: CLI Deploy

```bash
# Deploy to production
npm run deploy
```

#### Option 2: Git Integration (Recommended)

1. Push your code to GitHub/GitLab/Bitbucket
2. Import the project in [Vercel Dashboard](https://vercel.com/new)
3. Vercel will auto-deploy on every push

## Environment Variables

Set these in your Vercel project settings or `.env.local` for local dev:

| Variable | Required | Description |
|----------|----------|-------------|
| `ANDROID_STORE_URL` | Yes | Google Play Store URL |
| `IOS_STORE_URL` | Yes | Apple App Store URL |
| `FALLBACK_URL` | Yes | Desktop/unknown device landing page |
| `ANDROID_DEEP_LINK` | No | Deep link URL for Android (e.g., `myapp://open`) |
| `IOS_DEEP_LINK` | No | Deep link URL for iOS (e.g., `myapp://open`) |
| `DEBUG` | No | Enable debug endpoint (`"true"` / `"false"`) |

### Setting Environment Variables

#### Via Vercel Dashboard
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add each variable

#### Via Vercel CLI
```bash
vercel env add ANDROID_STORE_URL
vercel env add IOS_STORE_URL
vercel env add FALLBACK_URL
```

#### For Local Development
Create a `.env.local` file:
```env
ANDROID_STORE_URL=https://play.google.com/store/apps/details?id=com.yourapp
IOS_STORE_URL=https://apps.apple.com/app/id123456789
FALLBACK_URL=https://yourapp.com
DEBUG=true
# Optional deep links
# ANDROID_DEEP_LINK=yourapp://open
# IOS_DEEP_LINK=yourapp://open
```

## How It Works

### Detection Flow

1. **Check Client Hints** (`Sec-CH-UA-Platform` header)
   - `"Android"` → Android device
   - `"iOS"` → iOS device
   - `"macOS"` → Check UA for iPad hints, otherwise desktop

2. **Parse User-Agent** (fallback)
   - `/android/i` → Android
   - `/iphone|ipad|ipod/i` → iOS
   - Windows/Linux/macOS patterns → Desktop

3. **Bridge Page** (ambiguous cases)
   - When confidence is low, serve HTML that uses JavaScript:
   - `navigator.userAgent`, `navigator.platform`, `navigator.maxTouchPoints`
   - Handles iPadOS 13+ detection (maxTouchPoints > 1 on "Macintosh")

### Redirect Strategy

```
High confidence Android → 302 to Play Store (or deep link page)
High confidence iOS     → 302 to App Store (or deep link page)
High confidence Desktop → 302 to fallback URL (with UTMs)
Low confidence/Unknown  → HTML bridge page with JS detection
```

### Deep Link Flow (when enabled)

1. Serve HTML page that attempts `window.location.href = deepLink`
2. Listen for `visibilitychange` / `blur` events (app opened)
3. After 800ms timeout, if app didn't open → redirect to store
4. Show manual "Download" button as fallback

## Analytics / Logging

Logs are output as structured JSON and available in Vercel's Runtime Logs:

```json
{
  "level": "info",
  "type": "redirect_event",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/tal",
  "detectedDevice": "ios",
  "chosenTarget": "ios_store",
  "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0...",
  "referrer": "https://linkedin.com/",
  "queryKeys": ["utm_source", "utm_campaign"],
  "ipHash": "a1b2c3d4"
}
```

View logs:
- **Vercel Dashboard**: Go to your project → "Logs" tab
- **CLI**: `vercel logs your-project-name`

## Testing

### Test User Agents

Use these User-Agent strings to test detection:

**iPhone Safari:**
```
Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1
```

**Android Chrome:**
```
Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36
```

**iPadOS "Macintosh" Style (Desktop Mode):**
```
Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15
```

**Desktop Chrome:**
```
Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36
```

**LinkedIn In-App Browser (iOS):**
```
Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [LinkedInApp]/9.29.6234
```

### Testing with curl

```bash
# Test iPhone
curl -I -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)" http://localhost:3000/tal

# Test Android
curl -I -H "User-Agent: Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro)" http://localhost:3000/tal

# Test with UTM params
curl -I "http://localhost:3000/tal?utm_source=linkedin&utm_campaign=launch"

# Test debug endpoint
curl "http://localhost:3000/debug" -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)"
```

### Testing Checklist

- [ ] `/tal` redirects iOS UA to App Store (302)
- [ ] `/tal` redirects Android UA to Play Store (302)
- [ ] `/tal` redirects Desktop UA to fallback URL (302)
- [ ] UTM parameters preserved in fallback URL
- [ ] `/health` returns JSON with status "ok"
- [ ] `/debug` returns 404 when `DEBUG=false`
- [ ] `/debug` returns detection info when `DEBUG=true`
- [ ] Deep link page attempts app open before store redirect (when configured)
- [ ] Bridge page shows correct buttons and redirects appropriately

## Security Headers

All responses include:

```
Cache-Control: no-store, no-cache, must-revalidate
Referrer-Policy: strict-origin-when-cross-origin
```

HTML pages additionally include:

```
Content-Security-Policy: default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data:; connect-src 'none'; frame-ancestors 'none'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
```

## Project Structure

```
├── api/
│   ├── redirect.ts   # Main redirect endpoint
│   ├── health.ts     # Health check endpoint
│   └── debug.ts      # Debug endpoint
├── lib/
│   ├── config.ts     # Environment config
│   ├── device.ts     # Device detection utilities
│   ├── render.ts     # HTML page rendering
│   ├── log.ts        # Analytics logging
│   └── types.ts      # TypeScript type definitions
├── package.json
├── tsconfig.json
├── vercel.json       # Vercel configuration
└── README.md
```

## Customization

### Custom Route

Edit `vercel.json` to change the route:

```json
{
  "rewrites": [
    { "source": "/your-custom-path", "destination": "/api/redirect" }
  ]
}
```

### Custom Styling

Edit the HTML/CSS in `lib/render.ts` to match your brand.

### Additional Analytics

Extend `LogEvent` type and `buildLogEvent()` function in `lib/log.ts`.

## Troubleshooting

### "Not Found" on debug endpoint
Set `DEBUG=true` in your environment variables.

### Deep links not working
- Ensure app is installed on the test device
- Verify deep link URL scheme is registered in the app
- Some in-app browsers block custom URL schemes

### iPadOS detection issues
iPadOS 13+ with "Request Desktop Website" enabled sends a Mac-like UA. The bridge page handles this with `maxTouchPoints` detection. For server-side only, this is inherently ambiguous.

### Environment variables not loading
- Redeploy after adding environment variables
- For local dev, ensure `.env.local` exists and restart the dev server

## License

MIT

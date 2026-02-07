import type { LogEvent } from './types';

/**
 * Hash an IP address for privacy-safe logging.
 */
export function hashIP(ip: string): string {
  if (!ip) return 'unknown';

  // Simple FNV-1a hash
  let hash = 2166136261;
  for (let i = 0; i < ip.length; i++) {
    hash ^= ip.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/**
 * Truncate user agent to reasonable length.
 */
function truncateUA(ua: string, maxLength: number = 200): string {
  if (!ua) return '';
  return ua.length > maxLength ? ua.substring(0, maxLength) + '...' : ua;
}

/**
 * Extract query parameter keys (not values) for logging.
 */
function getQueryKeys(url: URL): string[] {
  const keys: string[] = [];
  url.searchParams.forEach((_, key) => {
    keys.push(key);
  });
  return keys;
}

/**
 * Build a log event from the request context.
 */
export function buildLogEvent(
  req: Request,
  detectedDevice: LogEvent['detectedDevice'],
  chosenTarget: LogEvent['chosenTarget']
): LogEvent {
  const url = new URL(req.url);

  // Get IP from headers (Vercel uses x-forwarded-for)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             req.headers.get('x-real-ip') ||
             '';

  return {
    timestamp: new Date().toISOString(),
    path: url.pathname,
    detectedDevice,
    chosenTarget,
    userAgent: truncateUA(req.headers.get('User-Agent') || ''),
    referrer: req.headers.get('Referer') || '',
    queryKeys: getQueryKeys(url),
    ipHash: hashIP(ip)
  };
}

/**
 * Log an event to console as structured JSON.
 */
export function logEvent(event: LogEvent): void {
  console.log(JSON.stringify({
    level: 'info',
    type: 'redirect_event',
    ...event
  }));
}

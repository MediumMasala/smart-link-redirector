import { detectDevice, needsBridgePage } from '../lib/device';
import { getConfig } from '../lib/config';
import type { DeviceDetectionResult, TargetType, Config } from '../lib/types';

export const config = {
  runtime: 'edge',
};

/**
 * Determine which target will be used for a detection result.
 */
function determineTarget(detection: DeviceDetectionResult, cfg: Config): TargetType {
  if (needsBridgePage(detection)) {
    return 'bridge';
  }

  switch (detection.device) {
    case 'android':
      return cfg.ANDROID_DEEP_LINK ? 'deep_link' : 'android_store';
    case 'ios':
      return cfg.IOS_DEEP_LINK ? 'deep_link' : 'ios_store';
    case 'desktop':
    default:
      return 'fallback';
  }
}

export default async function handler(req: Request): Promise<Response> {
  const cfg = getConfig();

  // Only available when DEBUG=true
  if (cfg.DEBUG !== 'true') {
    return new Response('Not Found', { status: 404 });
  }

  const url = new URL(req.url);
  const detection = detectDevice(req.headers);
  const queryString = url.search.slice(1);

  const debugInfo = {
    detection,
    needsBridgePage: needsBridgePage(detection),
    headers: {
      'User-Agent': req.headers.get('User-Agent'),
      'Sec-CH-UA-Platform': req.headers.get('Sec-CH-UA-Platform'),
      'Sec-CH-UA-Mobile': req.headers.get('Sec-CH-UA-Mobile'),
      'x-forwarded-for': req.headers.get('x-forwarded-for') ? '[redacted]' : null
    },
    config: {
      androidStoreUrl: cfg.ANDROID_STORE_URL,
      iosStoreUrl: cfg.IOS_STORE_URL,
      fallbackUrl: cfg.FALLBACK_URL,
      androidDeepLink: cfg.ANDROID_DEEP_LINK || null,
      iosDeepLink: cfg.IOS_DEEP_LINK || null
    },
    queryString,
    chosenTarget: determineTarget(detection, cfg)
  };

  return new Response(JSON.stringify(debugInfo, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    }
  });
}

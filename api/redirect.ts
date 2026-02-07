import { detectDevice, needsBridgePage } from '../lib/device';
import { renderBridgePage, renderDeepLinkPage } from '../lib/render';
import { buildLogEvent, logEvent } from '../lib/log';
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

/**
 * Create a 302 redirect response with security headers.
 */
function redirect302(location: string): Response {
  return new Response(null, {
    status: 302,
    headers: {
      'Location': location,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  });
}

/**
 * Handle Android device.
 */
function handleAndroid(cfg: Config, queryString: string): Response {
  if (cfg.ANDROID_DEEP_LINK) {
    return renderDeepLinkPage({
      deepLink: cfg.ANDROID_DEEP_LINK,
      storeUrl: cfg.ANDROID_STORE_URL,
      device: 'android',
      queryString
    });
  }
  return redirect302(cfg.ANDROID_STORE_URL);
}

/**
 * Handle iOS device.
 */
function handleiOS(cfg: Config, queryString: string): Response {
  if (cfg.IOS_DEEP_LINK) {
    return renderDeepLinkPage({
      deepLink: cfg.IOS_DEEP_LINK,
      storeUrl: cfg.IOS_STORE_URL,
      device: 'ios',
      queryString
    });
  }
  return redirect302(cfg.IOS_STORE_URL);
}

/**
 * Handle desktop/unknown device.
 */
function handleDesktop(cfg: Config, queryString: string): Response {
  let targetUrl = cfg.FALLBACK_URL;
  if (queryString) {
    targetUrl += (targetUrl.includes('?') ? '&' : '?') + queryString;
  }
  return redirect302(targetUrl);
}

export default async function handler(req: Request): Promise<Response> {
  const cfg = getConfig();
  const url = new URL(req.url);
  const queryString = url.search.slice(1);

  // Detect device
  const detection = detectDevice(req.headers);
  const target = determineTarget(detection, cfg);

  // Log the event
  logEvent(buildLogEvent(req, detection.device, target));

  // If we need a bridge page for ambiguous detection
  if (needsBridgePage(detection)) {
    return renderBridgePage({
      androidStoreUrl: cfg.ANDROID_STORE_URL,
      iosStoreUrl: cfg.IOS_STORE_URL,
      fallbackUrl: cfg.FALLBACK_URL,
      queryString
    });
  }

  // Handle based on detected device
  switch (detection.device) {
    case 'android':
      return handleAndroid(cfg, queryString);
    case 'ios':
      return handleiOS(cfg, queryString);
    case 'desktop':
    default:
      return handleDesktop(cfg, queryString);
  }
}

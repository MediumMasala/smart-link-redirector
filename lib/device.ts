import type { DeviceDetectionResult } from './types';

/**
 * Detects device type from request headers.
 * Uses Client Hints first, then falls back to User-Agent parsing.
 */
export function detectDevice(headers: Headers): DeviceDetectionResult {
  // 1. Try Client Hints first (more reliable when available)
  const platform = headers.get('Sec-CH-UA-Platform');
  if (platform) {
    const platformLower = platform.toLowerCase().replace(/"/g, '');

    if (platformLower === 'android') {
      return {
        device: 'android',
        confidence: 'high',
        reason: 'Client Hints: Sec-CH-UA-Platform = Android'
      };
    }

    if (platformLower === 'ios') {
      return {
        device: 'ios',
        confidence: 'high',
        reason: 'Client Hints: Sec-CH-UA-Platform = iOS'
      };
    }

    // macOS could be iPad requesting desktop site
    if (platformLower === 'macos') {
      const ua = headers.get('User-Agent') || '';
      if (isProbablyIPad(ua)) {
        return {
          device: 'ios',
          confidence: 'low',
          reason: 'Client Hints: macOS but UA suggests iPad'
        };
      }
      return {
        device: 'desktop',
        confidence: 'high',
        reason: 'Client Hints: Sec-CH-UA-Platform = macOS'
      };
    }

    if (platformLower === 'windows' || platformLower === 'linux' || platformLower === 'chromeos') {
      return {
        device: 'desktop',
        confidence: 'high',
        reason: `Client Hints: Sec-CH-UA-Platform = ${platform}`
      };
    }
  }

  // 2. Fall back to User-Agent parsing
  const ua = headers.get('User-Agent') || '';

  if (!ua) {
    return {
      device: 'unknown',
      confidence: 'low',
      reason: 'No User-Agent header present'
    };
  }

  return detectFromUserAgent(ua);
}

/**
 * Parse User-Agent string to detect device type.
 */
function detectFromUserAgent(ua: string): DeviceDetectionResult {
  // Android detection
  if (/android/i.test(ua)) {
    return {
      device: 'android',
      confidence: 'high',
      reason: 'User-Agent contains "Android"'
    };
  }

  // iPhone detection
  if (/iphone/i.test(ua)) {
    return {
      device: 'ios',
      confidence: 'high',
      reason: 'User-Agent contains "iPhone"'
    };
  }

  // iPod detection
  if (/ipod/i.test(ua)) {
    return {
      device: 'ios',
      confidence: 'high',
      reason: 'User-Agent contains "iPod"'
    };
  }

  // iPad detection
  if (/ipad/i.test(ua)) {
    return {
      device: 'ios',
      confidence: 'high',
      reason: 'User-Agent contains "iPad"'
    };
  }

  // Check for iPad masquerading as Macintosh (iPadOS 13+)
  if (isProbablyIPad(ua)) {
    return {
      device: 'ios',
      confidence: 'low',
      reason: 'User-Agent contains "Macintosh" but might be iPad (iPadOS 13+)'
    };
  }

  // Desktop browsers
  if (/windows nt/i.test(ua)) {
    return {
      device: 'desktop',
      confidence: 'high',
      reason: 'User-Agent indicates Windows'
    };
  }

  if (/macintosh|mac os x/i.test(ua)) {
    return {
      device: 'desktop',
      confidence: 'high',
      reason: 'User-Agent indicates macOS'
    };
  }

  if (/linux/i.test(ua) && !/android/i.test(ua)) {
    return {
      device: 'desktop',
      confidence: 'high',
      reason: 'User-Agent indicates Linux desktop'
    };
  }

  if (/cros/i.test(ua)) {
    return {
      device: 'desktop',
      confidence: 'high',
      reason: 'User-Agent indicates Chrome OS'
    };
  }

  // Generic mobile indicator
  if (/mobile|phone/i.test(ua)) {
    return {
      device: 'unknown',
      confidence: 'low',
      reason: 'User-Agent indicates mobile but platform unclear'
    };
  }

  return {
    device: 'unknown',
    confidence: 'low',
    reason: 'Could not determine device from User-Agent'
  };
}

/**
 * Heuristic to detect iPad pretending to be Mac.
 */
function isProbablyIPad(ua: string): boolean {
  if (/ipad/i.test(ua)) {
    return true;
  }
  return false;
}

/**
 * Check if we should serve a bridge page for client-side detection.
 */
export function needsBridgePage(result: DeviceDetectionResult): boolean {
  if (result.confidence === 'low') {
    return true;
  }
  if (result.device === 'unknown') {
    return true;
  }
  return false;
}

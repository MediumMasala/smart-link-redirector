import type { Config } from './types';

/**
 * Get configuration from environment variables.
 */
export function getConfig(): Config {
  return {
    ANDROID_STORE_URL: process.env.ANDROID_STORE_URL || 'https://play.google.com/store/apps/details?id=com.example.app',
    IOS_STORE_URL: process.env.IOS_STORE_URL || 'https://apps.apple.com/app/id123456789',
    FALLBACK_URL: process.env.FALLBACK_URL || 'https://example.com/app',
    ANDROID_DEEP_LINK: process.env.ANDROID_DEEP_LINK,
    IOS_DEEP_LINK: process.env.IOS_DEEP_LINK,
    DEBUG: process.env.DEBUG || 'false',
  };
}

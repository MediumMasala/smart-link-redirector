export type DeviceType = 'android' | 'ios' | 'desktop' | 'unknown';
export type Confidence = 'high' | 'low';
export type TargetType = 'android_store' | 'ios_store' | 'fallback' | 'bridge' | 'deep_link';

export interface DeviceDetectionResult {
  device: DeviceType;
  confidence: Confidence;
  reason: string;
}

export interface Config {
  ANDROID_STORE_URL: string;
  IOS_STORE_URL: string;
  FALLBACK_URL: string;
  ANDROID_DEEP_LINK?: string;
  IOS_DEEP_LINK?: string;
  DEBUG?: string;
}

export interface LogEvent {
  timestamp: string;
  path: string;
  detectedDevice: DeviceType;
  chosenTarget: TargetType;
  userAgent: string;
  referrer: string;
  queryKeys: string[];
  ipHash: string;
}

export interface BridgePageOptions {
  androidStoreUrl: string;
  iosStoreUrl: string;
  fallbackUrl: string;
  queryString: string;
}

export interface DeepLinkPageOptions {
  deepLink: string;
  storeUrl: string;
  device: 'android' | 'ios';
  queryString: string;
}

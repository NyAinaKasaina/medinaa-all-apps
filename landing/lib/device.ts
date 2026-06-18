export function isAndroidUA(ua: string): boolean {
  return /android/i.test(ua) && !/windows phone/i.test(ua);
}

export function isIOSUA(ua: string): boolean {
  return /iphone|ipad|ipod/i.test(ua) && !/windows phone/i.test(ua);
}

export type DeviceKind = 'android' | 'ios' | 'desktop';

export function detectDevice(ua: string): DeviceKind {
  if (isAndroidUA(ua)) return 'android';
  if (isIOSUA(ua)) return 'ios';
  return 'desktop';
}

import { useEffect, useState } from 'react';
export function useIsAndroid(): boolean {
  const [isAndroid, setIsAndroid] = useState(false);
  useEffect(() => {
    setIsAndroid(isAndroidUA(navigator.userAgent));
  }, []);
  return isAndroid;
}

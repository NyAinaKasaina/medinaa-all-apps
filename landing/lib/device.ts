export function isAndroidUA(ua: string): boolean {
  return /android/i.test(ua) && !/windows phone/i.test(ua);
}

import { useEffect, useState } from 'react';
export function useIsAndroid(): boolean {
  const [isAndroid, setIsAndroid] = useState(false);
  useEffect(() => {
    setIsAndroid(isAndroidUA(navigator.userAgent));
  }, []);
  return isAndroid;
}

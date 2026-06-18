'use client';
import { useEffect } from 'react';
import { track } from '@/lib/analytics';
import { isAndroidUA } from '@/lib/device';

export function AnalyticsBeacon({ locale }: { locale: string }) {
  useEffect(() => {
    track({
      name: 'pageview',
      locale,
      path: window.location.pathname,
      referrer: document.referrer || undefined,
      device: isAndroidUA(navigator.userAgent) ? 'android' : 'other',
    });
  }, [locale]);
  return null;
}

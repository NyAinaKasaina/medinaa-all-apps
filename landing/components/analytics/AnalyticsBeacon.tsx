'use client';
import { useEffect } from 'react';
import { track } from '@/lib/analytics';
import { detectDevice } from '@/lib/device';

export function AnalyticsBeacon({ locale }: { locale: string }) {
  useEffect(() => {
    track({
      name: 'pageview',
      locale,
      path: window.location.pathname,
      referrer: document.referrer || undefined,
      device: detectDevice(navigator.userAgent),
    });
  }, [locale]);
  return null;
}

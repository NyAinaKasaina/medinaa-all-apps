export type TrackEventName = 'pageview' | 'cta_click';

export interface TrackEvent {
  name: TrackEventName;
  locale: string;
  path: string;
  referrer?: string;
  device?: string;
  meta?: Record<string, unknown>;
}

export function buildEvent(input: TrackEvent): TrackEvent {
  return {
    name: input.name,
    locale: input.locale,
    path: input.path,
    referrer: input.referrer,
    device: input.device,
    meta: input.meta,
  };
}

export function track(input: TrackEvent): void {
  if (typeof navigator === 'undefined') return;
  const body = JSON.stringify(buildEvent(input));
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }));
  } else {
    fetch('/api/track', {
      method: 'POST',
      body,
      keepalive: true,
      headers: { 'content-type': 'application/json' },
    }).catch(() => {});
  }
}

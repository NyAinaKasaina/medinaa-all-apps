'use client';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';
import { env } from '@/lib/env';
import { useIsAndroid, detectDevice } from '@/lib/device';
import { track } from '@/lib/analytics';

export function AppCtas({
  locale,
  className,
}: {
  locale: string;
  className?: string;
}) {
  const t = useTranslations('Cta');
  const isAndroid = useIsAndroid();

  const web = (
    <a
      key="web"
      href={env.webAppUrl}
      onClick={() => track({ name: 'cta_click', locale, path: location.pathname, device: detectDevice(navigator.userAgent), meta: { target: 'web_app' } })}
      className="inline-flex h-14 items-center justify-center rounded-lg bg-primary px-7 font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
    >
      {t('webApp')}
    </a>
  );

  const play = (
    <a
      key="play"
      href={env.playStoreUrl}
      aria-label={t('playStore')}
      onClick={() => track({ name: 'cta_click', locale, path: location.pathname, device: detectDevice(navigator.userAgent), meta: { target: 'play_store' } })}
      className="inline-flex items-center transition hover:opacity-90"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/badges/google-play.svg" alt={t('playStore')} width={189} height={56} className="h-14 w-auto" />
    </a>
  );

  // Android : Play Store mis en avant (priorité visuelle inversée)
  const order = isAndroid ? [play, web] : [web, play];

  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row', className)}>
      {order}
      {isAndroid && (
        <p className="mt-2 text-sm text-muted-foreground">{t('androidHint')}</p>
      )}
    </div>
  );
}

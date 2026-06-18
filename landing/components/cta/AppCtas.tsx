'use client';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';
import { env } from '@/lib/env';
import { useIsAndroid } from '@/lib/device';
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
      onClick={() => track({ name: 'cta_click', locale, path: location.pathname, device: isAndroid ? 'android' : 'other', meta: { target: 'web_app' } })}
      className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-6 font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
    >
      {t('webApp')}
    </a>
  );

  const play = (
    <a
      key="play"
      href={env.playStoreUrl}
      onClick={() => track({ name: 'cta_click', locale, path: location.pathname, device: isAndroid ? 'android' : 'other', meta: { target: 'play_store' } })}
      className="inline-flex h-12 items-center justify-center rounded-lg border border-border bg-card px-6 font-semibold transition hover:bg-muted"
    >
      {t('playStore')}
    </a>
  );

  // Android : Play Store mis en avant (priorité visuelle inversée)
  const order = isAndroid ? [play, web] : [web, play];

  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row', className)}>
      {order}
    </div>
  );
}

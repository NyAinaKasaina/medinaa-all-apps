'use client';
import { useTranslations } from 'next-intl';
import { MotionReveal } from '@/components/motion/MotionReveal';
import { AppCtas } from '@/components/cta/AppCtas';
import { SearchBarMock } from './SearchBarMock';

export function Hero({ locale, total }: { locale: string; total: number }) {
  const t = useTranslations('Hero');
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
      <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
        {/* H1 rendered immediately (no opacity:0) to avoid delaying LCP */}
        <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
          {t('title')}
        </h1>
        <MotionReveal delay={0.1}>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            {t('subtitle', { count: total.toLocaleString(locale) })}
          </p>
        </MotionReveal>
        <MotionReveal delay={0.2}>
          <div className="mt-8 max-w-2xl">
            <SearchBarMock locale={locale} />
          </div>
        </MotionReveal>
        <MotionReveal delay={0.3}>
          <AppCtas locale={locale} className="mt-6" />
        </MotionReveal>
      </div>
    </section>
  );
}

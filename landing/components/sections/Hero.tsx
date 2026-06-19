'use client';
import { useTranslations } from 'next-intl';
import { MotionReveal } from '@/components/motion/MotionReveal';
import { AppCtas } from '@/components/cta/AppCtas';
import { HeroSearch } from './HeroSearch';

export function Hero({ locale, total }: { locale: string; total: number }) {
  const t = useTranslations('Hero');
  return (
    <section className="relative">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
      <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-20 text-center sm:py-28">
        {/* H1 rendu immédiatement (pas d'opacity:0) pour ne pas retarder le LCP */}
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
          {t('title')}
        </h1>
        <MotionReveal delay={0.1} className="w-full">
          <p className="mx-auto mt-6 max-w-6xl text-lg text-muted-foreground">
            {t('subtitle', { count: total.toLocaleString(locale) })}
            <br />
          </p>
          <span className="font-medium text-muted-foreground">{t('subtitleApps')}</span>
        </MotionReveal>
        <MotionReveal delay={0.2} className="w-full">
          <div className="mx-auto mt-8 w-full max-w-4xl">
            <HeroSearch locale={locale} />
          </div>
        </MotionReveal>
        <MotionReveal delay={0.3} className="w-full">
          <AppCtas locale={locale} className="mt-6 justify-center" />
        </MotionReveal>
      </div>
    </section>
  );
}

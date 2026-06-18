'use client';
import { useTranslations } from 'next-intl';
import { MotionReveal } from '@/components/motion/MotionReveal';
import { AppCtas } from '@/components/cta/AppCtas';
import { DeviceMockup } from './DeviceMockup';

export function AppShowcase({ locale }: { locale: string }) {
  const t = useTranslations('Showcase');
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <MotionReveal>
          <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
          <p className="mt-4 text-muted-foreground">{t('body')}</p>
          <AppCtas locale={locale} className="mt-8" />
        </MotionReveal>
        <MotionReveal delay={0.1}>
          <div className="relative">
            <DeviceMockup variant="browser" src="/mockups/web.svg" alt={t('webAlt')} />
            <DeviceMockup
              variant="phone"
              src="/mockups/mobile.svg"
              alt={t('mobileAlt')}
              className="absolute -bottom-8 -right-2 w-28 sm:w-36"
            />
          </div>
        </MotionReveal>
      </div>
    </section>
  );
}

'use client';
import { useTranslations } from 'next-intl';
import { MotionReveal } from '@/components/motion/MotionReveal';
import { AppCtas } from '@/components/cta/AppCtas';

export function CtaSection({ locale }: { locale: string }) {
  const t = useTranslations('Cta');
  return (
    <section className="bg-gradient-to-br from-primary to-secondary">
      <div className="mx-auto max-w-6xl px-4 py-20 text-center">
        <MotionReveal>
          <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
            {t('finalTitle')}
          </h2>
          <p className="mt-4 text-primary-foreground/80">{t('finalSubtitle')}</p>
          <div className="mt-8 flex justify-center">
            <AppCtas locale={locale} />
          </div>
        </MotionReveal>
      </div>
    </section>
  );
}

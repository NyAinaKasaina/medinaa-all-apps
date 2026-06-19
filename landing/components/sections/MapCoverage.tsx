import { useTranslations } from 'next-intl';
import { MotionReveal } from '@/components/motion/MotionReveal';
import { MadagascarMap } from './MadagascarMap';

export function MapCoverage() {
  const t = useTranslations('Coverage');
  return (
    <section id="coverage" className="bg-muted/30">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 lg:grid-cols-2">
        <MotionReveal>
          <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
          <p className="mt-4 text-muted-foreground">{t('body')}</p>
        </MotionReveal>
        <MotionReveal delay={0.1} className="flex justify-center">
          <MadagascarMap title={t('title')} className="w-72 max-w-full drop-shadow-md sm:w-80" />
        </MotionReveal>
      </div>
    </section>
  );
}

import { useTranslations } from 'next-intl';
import { MotionReveal } from '@/components/motion/MotionReveal';

export function HowItWorks() {
  const t = useTranslations('How');
  const steps = [
    { n: 1, title: t('step1Title'), body: t('step1Body') },
    { n: 2, title: t('step2Title'), body: t('step2Body') },
    { n: 3, title: t('step3Title'), body: t('step3Body') },
  ];
  return (
    <section id="how" className="bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <MotionReveal>
          <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
        </MotionReveal>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <MotionReveal key={s.n} delay={i * 0.1}>
              <div className="flex flex-col items-start">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-lg font-bold text-secondary-foreground">
                  {s.n}
                </div>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              </div>
            </MotionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

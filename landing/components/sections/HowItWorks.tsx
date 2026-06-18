import { useTranslations } from 'next-intl';
import { Search, Map, PhoneCall } from 'lucide-react';
import { MotionReveal } from '@/components/motion/MotionReveal';

export function HowItWorks() {
  const t = useTranslations('How');
  const steps = [
    { n: 1, icon: Search, title: t('step1Title'), body: t('step1Body') },
    { n: 2, icon: Map, title: t('step2Title'), body: t('step2Body') },
    { n: 3, icon: PhoneCall, title: t('step3Title'), body: t('step3Body') },
  ];
  return (
    <section id="how" className="bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <MotionReveal>
          <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
        </MotionReveal>

        <div className="relative mt-12">
          {/* Timeline horizontale (desktop) reliant les 3 étapes */}
          <div
            aria-hidden
            className="absolute left-[16.667%] right-[16.667%] top-7 hidden h-0.5 bg-gradient-to-r from-secondary/30 via-secondary to-secondary/30 md:block"
          />
          <div className="grid gap-10 md:grid-cols-3">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <MotionReveal key={s.n} delay={i * 0.12}>
                  <div className="flex flex-col items-center text-center">
                    <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-md ring-8 ring-muted/30">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="mt-3 text-xs font-bold uppercase tracking-widest text-secondary">
                      {`0${s.n}`}
                    </div>
                    <h3 className="mt-1 font-semibold">{s.title}</h3>
                    <p className="mt-2 max-w-xs text-sm text-muted-foreground">{s.body}</p>
                  </div>
                </MotionReveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

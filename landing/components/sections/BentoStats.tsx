import { useTranslations } from 'next-intl';
import { MotionReveal } from '@/components/motion/MotionReveal';
import { CountUp } from '@/components/stats/CountUp';
import type { MedinaaStats } from '@/lib/stats';

export function BentoStats({ stats, locale }: { stats: MedinaaStats; locale: string }) {
  const t = useTranslations('Stats');
  const types = Object.entries(stats.byType).sort((a, b) => b[1] - a[1]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <MotionReveal>
        <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
      </MotionReveal>
      <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MotionReveal className="col-span-2 rounded-2xl bg-primary p-8 text-primary-foreground lg:col-span-2 lg:row-span-2">
          <div className="text-5xl font-extrabold"><CountUp to={stats.total} suffix="+" locale={locale} /></div>
          <p className="mt-2 text-primary-foreground/80">{t('total')}</p>
        </MotionReveal>
        <MotionReveal delay={0.05} className="rounded-2xl border border-border bg-card p-6">
          <div className="text-3xl font-bold text-secondary"><CountUp to={stats.cities} locale={locale} /></div>
          <p className="mt-1 text-sm text-muted-foreground">{t('cities')}</p>
        </MotionReveal>
        <MotionReveal delay={0.1} className="rounded-2xl border border-border bg-card p-6">
          <div className="text-3xl font-bold text-secondary"><CountUp to={stats.withPhone} locale={locale} /></div>
          <p className="mt-1 text-sm text-muted-foreground">{t('withPhone')}</p>
        </MotionReveal>
        <MotionReveal delay={0.12} className="rounded-2xl border border-border bg-card p-6">
          <div className="text-3xl font-bold text-secondary"><CountUp to={stats.withHours} locale={locale} /></div>
          <p className="mt-1 text-sm text-muted-foreground">{t('withHours')}</p>
        </MotionReveal>
        <MotionReveal delay={0.15} className="col-span-2 rounded-2xl border border-border bg-card p-6">
          <p className="text-sm font-semibold">{t('byType')}</p>
          <ul className="mt-3 space-y-2">
            {types.slice(0, 5).map(([type, count]) => (
              <li key={type} className="flex items-center justify-between text-sm">
                <span className="capitalize text-muted-foreground">{type}</span>
                <span className="font-semibold">{count.toLocaleString(locale)}</span>
              </li>
            ))}
          </ul>
        </MotionReveal>
      </div>
    </section>
  );
}

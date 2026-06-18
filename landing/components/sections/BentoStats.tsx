import { useTranslations } from 'next-intl';
import {
  Hospital, MapPin, Phone, Clock, Pill, Stethoscope, Building2, Cross, Plus, Activity,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { MotionReveal } from '@/components/motion/MotionReveal';
import { CountUp } from '@/components/stats/CountUp';
import type { MedinaaStats } from '@/lib/stats';

const TYPE_ICON: Record<string, LucideIcon> = {
  hospital: Hospital,
  pharmacy: Pill,
  doctors: Stethoscope,
  clinic: Building2,
  dentist: Activity,
  health_post: Plus,
  dispensary: Cross,
};

export function BentoStats({ stats, locale }: { stats: MedinaaStats; locale: string }) {
  const t = useTranslations('Stats');
  const types = Object.entries(stats.byType).sort((a, b) => b[1] - a[1]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <MotionReveal>
        <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
      </MotionReveal>
      <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MotionReveal className="relative col-span-2 overflow-hidden rounded-2xl bg-primary p-8 text-primary-foreground lg:col-span-2 lg:row-span-2">
          <Hospital className="pointer-events-none absolute -right-6 -top-6 h-40 w-40 text-primary-foreground/10" strokeWidth={1.5} />
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-foreground/15">
            <Hospital className="h-6 w-6" />
          </div>
          <div className="mt-5 text-5xl font-extrabold"><CountUp to={stats.total} suffix="+" locale={locale} /></div>
          <p className="mt-2 text-primary-foreground/80">{t('total')}</p>
        </MotionReveal>

        <MotionReveal delay={0.05} className="rounded-2xl border border-border bg-card p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary"><MapPin className="h-5 w-5" /></div>
          <div className="mt-3 text-3xl font-bold text-secondary"><CountUp to={stats.cities} locale={locale} /></div>
          <p className="mt-1 text-sm text-muted-foreground">{t('cities')}</p>
        </MotionReveal>

        <MotionReveal delay={0.1} className="rounded-2xl border border-border bg-card p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary"><Phone className="h-5 w-5" /></div>
          <div className="mt-3 text-3xl font-bold text-secondary"><CountUp to={stats.withPhone} locale={locale} /></div>
          <p className="mt-1 text-sm text-muted-foreground">{t('withPhone')}</p>
        </MotionReveal>

        <MotionReveal delay={0.12} className="rounded-2xl border border-border bg-card p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary"><Clock className="h-5 w-5" /></div>
          <div className="mt-3 text-3xl font-bold text-secondary"><CountUp to={stats.withHours} locale={locale} /></div>
          <p className="mt-1 text-sm text-muted-foreground">{t('withHours')}</p>
        </MotionReveal>

        <MotionReveal delay={0.15} className="col-span-2 rounded-2xl border border-border bg-card p-6">
          <p className="text-sm font-semibold">{t('byType')}</p>
          <ul className="mt-4 space-y-3">
            {types.slice(0, 5).map(([type, count]) => {
              const Icon = TYPE_ICON[type] ?? Activity;
              return (
                <li key={type} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2.5 capitalize text-muted-foreground">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-tertiary/10 text-tertiary">
                      <Icon className="h-4 w-4" />
                    </span>
                    {type.replace(/_/g, ' ')}
                  </span>
                  <span className="font-semibold">{count.toLocaleString(locale)}</span>
                </li>
              );
            })}
          </ul>
        </MotionReveal>
      </div>
    </section>
  );
}

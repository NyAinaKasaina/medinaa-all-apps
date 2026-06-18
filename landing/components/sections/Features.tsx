import { useTranslations } from 'next-intl';
import { Filter, LocateFixed, Map, FileText, Route, Languages } from 'lucide-react';
import { MotionReveal } from '@/components/motion/MotionReveal';

export function Features() {
  const t = useTranslations('Features');
  const items = [
    { icon: Filter, title: t('searchTitle'), body: t('searchBody') },
    { icon: LocateFixed, title: t('nearMeTitle'), body: t('nearMeBody') },
    { icon: Map, title: t('mapTitle'), body: t('mapBody') },
    { icon: FileText, title: t('detailsTitle'), body: t('detailsBody') },
    { icon: Route, title: t('routeTitle'), body: t('routeBody') },
    { icon: Languages, title: t('i18nTitle'), body: t('i18nBody') },
  ];
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-20">
      <MotionReveal>
        <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
      </MotionReveal>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ icon: Icon, title, body }, i) => (
          <MotionReveal key={title} delay={i * 0.05}>
            <div className="h-full rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:shadow-lg">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </div>
          </MotionReveal>
        ))}
      </div>
    </section>
  );
}

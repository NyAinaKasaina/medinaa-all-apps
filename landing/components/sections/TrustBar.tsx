import { useTranslations } from 'next-intl';
import { Map, ShieldCheck, Gift, UserX } from 'lucide-react';

export function TrustBar() {
  const t = useTranslations('Trust');
  const items = [
    { icon: Map, label: t('osm') },
    { icon: ShieldCheck, label: t('national') },
    { icon: Gift, label: t('free') },
    { icon: UserX, label: t('noAccount') },
  ];
  return (
    <section className="border-y border-border bg-card">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 py-6 sm:grid-cols-4">
        {items.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon className="h-4 w-4 text-secondary" />
            {label}
          </div>
        ))}
      </div>
    </section>
  );
}

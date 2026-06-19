'use client';
import { useMemo, useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { env } from '@/lib/env';
import { Autocomplete, type AutocompleteOption } from '@/components/ui/Autocomplete';
import { LOCATION_SUGGESTIONS } from '@/lib/madagascar-geo';
import { medicalTypes } from '@/lib/medical-types';

export function HeroSearch({ locale }: { locale: string }) {
  const t = useTranslations('Hero');
  const [q, setQ] = useState('');
  const [loc, setLoc] = useState('');
  // Free-typed locations default to a région filter; switches to district only on an explicit pick.
  const [locKind, setLocKind] = useState<'region' | 'district'>('region');

  const typeOptions = useMemo<AutocompleteOption[]>(
    () => medicalTypes(locale).map((label) => ({ label })),
    [locale],
  );
  const locationOptions = useMemo<AutocompleteOption[]>(
    () => LOCATION_SUGGESTIONS.map((s) => ({ label: s.label, hint: s.hint, value: s.kind })),
    [],
  );

  const params = new URLSearchParams();
  if (q.trim()) params.set('q', q.trim());
  if (loc.trim()) params.set(locKind === 'district' ? 'distrika' : 'faritra', loc.trim());
  const href = `${env.webAppUrl}/?${params.toString()}`;

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-2 shadow-lg sm:flex-row">
      <Autocomplete
        value={q}
        onChange={setQ}
        options={typeOptions}
        placeholder={t('searchPlaceholderType')}
        icon={<Search className="h-5 w-5 shrink-0 text-muted-foreground" />}
      />
      <Autocomplete
        value={loc}
        onChange={(v) => {
          setLoc(v);
          setLocKind('region');
        }}
        onSelect={(opt) => setLocKind(opt.value === 'district' ? 'district' : 'region')}
        options={locationOptions}
        placeholder={t('searchPlaceholderLocation')}
        icon={<MapPin className="h-5 w-5 shrink-0 text-muted-foreground" />}
        className="sm:border-l"
      />
      <a
        href={href}
        className="inline-flex h-12 items-center justify-center rounded-xl bg-tertiary px-6 font-semibold text-tertiary-foreground hover:bg-tertiary/90"
      >
        {t('searchButton')}
      </a>
    </div>
  );
}

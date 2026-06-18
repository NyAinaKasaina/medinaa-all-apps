'use client';
import { useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { env } from '@/lib/env';

export function SearchBarMock({ locale }: { locale: string }) {
  const t = useTranslations('Hero');
  const [q, setQ] = useState('');
  const [city, setCity] = useState('');
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (city) params.set('city', city);
  const href = `${env.webAppUrl}/?${params.toString()}`;

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-2 shadow-lg sm:flex-row">
      <div className="flex flex-1 items-center gap-2 px-3">
        <Search className="h-5 w-5 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('searchPlaceholderType')}
          className="h-12 w-full bg-transparent outline-none"
          aria-label={t('searchPlaceholderType')}
        />
      </div>
      <div className="flex flex-1 items-center gap-2 border-border px-3 sm:border-l">
        <MapPin className="h-5 w-5 text-muted-foreground" />
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder={t('searchPlaceholderCity')}
          className="h-12 w-full bg-transparent outline-none"
          aria-label={t('searchPlaceholderCity')}
        />
      </div>
      <a
        href={href}
        className="inline-flex h-12 items-center justify-center rounded-xl bg-tertiary px-6 font-semibold text-tertiary-foreground hover:bg-tertiary/90"
      >
        {t('searchButton')}
      </a>
    </div>
  );
}

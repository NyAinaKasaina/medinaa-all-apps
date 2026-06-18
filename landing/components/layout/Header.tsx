'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';
import { env } from '@/lib/env';
import { LangSwitcher } from './LangSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { MobileNav } from './MobileNav';

const ANCHORS = [
  { id: 'features', key: 'features' },
  { id: 'how', key: 'how' },
  { id: 'coverage', key: 'coverage' },
  { id: 'faq', key: 'faq' },
] as const;

export function Header({ locale }: { locale: string }) {
  const t = useTranslations('Nav');
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-colors',
        scrolled ? 'border-b border-border bg-background/80 backdrop-blur' : 'bg-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <a href={`/${locale}`} className="text-lg font-bold tracking-tight text-primary">
          Medinaa
        </a>
        <nav className="hidden items-center gap-6 md:flex">
          {ANCHORS.map((a) => (
            <a key={a.id} href={`#${a.id}`} className="text-sm text-muted-foreground hover:text-foreground">
              {t(a.key)}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LangSwitcher current={locale} />
          <ThemeToggle label={t('themeToggle')} />
          <a
            href={env.webAppUrl}
            className="hidden h-9 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 sm:inline-flex"
          >
            {t('openWebApp')}
          </a>
          <MobileNav locale={locale} />
        </div>
      </div>
    </header>
  );
}

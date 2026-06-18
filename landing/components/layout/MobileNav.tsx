'use client';
import { Menu } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { env } from '@/lib/env';
import {
  Sheet, SheetContent, SheetTrigger, SheetTitle,
} from '@/components/ui/sheet';

const ANCHORS = ['features', 'how', 'coverage', 'faq'] as const;

export function MobileNav({ locale }: { locale: string }) {
  const t = useTranslations('Nav');
  return (
    <Sheet>
      <SheetTrigger aria-label={t('menu')} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border md:hidden">
        <Menu className="h-4 w-4" />
      </SheetTrigger>
      <SheetContent side="right">
        <SheetTitle className="sr-only">{t('menu')}</SheetTitle>
        <nav className="mt-8 flex flex-col gap-4">
          {ANCHORS.map((a) => (
            <a key={a} href={`#${a}`} className="text-base">{t(a)}</a>
          ))}
          <a href={`${env.webAppUrl}/login`} className="mt-2 inline-flex h-11 items-center justify-center rounded-md border border-border font-semibold">
            {t('login')}
          </a>
          <a href={`${env.webAppUrl}/register`} className="inline-flex h-11 items-center justify-center rounded-md bg-primary font-semibold text-primary-foreground">
            {t('signUp')}
          </a>
        </nav>
      </SheetContent>
    </Sheet>
  );
}

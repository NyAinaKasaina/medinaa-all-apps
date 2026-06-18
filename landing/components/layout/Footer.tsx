import { useTranslations } from 'next-intl';
import { LangSwitcher } from './LangSwitcher';

export function Footer({ locale }: { locale: string }) {
  const t = useTranslations('Footer');
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          <div>
            <p className="text-lg font-bold text-primary">Medinaa</p>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">{t('osmAttribution')}</p>
          </div>
          <nav className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <a href={`/${locale}/about`} className="hover:text-primary">{t('about')}</a>
            <a href={`/${locale}/contact`} className="hover:text-primary">{t('contact')}</a>
            <a href={`/${locale}/legal`} className="hover:text-primary">{t('legal')}</a>
            <a href={`/${locale}/privacy`} className="hover:text-primary">{t('privacy')}</a>
          </nav>
          <LangSwitcher current={locale} />
        </div>
        <p className="mt-8 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Medinaa. {t('rights')}
        </p>
      </div>
    </footer>
  );
}

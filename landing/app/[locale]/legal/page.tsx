import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default async function LegalPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Footer');
  return (
    <>
      <Header locale={locale} />
      <main className="mx-auto max-w-3xl px-4 py-20">
        <h1 className="text-3xl font-bold">{t('legal')}</h1>
        <p className="mt-4 text-muted-foreground">{t('osmAttribution')}</p>
      </main>
      <Footer locale={locale} />
    </>
  );
}

import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { env } from '@/lib/env';

export async function buildMetadata(locale: string): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'Meta' });
  const languages = Object.fromEntries(
    routing.locales.map((l) => [l, `${env.siteUrl}/${l}`]),
  );
  return {
    metadataBase: new URL(env.siteUrl),
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: `${env.siteUrl}/${locale}`,
      languages: { ...languages, 'x-default': `${env.siteUrl}/${routing.defaultLocale}` },
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `${env.siteUrl}/${locale}`,
      siteName: 'Medinaa',
      locale,
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title: t('title'), description: t('description') },
  };
}

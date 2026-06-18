import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { env } from '@/lib/env';

export default function sitemap(): MetadataRoute.Sitemap {
  return routing.locales.map((locale) => ({
    url: `${env.siteUrl}/${locale}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: locale === routing.defaultLocale ? 1 : 0.8,
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, `${env.siteUrl}/${l}`]),
      ),
    },
  }));
}

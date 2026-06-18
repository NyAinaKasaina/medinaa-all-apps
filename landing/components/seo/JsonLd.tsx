import { env } from '@/lib/env';

export function JsonLd({ locale }: { locale: string }) {
  const data = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Medinaa',
      url: env.siteUrl,
      logo: `${env.siteUrl}/logo.png`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Medinaa',
      url: `${env.siteUrl}/${locale}`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'MobileApplication',
      name: 'Medinaa',
      operatingSystem: 'ANDROID',
      applicationCategory: 'MedicalApplication',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'MGA' },
      installUrl: env.playStoreUrl,
    },
  ];
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

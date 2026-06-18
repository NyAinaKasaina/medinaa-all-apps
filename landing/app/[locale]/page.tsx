import { setRequestLocale } from 'next-intl/server';
import { getStats } from '@/lib/stats';
import { JsonLd } from '@/components/seo/JsonLd';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Hero } from '@/components/sections/Hero';
import { TrustBar } from '@/components/sections/TrustBar';
import { BentoStats } from '@/components/sections/BentoStats';
import { Features } from '@/components/sections/Features';
import { HowItWorks } from '@/components/sections/HowItWorks';
import { AppShowcase } from '@/components/sections/AppShowcase';
import { MapCoverage } from '@/components/sections/MapCoverage';
import { Faq } from '@/components/sections/Faq';
import { CtaSection } from '@/components/sections/CtaSection';
import { AnalyticsBeacon } from '@/components/analytics/AnalyticsBeacon';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const stats = await getStats();

  return (
    <>
      <JsonLd locale={locale} />
      <Header locale={locale} />
      <main>
        <Hero locale={locale} total={stats.total} />
        <TrustBar />
        <BentoStats stats={stats} />
        <Features />
        <HowItWorks />
        <AppShowcase locale={locale} />
        <MapCoverage />
        <Faq />
        <CtaSection locale={locale} />
      </main>
      <Footer locale={locale} />
      <AnalyticsBeacon locale={locale} />
    </>
  );
}

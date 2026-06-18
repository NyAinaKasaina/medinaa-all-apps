import { setRequestLocale } from 'next-intl/server';
import dynamic from 'next/dynamic';
import { getStats } from '@/lib/stats';
import { JsonLd } from '@/components/seo/JsonLd';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Hero } from '@/components/sections/Hero';
import { TrustBar } from '@/components/sections/TrustBar';
import { AnalyticsBeacon } from '@/components/analytics/AnalyticsBeacon';

// Below-the-fold sections loaded lazily to keep TBT low
const BentoStats = dynamic(() => import('@/components/sections/BentoStats').then(m => ({ default: m.BentoStats })));
const Features = dynamic(() => import('@/components/sections/Features').then(m => ({ default: m.Features })));
const HowItWorks = dynamic(() => import('@/components/sections/HowItWorks').then(m => ({ default: m.HowItWorks })));
const AppShowcase = dynamic(() => import('@/components/sections/AppShowcase').then(m => ({ default: m.AppShowcase })));
const MapCoverage = dynamic(() => import('@/components/sections/MapCoverage').then(m => ({ default: m.MapCoverage })));
const Faq = dynamic(() => import('@/components/sections/Faq').then(m => ({ default: m.Faq })));
const CtaSection = dynamic(() => import('@/components/sections/CtaSection').then(m => ({ default: m.CtaSection })));

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
        <BentoStats stats={stats} locale={locale} />
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

import { ImageResponse } from 'next/og';
import { getTranslations } from 'next-intl/server';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Og({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Meta' });
  return new ImageResponse(
    (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: '#1070C0', color: '#fff', padding: 80, justifyContent: 'center' }}>
        <div style={{ fontSize: 64, fontWeight: 800 }}>Medinaa</div>
        <div style={{ fontSize: 36, marginTop: 16 }}>{t('tagline')}</div>
      </div>
    ),
    size,
  );
}

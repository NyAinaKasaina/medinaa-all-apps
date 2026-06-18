export const env = {
  backendApiUrl: process.env.BACKEND_API_URL ?? '',
  webAppUrl: process.env.NEXT_PUBLIC_WEB_APP_URL ?? 'https://app.medinaa.mg',
  playStoreUrl:
    process.env.NEXT_PUBLIC_PLAY_STORE_URL ??
    'https://play.google.com/store/apps/details?id=mg.medinaa',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://medinaa.mg',
} as const;

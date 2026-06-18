import createNextIntlPlugin from 'next-intl/plugin';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: { formats: ['image/avif', 'image/webp'] },
  poweredByHeader: false,
  turbopack: { root: __dirname },
};

export default withNextIntl(nextConfig);

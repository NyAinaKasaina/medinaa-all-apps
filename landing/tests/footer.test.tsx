import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/fr.json';
import { Footer } from '@/components/layout/Footer';

vi.mock('@/i18n/navigation', () => ({
  usePathname: () => '/',
  Link: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

describe('Footer', () => {
  it('affiche l’attribution OpenStreetMap', () => {
    render(
      <NextIntlClientProvider locale="fr" messages={messages}>
        <Footer locale="fr" />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText(messages.Footer.osmAttribution)).toBeInTheDocument();
  });
});

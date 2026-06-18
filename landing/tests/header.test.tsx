import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/fr.json';
import { Header } from '@/components/layout/Header';

vi.mock('@/i18n/navigation', () => ({
  usePathname: () => '/',
  Link: ({ children, href }: any) => <a href={href}>{children}</a>,
}));
vi.mock('next-themes', () => ({ useTheme: () => ({ resolvedTheme: 'light', setTheme: vi.fn() }) }));
vi.mock('@/lib/device', () => ({ useIsAndroid: () => false }));

describe('Header', () => {
  it('affiche les liens de navigation', () => {
    render(
      <NextIntlClientProvider locale="fr" messages={messages}>
        <Header locale="fr" />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText(messages.Nav.features)).toBeInTheDocument();
    expect(screen.getByText(messages.Nav.faq)).toBeInTheDocument();
  });
});

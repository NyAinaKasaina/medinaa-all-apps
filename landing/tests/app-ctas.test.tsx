import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/fr.json';
import { AppCtas } from '@/components/cta/AppCtas';

vi.mock('@/lib/device', () => ({ useIsAndroid: () => false }));

function wrap(ui: React.ReactNode) {
  return <NextIntlClientProvider locale="fr" messages={messages}>{ui}</NextIntlClientProvider>;
}

describe('AppCtas', () => {
  it('affiche les deux CTA avec les bonnes URLs', () => {
    render(wrap(<AppCtas locale="fr" />));
    const web = screen.getByRole('link', { name: messages.Cta.webApp });
    expect(web).toHaveAttribute('href', expect.stringContaining('app.medinaa.mg'));
    const play = screen.getByRole('link', { name: messages.Cta.playStore });
    expect(play).toHaveAttribute('href', expect.stringContaining('play.google.com'));
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/fr.json';
import { AppCtas } from '@/components/cta/AppCtas';

import type { DeviceKind } from '@/lib/device';

const mockUseIsAndroid = vi.fn(() => false);
const mockDetectDevice = vi.fn((): DeviceKind => 'desktop');

vi.mock('@/lib/device', () => ({
  useIsAndroid: () => mockUseIsAndroid(),
  detectDevice: (...args: Parameters<typeof mockDetectDevice>) => mockDetectDevice(...args),
}));

const mockTrack = vi.fn();
vi.mock('@/lib/analytics', () => ({
  track: (...args: unknown[]) => mockTrack(...args),
}));

beforeEach(() => {
  mockUseIsAndroid.mockReturnValue(false);
  mockDetectDevice.mockReturnValue('desktop');
  mockTrack.mockReset();
});

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

  describe('comportement Android', () => {
    beforeEach(() => {
      mockUseIsAndroid.mockReturnValue(true);
      mockDetectDevice.mockReturnValue('android');
    });

    it('Play Store apparaît avant le lien web-app dans le DOM', () => {
      render(wrap(<AppCtas locale="fr" />));
      const links = screen.getAllByRole('link');
      const playIndex = links.findIndex(l => l.getAttribute('href')?.includes('play.google.com'));
      const webIndex = links.findIndex(l => l.getAttribute('href')?.includes('app.medinaa.mg'));
      expect(playIndex).toBeLessThan(webIndex);
    });

    it('clic Play Store appelle track avec target play_store', async () => {
      render(wrap(<AppCtas locale="fr" />));
      const playLink = screen.getByRole('link', { name: messages.Cta.playStore });
      await userEvent.click(playLink);
      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({ meta: expect.objectContaining({ target: 'play_store' }) }),
      );
    });

    it('clic web-app appelle track avec target web_app', async () => {
      render(wrap(<AppCtas locale="fr" />));
      const webLink = screen.getByRole('link', { name: messages.Cta.webApp });
      await userEvent.click(webLink);
      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({ meta: expect.objectContaining({ target: 'web_app' }) }),
      );
    });
  });
});

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/fr.json';
import { CtaSection } from '@/components/sections/CtaSection';

vi.mock('@/lib/device', () => ({ useIsAndroid: () => false }));

describe('CtaSection', () => {
  it('rend le titre final', () => {
    render(<NextIntlClientProvider locale="fr" messages={messages}><CtaSection locale="fr" /></NextIntlClientProvider>);
    expect(screen.getByText(messages.Cta.finalTitle)).toBeInTheDocument();
  });
});

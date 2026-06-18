import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/fr.json';
import { TrustBar } from '@/components/sections/TrustBar';

describe('TrustBar', () => {
  it('affiche les 4 signaux de confiance', () => {
    render(<NextIntlClientProvider locale="fr" messages={messages}><TrustBar /></NextIntlClientProvider>);
    expect(screen.getByText(messages.Trust.osm)).toBeInTheDocument();
    expect(screen.getByText(messages.Trust.free)).toBeInTheDocument();
  });
});

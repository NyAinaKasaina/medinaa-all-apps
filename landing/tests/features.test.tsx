import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/fr.json';
import { Features } from '@/components/sections/Features';

describe('Features', () => {
  it('rend les cartes fonctionnalités', () => {
    render(<NextIntlClientProvider locale="fr" messages={messages}><Features /></NextIntlClientProvider>);
    expect(screen.getByText(messages.Features.searchTitle)).toBeInTheDocument();
    expect(screen.getByText(messages.Features.nearMeTitle)).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/fr.json';
import { HowItWorks } from '@/components/sections/HowItWorks';

describe('HowItWorks', () => {
  it('rend les 3 étapes', () => {
    render(<NextIntlClientProvider locale="fr" messages={messages}><HowItWorks /></NextIntlClientProvider>);
    expect(screen.getByText(messages.How.step1Title)).toBeInTheDocument();
    expect(screen.getByText(messages.How.step3Title)).toBeInTheDocument();
  });
});

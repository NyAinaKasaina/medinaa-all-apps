import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/fr.json';
import { Faq } from '@/components/sections/Faq';

describe('Faq', () => {
  it('rend les questions', () => {
    render(<NextIntlClientProvider locale="fr" messages={messages}><Faq /></NextIntlClientProvider>);
    expect(screen.getByText(messages.Faq.q1)).toBeInTheDocument();
    expect(screen.getByText(messages.Faq.q5)).toBeInTheDocument();
  });
});

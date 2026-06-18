import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/fr.json';
import { BentoStats } from '@/components/sections/BentoStats';
import { FALLBACK_STATS } from '@/lib/stats';

describe('BentoStats', () => {
  it('affiche le titre de section et les libellés', () => {
    render(
      <NextIntlClientProvider locale="fr" messages={messages}>
        <BentoStats stats={FALLBACK_STATS} />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText(messages.Stats.title)).toBeInTheDocument();
    expect(screen.getByText(messages.Stats.total)).toBeInTheDocument();
  });
});

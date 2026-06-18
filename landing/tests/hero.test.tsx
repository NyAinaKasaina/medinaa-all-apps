import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/fr.json';
import { Hero } from '@/components/sections/Hero';

vi.mock('@/lib/device', () => ({ useIsAndroid: () => false }));

describe('Hero', () => {
  it('rend le titre et le compte d\'établissements', () => {
    render(
      <NextIntlClientProvider locale="fr" messages={messages}>
        <Hero locale="fr" total={2173} />
      </NextIntlClientProvider>,
    );
    expect(screen.getByRole('heading', { level: 1, name: messages.Hero.title })).toBeInTheDocument();
    expect(screen.getByText(/2\s?173/)).toBeInTheDocument();
  });
});

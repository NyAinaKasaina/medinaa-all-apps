import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/fr.json';
import { MapCoverage } from '@/components/sections/MapCoverage';

vi.mock('next/image', () => ({ default: (p: any) => <img alt={p.alt} src={p.src} /> }));

describe('MapCoverage', () => {
  it('rend le titre de couverture', () => {
    render(<NextIntlClientProvider locale="fr" messages={messages}><MapCoverage /></NextIntlClientProvider>);
    expect(screen.getByText(messages.Coverage.title)).toBeInTheDocument();
  });
});

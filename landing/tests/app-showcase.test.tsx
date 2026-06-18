import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/fr.json';
import { AppShowcase } from '@/components/sections/AppShowcase';

vi.mock('@/lib/device', () => ({ useIsAndroid: () => false }));
vi.mock('next/image', () => ({ default: (p: any) => <img alt={p.alt} src={p.src} /> }));

describe('AppShowcase', () => {
  it('rend le titre + les deux mockups (alt)', () => {
    render(<NextIntlClientProvider locale="fr" messages={messages}><AppShowcase locale="fr" /></NextIntlClientProvider>);
    expect(screen.getByText(messages.Showcase.title)).toBeInTheDocument();
    expect(screen.getByAltText(messages.Showcase.webAlt)).toBeInTheDocument();
    expect(screen.getByAltText(messages.Showcase.mobileAlt)).toBeInTheDocument();
  });
});

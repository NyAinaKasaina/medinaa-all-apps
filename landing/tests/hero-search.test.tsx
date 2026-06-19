import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/fr.json';
import { HeroSearch } from '@/components/sections/HeroSearch';

function wrap() {
  return (
    <NextIntlClientProvider locale="fr" messages={messages}>
      <HeroSearch locale="fr" />
    </NextIntlClientProvider>
  );
}

describe('HeroSearch', () => {
  it('construit un deep-link vers l\'app web avec la requête (q=)', async () => {
    render(wrap());
    await userEvent.type(screen.getByPlaceholderText(messages.Hero.searchPlaceholderType), 'pharmacie');
    const link = screen.getByRole('link', { name: messages.Hero.searchButton });
    expect(link.getAttribute('href')).toContain('q=pharmacie');
  });

  it('propose des suggestions de type et les sélectionne (autocomplete)', async () => {
    render(wrap());
    const input = screen.getByPlaceholderText(messages.Hero.searchPlaceholderType) as HTMLInputElement;
    await userEvent.type(input, 'pharm');
    await userEvent.click(await screen.findByRole('option', { name: /Pharmacie/ }));
    expect(input.value).toBe('Pharmacie');
  });

  it('émet faritra= quand une région est choisie', async () => {
    render(wrap());
    await userEvent.type(screen.getByPlaceholderText(messages.Hero.searchPlaceholderLocation), 'Diana');
    await userEvent.click(await screen.findByRole('option', { name: 'Diana' }));
    const link = screen.getByRole('link', { name: messages.Hero.searchButton });
    expect(link.getAttribute('href')).toContain('faritra=Diana');
  });

  it('émet distrika= quand un district est choisi', async () => {
    render(wrap());
    await userEvent.type(screen.getByPlaceholderText(messages.Hero.searchPlaceholderLocation), 'Antalaha');
    await userEvent.click(await screen.findByRole('option', { name: /Antalaha/ }));
    const link = screen.getByRole('link', { name: messages.Hero.searchButton });
    expect(link.getAttribute('href')).toContain('distrika=Antalaha');
  });
});

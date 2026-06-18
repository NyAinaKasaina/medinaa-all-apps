import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/fr.json';
import { SearchBarMock } from '@/components/sections/SearchBarMock';

describe('SearchBarMock', () => {
  it('construit un lien deep-link vers l\'app web avec la requête', async () => {
    render(
      <NextIntlClientProvider locale="fr" messages={messages}>
        <SearchBarMock locale="fr" />
      </NextIntlClientProvider>,
    );
    await userEvent.type(screen.getByPlaceholderText(messages.Hero.searchPlaceholderType), 'pharmacie');
    const link = screen.getByRole('link', { name: messages.Hero.searchButton });
    expect(link.getAttribute('href')).toContain('q=pharmacie');
  });
});

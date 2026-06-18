import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect } from 'vitest';
import messages from '@/messages/fr.json';

function Title() {
  return <h1>{messages.Hero.title}</h1>;
}

describe('localized title', () => {
  it('rend le titre FR du hero', () => {
    render(
      <NextIntlClientProvider locale="fr" messages={messages}>
        <Title />
      </NextIntlClientProvider>,
    );
    expect(
      screen.getByRole('heading', { name: messages.Hero.title }),
    ).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LangSwitcher } from '@/components/layout/LangSwitcher';

vi.mock('@/i18n/navigation', () => ({
  usePathname: () => '/',
  Link: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

describe('LangSwitcher', () => {
  it('liste les 3 langues', () => {
    render(<LangSwitcher current="fr" />);
    expect(screen.getByText('FR')).toBeInTheDocument();
  });
});

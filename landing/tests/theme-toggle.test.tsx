import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

const setTheme = vi.fn();
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light', setTheme, resolvedTheme: 'light' }),
}));

describe('ThemeToggle', () => {
  it('bascule en sombre au clic', async () => {
    render(<ThemeToggle label="Changer de thème" />);
    await userEvent.click(screen.getByRole('button', { name: 'Changer de thème' }));
    expect(setTheme).toHaveBeenCalledWith('dark');
  });
});

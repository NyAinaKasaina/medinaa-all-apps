import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MadagascarMap } from '@/components/sections/MadagascarMap';
import { REGIONS } from '@/lib/madagascar-geo';

describe('MadagascarMap', () => {
  it('rend un point (titre = nom de région) par région', () => {
    const { container } = render(<MadagascarMap title="Carte" />);
    const titles = Array.from(container.querySelectorAll('title')).map((t) => t.textContent);
    expect(titles).toHaveLength(REGIONS.length);
    expect(titles).toContain('Analamanga');
    expect(titles).toContain('Diana');
  });

  it('rend deux cercles par région (halo + point solide)', () => {
    const { container } = render(<MadagascarMap title="Carte" />);
    expect(container.querySelectorAll('circle')).toHaveLength(REGIONS.length * 2);
  });
});

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MotionReveal } from '@/components/motion/MotionReveal';

describe('MotionReveal', () => {
  it('rend ses enfants', () => {
    render(<MotionReveal><p>contenu</p></MotionReveal>);
    expect(screen.getByText('contenu')).toBeInTheDocument();
  });
});

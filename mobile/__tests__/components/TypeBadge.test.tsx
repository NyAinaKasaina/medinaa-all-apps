import React from 'react'
import { render, screen } from '@testing-library/react-native'
import TypeBadge, { getTypeConfig } from '@/components/entity/TypeBadge'
import '@/i18n/index'

it('returns hospital config with red color', () => {
  const cfg = getTypeConfig('hospital')
  expect(cfg.color).toBe('#dc2626')
})

it('uses fallback for unknown type', () => {
  const cfg = getTypeConfig('unknown_type')
  expect(cfg.icon).toBe('add-circle-outline')
})

it('renders without crashing for undefined type', () => {
  render(<TypeBadge />)
  expect(screen.getByText(/all|Rehetra|Tous/i)).toBeTruthy()
})

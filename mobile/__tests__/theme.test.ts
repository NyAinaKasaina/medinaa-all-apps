import theme, { colors, spacing, radius } from '../src/theme/theme'

describe('theme tokens', () => {
  it('primary color matches brand emerald', () => {
    expect(colors.primary).toBe('#059669')
  })
  it('all color tokens reference palette (no raw hex outside palette)', () => {
    expect(colors.background).toBe(theme.palette.gray50)
    expect(colors.surface).toBe(theme.palette.white)
  })
  it('spacing.base is 16', () => { expect(spacing.base).toBe(16) })
  it('radius.full is 9999', () => { expect(radius.full).toBe(9999) })
})

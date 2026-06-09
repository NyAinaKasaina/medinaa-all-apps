export const palette = {
  emerald50:  '#ecfdf5', emerald100: '#d1fae5', emerald400: '#34d399',
  emerald500: '#10b981', emerald600: '#059669', emerald700: '#047857',
  white: '#ffffff', gray50: '#f9fafb', gray100: '#f3f4f6',
  gray200: '#e5e7eb', gray300: '#d1d5db', gray400: '#9ca3af',
  gray500: '#6b7280', gray700: '#374151', gray900: '#111827',
  red500: '#ef4444', red50: '#fef2f2', amber500: '#f59e0b',
  amber50: '#fffbeb', blue500: '#3b82f6', blue50: '#eff6ff',
}

export const colors = {
  primary: palette.emerald600, primaryLight: palette.emerald100,
  primaryDark: palette.emerald700, secondary: palette.emerald400,
  background: palette.gray50, surface: palette.white,
  surfaceAlt: palette.gray100,
  text: palette.gray900, textSecondary: palette.gray500,
  textDisabled: palette.gray300, textOnPrimary: palette.white,
  border: palette.gray200, borderStrong: palette.gray300,
  error: palette.red500, errorBg: palette.red50,
  warning: palette.amber500, warningBg: palette.amber50,
  info: palette.blue500, infoBg: palette.blue50,
  success: palette.emerald500, successBg: palette.emerald50,
}

export const typography = {
  fontFamily: { regular: 'System', medium: 'System', bold: 'System' },
  fontSize: { xs: 11, sm: 13, base: 15, md: 16, lg: 18, xl: 20, '2xl': 24, '3xl': 30 },
  fontWeight: {
    regular: '400' as const, medium: '500' as const,
    semibold: '600' as const, bold: '700' as const,
  },
  lineHeight: { tight: 1.2, normal: 1.5, loose: 1.8 },
}

export const spacing = {
  xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24, '2xl': 32, '3xl': 48,
}

export const radius = { sm: 6, md: 10, lg: 16, xl: 24, full: 9999 }

export const shadow = {
  sm: { shadowColor: palette.gray900, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2, elevation: 2 },
  md: { shadowColor: palette.gray900, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 6, elevation: 4 },
  lg: { shadowColor: palette.gray900, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.14, shadowRadius: 12, elevation: 8 },
}

export const theme = { colors, typography, spacing, radius, shadow, palette }
export type Theme = typeof theme
export default theme

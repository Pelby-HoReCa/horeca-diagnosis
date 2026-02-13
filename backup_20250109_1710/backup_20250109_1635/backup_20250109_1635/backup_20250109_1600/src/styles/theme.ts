export const palette = {
  primaryBlue: '#112677',
  primaryOrange: '#E84411',
  midnightBlue: '#0B1A4A',
  accentBlue: '#3C5AFF',
  white: '#FFFFFF',
  background: '#F5F6FA',
  gray100: '#F5F6FA',
  gray200: '#E7E9F2',
  gray300: '#D4D7E2',
  gray400: '#B5BACD',
  gray500: '#8A91AB',
  gray600: '#636984',
  gray700: '#3C4159',
  success: '#03A66A',
  warning: '#FFAD1F',
  error: '#FF4D57',
};

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  heading1: {
    fontSize: 28,
    fontWeight: '600' as const,
    lineHeight: 34,
    color: palette.primaryBlue,
  },
  heading2: {
    fontSize: 22,
    fontWeight: '600' as const,
    lineHeight: 28,
    color: palette.primaryBlue,
  },
  heading3: {
    fontSize: 18,
    fontWeight: '500' as const,
    lineHeight: 24,
    color: palette.primaryBlue,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 22,
    color: palette.gray600,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 18,
    color: palette.gray600,
  },
};

export const radii = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 999,
};

export const shadows = {
  card: {
    shadowColor: palette.midnightBlue,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },
  floating: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
};

export const buttonHeights = {
  sm: 40,
  md: 48,
  lg: 52,
};

export const breakpoints = {
  compactWidth: 360,
};

export type ThemePalette = typeof palette;
export type ThemeSpacing = typeof spacing;
export type ThemeTypography = typeof typography;




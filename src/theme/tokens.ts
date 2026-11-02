import type { TextStyle } from 'react-native';

/** The concrete palette in use. */
export type ThemeScheme = 'light' | 'dark';

/** What the user picked: follow the system, or force a palette. */
export type ThemeMode = 'system' | ThemeScheme;

export interface ThemeColors {
  primary: string;
  primarySoft: string;
  onPrimary: string;
  secondary: string;
  secondarySoft: string;
  onSecondary: string;
  background: string;
  surface: string;
  surfaceMuted: string;
  surfaceElevated: string;
  text: string;
  textMuted: string;
  border: string;
  overlay: string;
  safe: string;
  safeSoft: string;
  onSafe: string;
  warning: string;
  warningSoft: string;
  onWarning: string;
  danger: string;
  dangerSoft: string;
  onDanger: string;
  inverseSurface: string;
  inverseText: string;
  inverseAccent: string;
}

export const lightColors: ThemeColors = {
  primary: '#7C3AED',
  primarySoft: '#EDE9FE',
  onPrimary: '#FFFFFF',
  secondary: '#0F766E',
  secondarySoft: '#CCFBF1',
  onSecondary: '#FFFFFF',
  background: '#F7F5FB',
  surface: '#FFFFFF',
  surfaceMuted: '#F1EEF8',
  surfaceElevated: '#FFFFFF',
  text: '#1D1A24',
  textMuted: '#6B6479',
  border: '#E4DFEE',
  overlay: 'rgba(23, 16, 35, 0.48)',
  safe: '#15803D',
  safeSoft: '#DCFCE7',
  onSafe: '#FFFFFF',
  warning: '#B45309',
  warningSoft: '#FEF3C7',
  onWarning: '#FFFFFF',
  danger: '#B91C1C',
  dangerSoft: '#FEE2E2',
  onDanger: '#FFFFFF',
  inverseSurface: '#211D29',
  inverseText: '#F7F5FB',
  inverseAccent: '#C4B5FD',
};

export const darkColors: ThemeColors = {
  primary: '#A78BFA',
  primarySoft: '#2B2140',
  onPrimary: '#1B1029',
  secondary: '#2DD4BF',
  secondarySoft: '#10312D',
  onSecondary: '#042F2E',
  background: '#0F0D13',
  surface: '#191620',
  surfaceMuted: '#241F2E',
  surfaceElevated: '#211D29',
  text: '#F2EFF8',
  textMuted: '#A7A1B5',
  border: '#312B3D',
  overlay: 'rgba(0, 0, 0, 0.6)',
  safe: '#4ADE80',
  safeSoft: '#14351F',
  onSafe: '#052E16',
  warning: '#FBBF24',
  warningSoft: '#3A2A0A',
  onWarning: '#3B2600',
  danger: '#F87171',
  dangerSoft: '#3B1417',
  onDanger: '#450A0A',
  inverseSurface: '#2C2638',
  inverseText: '#F5F2FA',
  inverseAccent: '#C4B5FD',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  display: 40,
} as const;

export const lineHeight = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 26,
  xl: 28,
  xxl: 34,
  display: 48,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const satisfies Record<string, TextStyle['fontWeight']>;

export const layout = {
  minTouchTarget: 48,
  tickCrossSize: 56,
  dotSize: 8,
  stepperValueWidth: 64,
  swatchSize: 40,
  sheetHandleWidth: 40,
  sheetHandleHeight: 4,
  sheetMaxWidth: 640,
} as const;

export interface AppTheme {
  scheme: ThemeScheme;
  isDark: boolean;
  colors: ThemeColors;
  spacing: typeof spacing;
  radii: typeof radii;
  fontSize: typeof fontSize;
  lineHeight: typeof lineHeight;
  fontWeight: typeof fontWeight;
  layout: typeof layout;
}

export const lightTheme: AppTheme = {
  scheme: 'light',
  isDark: false,
  colors: lightColors,
  spacing,
  radii,
  fontSize,
  lineHeight,
  fontWeight,
  layout,
};

export const darkTheme: AppTheme = {
  scheme: 'dark',
  isDark: true,
  colors: darkColors,
  spacing,
  radii,
  fontSize,
  lineHeight,
  fontWeight,
  layout,
};

/** Resolve the palette for a mode, treating a missing system value as light. */
export function resolveColorScheme(
  override: ThemeMode,
  systemScheme: ThemeScheme | null | undefined,
): ThemeScheme {
  if (override === 'system') return systemScheme === 'dark' ? 'dark' : 'light';
  return override;
}

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
  lab: string;
  labSoft: string;
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
  dangerBorder: string;
  safeBorder: string;
  onDanger: string;
  inverseSurface: string;
  inverseText: string;
  inverseAccent: string;
}

export const lightColors: ThemeColors = {
  primary: '#1C4A3B',
  primarySoft: '#E3ECE4',
  onPrimary: '#FFFFFF',
  secondary: '#98511D',
  secondarySoft: '#FCEDDD',
  onSecondary: '#FFFFFF',
  lab: '#7248C4',
  labSoft: '#F0E9FF',
  background: '#FAF7F2',
  surface: '#FFFFFF',
  surfaceMuted: '#F4EDE2',
  surfaceElevated: '#FFFFFF',
  text: '#1A1A1A',
  textMuted: '#6B6862',
  border: '#EDE7DC',
  overlay: 'rgba(23, 16, 35, 0.48)',
  safe: '#1C4A3B',
  safeSoft: '#E3ECE4',
  onSafe: '#FFFFFF',
  warning: '#98511D',
  warningSoft: '#FCEDDD',
  onWarning: '#FFFFFF',
  danger: '#B3261E',
  dangerSoft: '#FCEBE9',
  dangerBorder: '#F5C7C2',
  safeBorder: '#D2DFD4',
  onDanger: '#FFFFFF',
  inverseSurface: '#14382C',
  inverseText: '#FAF7F2',
  inverseAccent: '#BFD3C1',
};

export const darkColors: ThemeColors = {
  primary: '#A78BFA',
  primarySoft: '#2B2140',
  onPrimary: '#1B1029',
  secondary: '#2DD4BF',
  secondarySoft: '#10312D',
  onSecondary: '#042F2E',
  lab: '#C4B5FD',
  labSoft: '#2E2450',
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
  dangerBorder: '#6E2A2A',
  safeBorder: '#28533A',
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
  subject: 24,
  hero: 34,
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
  numberFontFamily: string;
  headlineFontFamily: string;
}

export const numberFontFamily = 'Newsreader';
export const headlineFontFamily = 'Newsreader_700Bold';
export const bodyFontFamily = 'PlusJakartaSans_400Regular';

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
  numberFontFamily,
  headlineFontFamily,
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
  numberFontFamily,
  headlineFontFamily,
};

/** Resolve the palette for a mode, treating a missing system value as light. */
export function resolveColorScheme(
  override: ThemeMode,
  systemScheme: ThemeScheme | null | undefined,
): ThemeScheme {
  if (override === 'system') return systemScheme === 'dark' ? 'dark' : 'light';
  return override;
}

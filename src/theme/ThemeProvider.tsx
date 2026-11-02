import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import {
  darkTheme,
  lightTheme,
  resolveColorScheme,
  type AppTheme,
  type ThemeMode,
} from './tokens';

interface ThemeContextValue extends AppTheme {
  /** What the user picked. */
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
  /** Defaults to following the system. Useful for previews. */
  initialMode?: ThemeMode;
}

export function ThemeProvider({ children, initialMode = 'system' }: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>(initialMode);

  const scheme = resolveColorScheme(mode, systemScheme);
  const theme = scheme === 'dark' ? darkTheme : lightTheme;

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ ...theme, mode, setMode }),
    [theme, mode, setMode],
  );

  return (
    <ThemeContext.Provider value={value}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useTheme() must be used inside a ThemeProvider.');
  }
  return value;
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../theme/ThemeProvider';

const DEFAULT_DURATION_MS = 4000;

export interface SnackbarOptions {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
}

interface SnackbarApi {
  show: (options: SnackbarOptions) => void;
  hide: () => void;
}

const SnackbarContext = createContext<SnackbarApi | null>(null);

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const { colors, spacing, radii, fontSize, lineHeight, fontWeight, layout } = useTheme();
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState<SnackbarOptions | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(spacing.md)).current;

  const show = useCallback((options: SnackbarOptions) => {
    setCurrent(options);
  }, []);

  const hide = useCallback(() => {
    setCurrent(null);
  }, []);

  useEffect(() => {
    if (!current) return;

    opacity.setValue(0);
    translateY.setValue(spacing.md);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 160, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      setCurrent(null);
    }, current.durationMs ?? DEFAULT_DURATION_MS);

    return () => clearTimeout(timer);
  }, [current, opacity, translateY, spacing.md]);

  const api = useMemo(() => ({ show, hide }), [show, hide]);

  const handleAction = () => {
    if (!current) return;
    const action = current.onAction;
    setCurrent(null);
    action?.();
  };

  return (
    <SnackbarContext.Provider value={api}>
      <View style={styles.fill}>
        {children}
        {current ? (
          <Animated.View
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            style={[
              styles.snackbar,
              {
                left: spacing.lg,
                right: spacing.lg,
                bottom: insets.bottom + spacing.lg,
                backgroundColor: colors.inverseSurface,
                borderRadius: radii.md,
                paddingLeft: spacing.lg,
                paddingRight: spacing.sm,
                paddingVertical: spacing.xs,
                opacity,
                transform: [{ translateY }],
              },
            ]}
          >
            <Text
              style={{
                flex: 1,
                color: colors.inverseText,
                fontSize: fontSize.sm,
                lineHeight: lineHeight.sm,
              }}
            >
              {current.message}
            </Text>
            {current.actionLabel && current.onAction ? (
              <Pressable
                accessibilityRole="button"
                onPress={handleAction}
                style={({ pressed }) => [
                  styles.action,
                  {
                    minHeight: layout.minTouchTarget,
                    marginLeft: spacing.xs,
                    paddingHorizontal: spacing.md,
                    borderRadius: radii.sm,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text
                  style={{
                    color: colors.inverseAccent,
                    fontSize: fontSize.sm,
                    fontWeight: fontWeight.semibold,
                  }}
                >
                  {current.actionLabel}
                </Text>
              </Pressable>
            ) : null}
          </Animated.View>
        ) : null}
      </View>
    </SnackbarContext.Provider>
  );
}

export function useSnackbar(): SnackbarApi {
  const api = useContext(SnackbarContext);
  if (!api) {
    throw new Error('useSnackbar() must be used inside a SnackbarProvider.');
  }
  return api;
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  snackbar: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
  },
  action: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

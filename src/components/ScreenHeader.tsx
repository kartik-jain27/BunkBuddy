import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '../theme/ThemeProvider';

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function ScreenHeader({ title, subtitle, onBack, right, style }: ScreenHeaderProps) {
  const { colors, spacing, radii, fontSize, lineHeight, fontWeight, layout } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          columnGap: spacing.md,
        },
        style,
      ]}
    >
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={onBack}
          hitSlop={spacing.xs}
          style={({ pressed }) => [
            styles.back,
            {
              width: layout.minTouchTarget,
              height: layout.minTouchTarget,
              borderRadius: radii.full,
              backgroundColor: pressed ? colors.surfaceMuted : 'transparent',
            },
          ]}
        >
          <Text style={{ color: colors.text, fontSize: fontSize.xl }}>←</Text>
        </Pressable>
      ) : null}

      <View style={styles.titleBlock}>
        <Text
          accessibilityRole="header"
          style={{
            color: colors.text,
            fontSize: fontSize.xl,
            lineHeight: lineHeight.xl,
            fontWeight: fontWeight.semibold,
          }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={{
              color: colors.textMuted,
              fontSize: fontSize.sm,
              lineHeight: lineHeight.sm,
              marginTop: spacing.xs,
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  back: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
    flexShrink: 1,
  },
  right: {
    flexShrink: 0,
  },
});

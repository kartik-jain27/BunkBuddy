import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '../theme/ThemeProvider';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  accessibilityLabel,
  testID,
}: ButtonProps) {
  const { colors, spacing, radii, fontSize, fontWeight, layout } = useTheme();

  const busy = loading;
  const isDisabled = disabled || busy;
  const backgroundColor =
    variant === 'primary' ? colors.primary : variant === 'secondary' ? colors.surface : 'transparent';
  const labelColor =
    variant === 'primary' ? colors.onPrimary : variant === 'ghost' ? colors.primary : colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy }}
      disabled={isDisabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: layout.minTouchTarget,
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.sm,
          borderRadius: radii.md,
          backgroundColor,
          borderColor: variant === 'secondary' ? colors.border : 'transparent',
          borderWidth: 1,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      <Text
        style={{
          color: labelColor,
          fontSize: fontSize.md,
          fontWeight: fontWeight.semibold,
          opacity: busy ? 0 : 1,
        }}
      >
        {label}
      </Text>
      {busy ? (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.spinner]}>
          <ActivityIndicator color={variant === 'primary' ? colors.onPrimary : colors.primary} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

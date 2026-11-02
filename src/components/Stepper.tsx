import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';

export interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  /** Used for the buttons' accessibility labels. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  accessibilityLabel = 'Value',
  style,
}: StepperProps) {
  const { colors, spacing, radii, fontSize, lineHeight, fontWeight, layout } = useTheme();

  const decreaseDisabled = disabled || value <= min;
  const increaseDisabled = disabled || value >= max;

  const changeBy = (delta: number) => {
    const next = Math.min(max, Math.max(min, value + delta));
    if (next !== value) onChange(next);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surfaceMuted,
          borderRadius: radii.full,
          padding: spacing.xs,
          columnGap: spacing.xs,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Decrease ${accessibilityLabel}`}
        accessibilityState={{ disabled: decreaseDisabled }}
        disabled={decreaseDisabled}
        onPress={() => changeBy(-step)}
        style={({ pressed }) => [
          styles.button,
          {
            width: layout.minTouchTarget,
            height: layout.minTouchTarget,
            borderRadius: radii.full,
            backgroundColor: pressed && !decreaseDisabled ? colors.surface : 'transparent',
            opacity: decreaseDisabled ? 0.35 : 1,
          },
        ]}
      >
        <Text style={{ color: colors.text, fontSize: fontSize.xl, fontWeight: fontWeight.medium }}>
          −
        </Text>
      </Pressable>

      <Text
        accessibilityLiveRegion="polite"
        accessibilityLabel={`${accessibilityLabel}: ${value}`}
        style={{
          minWidth: layout.stepperValueWidth,
          textAlign: 'center',
          color: colors.text,
          fontSize: fontSize.xl,
          lineHeight: lineHeight.xl,
          fontWeight: fontWeight.semibold,
        }}
      >
        {value}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Increase ${accessibilityLabel}`}
        accessibilityState={{ disabled: increaseDisabled }}
        disabled={increaseDisabled}
        onPress={() => changeBy(step)}
        style={({ pressed }) => [
          styles.button,
          {
            width: layout.minTouchTarget,
            height: layout.minTouchTarget,
            borderRadius: radii.full,
            backgroundColor: pressed && !increaseDisabled ? colors.surface : 'transparent',
            opacity: increaseDisabled ? 0.35 : 1,
          },
        ]}
      >
        <Text style={{ color: colors.text, fontSize: fontSize.xl, fontWeight: fontWeight.medium }}>
          +
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

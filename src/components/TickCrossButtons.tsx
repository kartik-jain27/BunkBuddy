import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';

export type TickCrossState = 'unmarked' | 'present' | 'absent';

export interface TickCrossButtonsProps {
  state: TickCrossState;
  onPresent: () => void;
  onAbsent: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function TickCrossButtons({
  state,
  onPresent,
  onAbsent,
  disabled = false,
  style,
}: TickCrossButtonsProps) {
  const { colors, spacing, radii, fontSize, fontWeight, layout } = useTheme();

  const presentActive = state === 'present';
  const absentActive = state === 'absent';

  return (
    <View style={[styles.row, { columnGap: spacing.md }, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Mark present"
        accessibilityHint={presentActive ? 'Tap again to remove the mark' : undefined}
        accessibilityState={{ selected: presentActive, disabled }}
        disabled={disabled}
        onPress={onPresent}
        style={({ pressed }) => [
          styles.button,
          {
            width: layout.tickCrossSize,
            height: layout.tickCrossSize,
            borderRadius: radii.md,
            backgroundColor: presentActive ? colors.safe : colors.surface,
            borderColor: presentActive ? colors.safe : colors.border,
            borderWidth: 1,
            opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          },
        ]}
      >
        <Text
          style={{
            color: presentActive ? colors.onSafe : colors.textMuted,
            fontSize: fontSize.xxl,
            fontWeight: fontWeight.bold,
          }}
        >
          ✓
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Mark absent"
        accessibilityHint={absentActive ? 'Tap again to remove the mark' : undefined}
        accessibilityState={{ selected: absentActive, disabled }}
        disabled={disabled}
        onPress={onAbsent}
        style={({ pressed }) => [
          styles.button,
          {
            width: layout.tickCrossSize,
            height: layout.tickCrossSize,
            borderRadius: radii.md,
            backgroundColor: absentActive ? colors.danger : colors.surface,
            borderColor: absentActive ? colors.danger : colors.border,
            borderWidth: 1,
            opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          },
        ]}
      >
        <Text
          style={{
            color: absentActive ? colors.onDanger : colors.textMuted,
            fontSize: fontSize.xxl,
            fontWeight: fontWeight.bold,
          }}
        >
          ✗
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

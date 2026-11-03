import { Pressable, Text } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';

interface FilterChipProps {
  label: string;
  active?: boolean;
  danger?: boolean;
  onPress?: () => void;
}

export function FilterChip({ label, active = false, danger = false, onPress }: FilterChipProps) {
  const { colors, radii, spacing, fontSize, fontWeight } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 44,
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
        borderRadius: radii.full,
        borderWidth: 1,
        borderColor: active ? colors.text : danger ? colors.danger : colors.border,
        backgroundColor: active ? colors.text : colors.background,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text style={{ color: active ? colors.inverseText : danger ? colors.danger : colors.textMuted, fontSize: fontSize.sm, fontWeight: fontWeight.bold, letterSpacing: 1 }}>{label.toUpperCase()}</Text>
    </Pressable>
  );
}

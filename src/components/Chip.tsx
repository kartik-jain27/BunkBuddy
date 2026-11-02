import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';

export interface ChipProps {
  label: string;
  /** Optional colour dot, e.g. the subject colour. */
  dotColor?: string;
  style?: StyleProp<ViewStyle>;
}

export function Chip({ label, dotColor, style }: ChipProps) {
  const { colors, spacing, radii, fontSize, fontWeight, layout } = useTheme();

  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: colors.surfaceMuted,
          borderRadius: radii.full,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
          columnGap: dotColor ? spacing.sm : 0,
        },
        style,
      ]}
    >
      {dotColor ? (
        <View
          style={{
            width: layout.dotSize,
            height: layout.dotSize,
            borderRadius: radii.full,
            backgroundColor: dotColor,
          }}
        />
      ) : null}
      <Text
        numberOfLines={1}
        style={{
          flexShrink: 1,
          color: colors.text,
          fontSize: fontSize.sm,
          fontWeight: fontWeight.medium,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '100%',
  },
});

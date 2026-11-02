import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import type { RiskLevel } from '../lib/attendance';
import { useTheme } from '../theme/ThemeProvider';

const RISK_LABELS: Record<RiskLevel, string> = {
  safe: 'Safe',
  warning: 'At risk',
  danger: 'Below target',
  'no-data': 'No data',
};

export interface RiskChipProps {
  risk: RiskLevel;
  style?: StyleProp<ViewStyle>;
}

export function RiskChip({ risk, style }: RiskChipProps) {
  const { colors, spacing, radii, fontSize, fontWeight, layout } = useTheme();

  const palette =
    risk === 'safe'
      ? { fg: colors.safe, bg: colors.safeSoft }
      : risk === 'warning'
        ? { fg: colors.warning, bg: colors.warningSoft }
        : risk === 'danger'
          ? { fg: colors.danger, bg: colors.dangerSoft }
          : { fg: colors.textMuted, bg: colors.surfaceMuted };

  const label = RISK_LABELS[risk];

  return (
    <View
      accessibilityLabel={`Attendance risk: ${label}`}
      style={[
        styles.chip,
        {
          backgroundColor: palette.bg,
          borderRadius: radii.full,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          columnGap: spacing.xs,
        },
        style,
      ]}
    >
      <View
        style={{
          width: layout.dotSize,
          height: layout.dotSize,
          borderRadius: radii.full,
          backgroundColor: palette.fg,
        }}
      />
      <Text
        style={{
          color: palette.fg,
          fontSize: fontSize.xs,
          fontWeight: fontWeight.semibold,
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
  },
});

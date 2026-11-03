import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';

interface ProgressRingProps {
  value: number | null;
  size?: number;
  stroke?: number;
  label?: string;
  text?: string;
}

export function ProgressRing({ value, size = 120, stroke = 10, label, text }: ProgressRingProps) {
  const { colors, radii, fontSize, fontWeight, numberFontFamily } = useTheme();
  const progress = Math.max(0, Math.min(100, value ?? 0));
  return (
    <View style={{ width: size, height: size }}>
      <View style={[styles.ring, { width: size, height: size, borderRadius: radii.full, borderWidth: stroke, borderColor: colors.surfaceMuted }]} />
      <View style={[styles.ring, { width: size, height: size, borderRadius: radii.full, borderWidth: stroke, borderColor: colors.primary, borderTopColor: progress > 75 ? colors.surfaceMuted : colors.primary, transform: [{ rotate: `${progress > 75 ? 25 : 135}deg` }] }]} />
      <View style={styles.center}>
        <Text style={{ color: colors.text, fontFamily: numberFontFamily, fontSize: size > 100 ? fontSize.xxl : fontSize.lg, fontWeight: fontWeight.semibold }}>{text ?? '—'}</Text>
        {label ? <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>{label}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: { position: 'absolute' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

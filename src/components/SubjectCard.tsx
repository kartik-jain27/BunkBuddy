import { useEffect, useMemo, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';

import type { SubjectWithCounts } from '../db/types';
import { formatPercentage, percentage, riskLevel, statusMessage, type RiskLevel } from '../lib/attendance';
import { useTheme } from '../theme/ThemeProvider';
import { ProgressRing } from './ProgressRing';

export interface SubjectCardProps {
  subject: SubjectWithCounts;
  target: number;
  dragging?: boolean;
  onLongPress: () => void;
  onDragEnd: (distanceY: number) => void;
}

export function SubjectCard({ subject, target, dragging = false, onLongPress, onDragEnd }: SubjectCardProps) {
  const { colors, spacing, radii, fontSize, lineHeight, fontWeight, numberFontFamily, layout } = useTheme();
  const risk: RiskLevel = riskLevel(subject, target);
  const [dragOffset, setDragOffset] = useState(0);
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gesture) => dragging && Math.abs(gesture.dy) > 6,
    onPanResponderMove: (_, gesture) => setDragOffset(gesture.dy),
    onPanResponderRelease: (_, gesture) => { setDragOffset(0); onDragEnd(gesture.dy); },
    onPanResponderTerminate: () => setDragOffset(0),
    onPanResponderTerminationRequest: () => false,
  }), [dragging, onDragEnd]);

  useEffect(() => { if (!dragging) setDragOffset(0); }, [dragging]);

  const progress = percentage(subject);
  const message = statusMessage(subject, target);

  return (
    <View {...panResponder.panHandlers}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${subject.name}, ${formatPercentage(subject)} attendance. Hold and drag to reorder.`}
        delayLongPress={350}
        onLongPress={onLongPress}
        style={({ pressed }) => [styles.card, { backgroundColor: risk === 'danger' ? colors.dangerSoft : colors.surface, borderColor: dragging ? colors.primary : risk === 'danger' ? colors.dangerBorder : risk === 'safe' ? colors.safeBorder : colors.border, borderRadius: radii.xl, padding: spacing.md, opacity: pressed || dragging ? 0.86 : 1, shadowColor: colors.primary, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.14, shadowRadius: 12, elevation: 5, transform: [{ translateY: dragOffset }, { scale: dragging ? 1.02 : 1 }] }]}
      >
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ color: colors.text, fontFamily: numberFontFamily, fontSize: fontSize.subject, fontWeight: fontWeight.bold }}>{subject.name}</Text>
            <Text style={{ color: colors.textMuted, fontSize: fontSize.md, fontWeight: fontWeight.semibold, marginTop: spacing.xs }}>{subject.present}/{subject.total} attended</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={`Undo latest ${subject.name} mark`} style={[styles.undo, { borderColor: colors.border, borderRadius: radii.full }]}><Text style={{ color: colors.textMuted, fontSize: fontSize.lg }}>↶</Text></Pressable>
          <ProgressRing value={progress} text={formatPercentage(subject, 0) === '—' ? '—' : `${formatPercentage(subject, 0)}%`} size={76} stroke={8} />
        </View>

        <View style={{ alignSelf: 'flex-start', backgroundColor: risk === 'danger' ? colors.dangerSoft : colors.safeSoft, borderColor: risk === 'danger' ? colors.dangerBorder : colors.safeBorder, borderRadius: radii.full, borderWidth: 1, marginTop: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
          <Text style={{ color: risk === 'danger' ? colors.danger : colors.primary, fontFamily: numberFontFamily, fontSize: fontSize.sm, fontStyle: 'italic', fontWeight: fontWeight.semibold }}>{risk === 'danger' ? `⌁  ${message.replace('Attend the next', 'Must attend the next')}` : `✓  ${message}`}</Text>
        </View>

        <View style={[styles.actions, { columnGap: spacing.md, marginTop: spacing.md }]}>
          <Pressable accessibilityRole="button" style={({ pressed }) => [styles.action, { backgroundColor: colors.primary, borderRadius: radii.full, minHeight: layout.minTouchTarget, opacity: pressed ? 0.75 : 1 }]}>
            <Text style={{ color: colors.onPrimary, fontSize: fontSize.md, fontWeight: fontWeight.bold }}>✓ Present</Text>
          </Pressable>
          <Pressable accessibilityRole="button" style={({ pressed }) => [styles.action, { borderColor: colors.danger, borderRadius: radii.full, borderWidth: 2, minHeight: layout.minTouchTarget, opacity: pressed ? 0.75 : 1 }]}>
            <Text style={{ color: colors.danger, fontSize: fontSize.md, fontWeight: fontWeight.bold }}>× Absent</Text>
          </Pressable>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center' },
  undo: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginRight: 12 },
  actions: { flexDirection: 'row' },
  action: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

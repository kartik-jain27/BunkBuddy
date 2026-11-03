import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddSubjectSheet } from '../src/components/AddSubjectSheet';
import { AppHeader } from '../src/components/AppHeader';
import { AppBottomNav } from '../src/components/AppBottomNav';
import { Card } from '../src/components/Card';
import { EmptyState } from '../src/components/EmptyState';
import { FilterChip } from '../src/components/FilterChip';
import { ProgressRing } from '../src/components/ProgressRing';
import { useSnackbar } from '../src/components/Snackbar';
import { SubjectCard } from '../src/components/SubjectCard';
import { useProfile } from '../src/hooks/useProfile';
import { useSubjects } from '../src/hooks/useSubjects';
import { absentCount, formatPercentage, percentage, riskLevel, sumCounts } from '../src/lib/attendance';
import { useTheme } from '../src/theme/ThemeProvider';

export default function Home() {
  const { colors, spacing, radii, fontSize, fontWeight, numberFontFamily, headlineFontFamily } = useTheme();
  const { profile } = useProfile();
  const {
    subjects,
    loading,
    error,
    createSubject,
    seedDemoSubjects,
    reorderSubjects,
  } = useSubjects();
  const { show } = useSnackbar();
  const seeded = useRef(false);
  const [addVisible, setAddVisible] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'critical' | 'safe'>('all');

  useEffect(() => {
    if (!loading && subjects.length === 0 && !seeded.current) {
      seeded.current = true;
      seedDemoSubjects().catch(() => undefined);
    }
  }, [loading, seedDemoSubjects, subjects.length]);

  const target = profile?.targetPct ?? 75;
  const overall = useMemo(() => sumCounts(subjects), [subjects]);
  const overallPercentage = formatPercentage(overall);
  const visibleSubjects = subjects.filter((subject) => filter === 'all' || (filter === 'critical' ? riskLevel(subject, target) === 'danger' : riskLevel(subject, target) === 'safe'));
  const criticalCount = subjects.filter((subject) => riskLevel(subject, target) === 'danger').length;

  const moveSubject = async (id: string, distanceY: number) => {
    const currentIndex = subjects.findIndex((subject) => subject.id === id);
    const direction = Math.round(distanceY / 180);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= subjects.length) return;
    const ids = subjects.map((subject) => subject.id);
    const moved = ids.splice(currentIndex, 1)[0];
    if (!moved) return;
    ids.splice(nextIndex, 0, moved);
    setDraggingId(null);
    try {
      await reorderSubjects(ids);
    } catch {
      show({ message: "Couldn't reorder subjects. Try again." });
    }
  };

  const renderHeader = () => (
    <>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.primary, fontFamily: numberFontFamily, fontSize: fontSize.xxl, fontStyle: 'italic', fontWeight: fontWeight.semibold, marginTop: spacing.lg }}>Good evening,</Text>
          <Text style={{ color: colors.text, fontFamily: headlineFontFamily, fontSize: fontSize.hero, fontWeight: '700' }}>Kartik Jain</Text>
        </View>
      </View>

      <Card style={{ marginTop: spacing.lg, shadowColor: colors.primary, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.14, shadowRadius: 12, elevation: 5 }}>
        <View style={styles.summaryTop}><ProgressRing value={percentage(overall)} text={`${overallPercentage}%`} size={132} stroke={10} /><View style={{ flex: 1, marginLeft: spacing.xl }}><Text style={{ color: colors.textMuted, fontSize: fontSize.sm, fontWeight: fontWeight.bold, letterSpacing: 2 }}>OVERALL{`\n`}ATTENDANCE</Text><Text style={{ color: colors.text, fontSize: fontSize.lg, fontWeight: fontWeight.semibold, marginTop: spacing.md }}>Target {target}%</Text><Text style={{ color: colors.secondary, backgroundColor: colors.secondarySoft, borderRadius: radii.full, fontSize: fontSize.sm, fontWeight: fontWeight.bold, marginTop: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>♨ 8-day streak</Text></View></View>
      </Card>

      <View style={[styles.statsRow, { marginTop: spacing.md, columnGap: spacing.md }]}>
        <SummaryCard label="Attended" value={overall.present} />
        <SummaryCard label="Bunked" value={absentCount(overall)} />
        <SummaryCard label="Occurred" value={overall.total} />
      </View>

      <View style={[styles.filters, { marginTop: spacing.xl, marginBottom: spacing.lg }]}>
        <View style={styles.filterChips}>
          <FilterChip label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
          <FilterChip label={`Critical · ${criticalCount}`} danger={filter === 'critical'} active={filter === 'critical'} onPress={() => setFilter('critical')} />
          <FilterChip label="Safe" active={filter === 'safe'} onPress={() => setFilter('safe')} />
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Add a subject" onPress={() => setAddVisible(true)} style={({ pressed }) => [styles.addIcon, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.full, borderWidth: 1, opacity: pressed ? 0.7 : 1 }]}>
          <Text style={{ color: colors.textMuted, fontSize: fontSize.xl, lineHeight: fontSize.xl }}>+</Text>
        </Pressable>
      </View>
    </>
  );

  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: colors.background }]} edges={['top']}>
      <AppHeader />
      {loading && subjects.length === 0 ? (
        <View style={styles.centered}>
          <Text style={{ color: colors.textMuted }}>Loading your attendance…</Text>
        </View>
      ) : (
        <FlatList
          data={visibleSubjects}
          keyExtractor={(subject) => subject.id}
          renderItem={({ item }) => (
            <View style={{ marginBottom: spacing.md }}>
              <SubjectCard
                subject={item}
                target={target}
                dragging={draggingId === item.id}
                onLongPress={() => setDraggingId(item.id)}
                onDragEnd={(distanceY) => {
                  moveSubject(item.id, distanceY).catch(() => undefined);
                }}
              />
            </View>
          )}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={<EmptyState message="No subjects in this view." actionLabel="Add subject" onAction={() => setAddVisible(true)} />}
          ListFooterComponent={error ? <Text style={{ color: colors.danger, textAlign: 'center' }}>{error}</Text> : undefined}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl + 72 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <AddSubjectSheet
        visible={addVisible}
        onClose={() => setAddVisible(false)}
        onCreate={async (draft) => {
          await createSubject(draft);
          show({ message: `${draft.name} added.` });
        }}
      />
      <AppBottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  summaryTop: { flexDirection: 'row', alignItems: 'center' },
  statsRow: { flexDirection: 'row' },
  filters: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterChips: { flex: 1, flexDirection: 'row', gap: 8 },
  addIcon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
});

function SummaryCard({ label, value }: { label: string; value: number }) {
  const { colors, spacing, radii, fontSize, fontWeight, numberFontFamily } = useTheme();
  return (
    <Card style={{ flex: 1, padding: spacing.md, borderRadius: radii.lg, shadowColor: colors.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 }}>
      <Text style={{ color: colors.text, fontFamily: numberFontFamily, fontSize: fontSize.xl, fontWeight: fontWeight.bold }}>{value}</Text>
      <Text style={{ color: colors.textMuted, fontSize: fontSize.xs, fontWeight: fontWeight.bold, marginTop: spacing.xs }}>{label}</Text>
    </Card>
  );
}

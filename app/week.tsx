import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBottomNav } from '../src/components/AppBottomNav';
import { AppHeader } from '../src/components/AppHeader';
import { useSubjects } from '../src/hooks/useSubjects';
import { useTimetable } from '../src/hooks/useTimetable';
import { addDays, formatTime12h, isoWeekday, parseDateKey, toDateKey, weekdayName } from '../src/lib/dates';
import { slotsForDate, type Slot } from '../src/lib/timetable';
import { useTheme } from '../src/theme/ThemeProvider';

interface CalendarClass extends Slot {
  name: string;
  kind: 'lecture' | 'lab';
  demoStatus?: 'Finished' | 'Active' | 'Upcoming';
}

const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;
const DEMO_CLASSES: CalendarClass[] = [
  { id: 'demo-dbms', subjectId: 'DBMS', weekday: 1, start: '09:00', end: '10:00', room: 'Hall 302', name: 'DBMS', kind: 'lecture', demoStatus: 'Finished' },
  { id: 'demo-ds', subjectId: 'Data Structures C++', weekday: 1, start: '10:00', end: '11:00', room: 'Hall 105', name: 'Data Structures C++', kind: 'lecture', demoStatus: 'Active' },
  { id: 'demo-os', subjectId: 'OS', weekday: 1, start: '11:15', end: '12:15', room: 'Hall 401', name: 'OS', kind: 'lecture', demoStatus: 'Upcoming' },
  { id: 'demo-lab', subjectId: 'DBMS Lab', weekday: 1, start: '13:30', end: '15:30', room: 'Lab 2B', name: 'DBMS Lab', kind: 'lab', demoStatus: 'Upcoming' },
];

function monthDays(cursor: Date): string[] {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const start = addDays(toDateKey(first), 1 - isoWeekday(first));
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

function monthTitle(cursor: Date): string {
  return cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function statusForClass(entry: CalendarClass, date: Date): 'Finished' | 'Active' | 'Upcoming' {
  if (entry.demoStatus) return entry.demoStatus;
  const today = new Date();
  const selectedKey = toDateKey(date);
  const todayKey = toDateKey(today);
  if (selectedKey < todayKey) return 'Finished';
  if (selectedKey > todayKey) return 'Upcoming';
  const now = today.getHours() * 60 + today.getMinutes();
  const [startHour, startMinute] = entry.start.split(':').map(Number);
  const [endHour, endMinute] = entry.end.split(':').map(Number);
  const start = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;
  if (now >= end) return 'Finished';
  if (now >= start) return 'Active';
  return 'Upcoming';
}

function timeLabel(time: string): string {
  return formatTime12h(time).replace(/ AM| PM/, '');
}

export default function WeekScreen() {
  const { colors, spacing, radii, fontSize, fontWeight, numberFontFamily, headlineFontFamily } = useTheme();
  const { slots, error: timetableError } = useTimetable();
  const { subjects } = useSubjects();
  const initialMondayKey = addDays(toDateKey(new Date()), 1 - isoWeekday(new Date()));
  const [selectedKey, setSelectedKey] = useState(initialMondayKey);
  const [monthCursor, setMonthCursor] = useState(() => {
    const monday = parseDateKey(initialMondayKey);
    return new Date(monday.getFullYear(), monday.getMonth(), 1);
  });

  const subjectNames = useMemo(() => new Map(subjects.map((subject) => [subject.id, subject.name])), [subjects]);
  const schedule = useMemo<CalendarClass[]>(() => {
    if (slots.length === 0) return DEMO_CLASSES;
    return slots.map((slot) => ({
      ...slot,
      name: subjectNames.get(slot.subjectId) ?? 'Subject',
      kind: /lab/i.test(subjectNames.get(slot.subjectId) ?? '') ? 'lab' : 'lecture',
    }));
  }, [slots, subjectNames]);
  const selectedDate = parseDateKey(selectedKey);
  const days = monthDays(monthCursor);
  const classDays = new Set(schedule.map((entry) => entry.weekday));
  const selectedClasses = slotsForDate(schedule, selectedDate) as CalendarClass[];
  const lectureCount = schedule.filter((entry) => entry.kind === 'lecture').length;
  const labCount = schedule.filter((entry) => entry.kind === 'lab').length;

  const changeMonth = (amount: number) => {
    setMonthCursor((current) => {
      const next = new Date(current.getFullYear(), current.getMonth() + amount, 1);
      setSelectedKey(toDateKey(next));
      return next;
    });
  };

  const selectWeekday = (weekday: number) => {
    const nextKey = addDays(selectedKey, weekday - isoWeekday(selectedDate));
    setSelectedKey(nextKey);
    const next = parseDateKey(nextKey);
    setMonthCursor(new Date(next.getFullYear(), next.getMonth(), 1));
  };

  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: colors.background }]} edges={['top']}>
      <AppHeader />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl + 72 }} showsVerticalScrollIndicator={false}>
        <Text style={{ color: colors.textMuted, fontSize: fontSize.xs, fontWeight: fontWeight.bold, letterSpacing: 2 }}>THE WEEK, AT A GLANCE</Text>
        <Text style={{ color: colors.text, fontFamily: headlineFontFamily, fontSize: fontSize.display, fontWeight: fontWeight.bold, marginTop: spacing.xs }}>Weekly Timetable</Text>
        {timetableError && <Text style={{ color: colors.danger, fontSize: fontSize.xs, marginTop: spacing.xs }}>{timetableError}</Text>}
        <View style={[styles.calendarCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.xl, marginTop: spacing.lg, padding: spacing.md, shadowColor: colors.primary }]}>
          <View style={styles.calendarHeader}>
            <Text style={{ color: colors.primary, fontFamily: numberFontFamily, fontSize: fontSize.lg, fontWeight: fontWeight.bold }}>{monthTitle(monthCursor)}</Text>
            <View style={styles.calendarActions}>
              <View style={[styles.weekBadge, { backgroundColor: colors.primarySoft, borderRadius: radii.full }]}><Text style={{ color: colors.primary, fontSize: fontSize.xs, fontWeight: fontWeight.bold }}>WEEK {Math.ceil(selectedDate.getDate() / 7)}</Text></View>
              <Pressable accessibilityLabel="Previous month" accessibilityRole="button" onPress={() => changeMonth(-1)}><Text style={{ color: colors.primary, fontSize: fontSize.xl }}>‹</Text></Pressable>
              <Pressable accessibilityLabel="Next month" accessibilityRole="button" onPress={() => changeMonth(1)}><Text style={{ color: colors.primary, fontSize: fontSize.xl }}>›</Text></Pressable>
            </View>
          </View>
          <View style={[styles.calendarDivider, { backgroundColor: colors.border }]} />
          <View style={styles.calendarRow}>{DAY_LABELS.map((day) => <Text key={day} style={[styles.calendarCell, { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: fontWeight.bold }]}>{day[0]}</Text>)}</View>
          {Array.from({ length: 6 }, (_, row) => (
            <View key={row} style={styles.calendarRow}>
              {days.slice(row * 7, row * 7 + 7).map((key) => {
                const date = parseDateKey(key);
                const inMonth = date.getMonth() === monthCursor.getMonth();
                const selected = key === selectedKey;
                const hasClass = classDays.has(isoWeekday(date));
                const hasLab = schedule.some((entry) => entry.weekday === isoWeekday(date) && entry.kind === 'lab');
                return (
                  <Pressable key={key} accessibilityRole="button" accessibilityLabel={`Select ${key}`} onPress={() => setSelectedKey(key)} style={styles.calendarCell}>
                    <View style={[styles.dateCircle, selected && { backgroundColor: colors.primary, borderRadius: radii.md }]}>
                      <Text style={{ color: selected ? colors.onPrimary : inMonth ? colors.text : colors.textMuted, fontSize: fontSize.xs, fontWeight: selected ? fontWeight.bold : fontWeight.regular }}>{date.getDate()}</Text>
                      {hasClass && <View style={[styles.dateDot, { backgroundColor: hasLab ? colors.lab : colors.primary }]} />}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}
          <View style={[styles.calendarDivider, { backgroundColor: colors.border }]} />
          <View style={styles.legendRow}>
            <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>● Lectures ({lectureCount})</Text>
            <Text style={{ color: colors.lab, fontSize: fontSize.xs }}>● Lab ({labCount})</Text>
            <Text style={{ color: colors.primary, fontFamily: numberFontFamily, fontSize: fontSize.xs, fontStyle: 'italic', fontWeight: fontWeight.bold, marginLeft: 'auto' }}>{weekdayName(isoWeekday(selectedDate))} Active</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.md }}>
          {DAY_LABELS.map((day, index) => {
            const active = isoWeekday(selectedDate) === index + 1;
            return <Pressable key={day} accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={() => selectWeekday(index + 1)} style={[styles.dayPill, { backgroundColor: active ? colors.primary : colors.surface, borderColor: active ? colors.primary : colors.border, borderRadius: radii.full }]}><Text style={{ color: active ? colors.onPrimary : colors.textMuted, fontSize: fontSize.xs, fontWeight: fontWeight.bold }}>{day}</Text></Pressable>;
          })}
        </ScrollView>

        {selectedClasses.length > 0 ? selectedClasses.map((entry) => {
          const status = statusForClass(entry, selectedDate);
          const isActive = status === 'Active';
          const accent = entry.kind === 'lab' ? colors.lab : colors.primary;
          return <View key={entry.id} style={[styles.classCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.xl, marginBottom: spacing.md, padding: spacing.md, shadowColor: colors.primary }]}>
            <View style={[styles.timePill, { backgroundColor: isActive ? colors.primarySoft : entry.kind === 'lab' ? colors.labSoft : colors.surfaceMuted, borderColor: isActive ? colors.safeBorder : colors.border, borderRadius: radii.md }]}>
              <Text style={{ color: accent, fontFamily: numberFontFamily, fontSize: fontSize.xs, fontWeight: fontWeight.bold }}>{timeLabel(entry.start)}</Text>
              <Text style={{ color: accent, fontFamily: numberFontFamily, fontSize: fontSize.xs }}>{timeLabel(entry.end)}</Text>
            </View>
            <View style={styles.classInfo}>
              <Text style={{ color: colors.text, fontFamily: headlineFontFamily, fontSize: fontSize.lg, fontWeight: fontWeight.bold }}>{entry.name}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: isActive ? colors.primary : colors.surfaceMuted, borderColor: isActive ? colors.primary : colors.border, borderRadius: radii.full }]}><Text style={{ color: isActive ? colors.onPrimary : colors.textMuted, fontSize: fontSize.xs, fontWeight: fontWeight.medium }}>{status}</Text></View>
          </View>;
        }) : <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.xl }]}><Text style={{ color: colors.textMuted, fontSize: fontSize.md }}>No classes scheduled for {weekdayName(isoWeekday(selectedDate))}.</Text></View>}
      </ScrollView>
      <AppBottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  calendarCard: { borderWidth: 1, elevation: 3, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 12 },
  calendarHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  calendarActions: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  weekBadge: { paddingHorizontal: 8, paddingVertical: 4 },
  calendarDivider: { height: 1, marginVertical: 8 },
  calendarRow: { flexDirection: 'row' },
  calendarCell: { alignItems: 'center', flex: 1, justifyContent: 'center', minHeight: 34 },
  dateCircle: { alignItems: 'center', justifyContent: 'center', minHeight: 30, minWidth: 34, paddingVertical: 4 },
  dateDot: { borderRadius: 999, height: 4, marginTop: 2, width: 4 },
  legendRow: { alignItems: 'center', flexDirection: 'row', gap: 12, paddingTop: 2 },
  dayPill: { alignItems: 'center', borderWidth: 1, minWidth: 66, paddingHorizontal: 16, paddingVertical: 9 },
  classCard: { alignItems: 'center', borderWidth: 1, flexDirection: 'row', minHeight: 82, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 },
  timePill: { alignItems: 'center', borderWidth: 1, justifyContent: 'center', minHeight: 52, width: 62 },
  classInfo: { flex: 1, paddingHorizontal: 12 },
  statusPill: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 },
  emptyCard: { alignItems: 'center', borderWidth: 1, padding: 24 },
});

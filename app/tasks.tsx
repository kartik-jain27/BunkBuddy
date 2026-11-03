import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBottomNav } from '../src/components/AppBottomNav';
import { AppHeader } from '../src/components/AppHeader';
import { Card } from '../src/components/Card';
import { useTheme } from '../src/theme/ThemeProvider';
import { useSnackbar } from '../src/components/Snackbar';

const TASKS = [
  { title: 'DBMS Assignment 3 — Normalization', subject: 'DBMS' },
  { title: 'SQL Subqueries — Lab record 4', subject: 'DBMS LAB' },
  { title: 'AVL tree balance — algorithm trace', subject: 'DATA STRUCTURES C++' },
  { title: 'Subnetting numerical sheet', subject: 'NETWORKS' },
];

export default function TasksScreen() {
  const { colors, spacing, radii, fontSize, fontWeight, lineHeight, headlineFontFamily } = useTheme();
  const { show } = useSnackbar();
  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: colors.background }]} edges={['top']}>
      <AppHeader />
      <FlatList
        data={TASKS}
        keyExtractor={(task) => task.title}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl + 72 }}
        ListHeaderComponent={
          <View style={{ marginBottom: spacing.xl }}>
            <Text style={{ color: colors.textMuted, fontSize: fontSize.sm, fontWeight: fontWeight.bold, letterSpacing: 2 }}>TO KEEP IN MIND</Text>
            <Text style={{ color: colors.text, fontFamily: headlineFontFamily, fontSize: 36, fontWeight: '700', marginTop: spacing.sm }}>Tasks</Text>
            <Text style={{ color: colors.textMuted, fontSize: fontSize.md, marginTop: spacing.xs }}><Text style={{ color: colors.text, fontWeight: fontWeight.bold }}>2 of 6</Text> done this week</Text>
            <View style={[styles.progress, { backgroundColor: colors.surfaceMuted, borderRadius: radii.full, marginTop: spacing.lg }]}><View style={[styles.progressFill, { backgroundColor: colors.primary, borderRadius: radii.full, width: '33%' }]} /></View>
          </View>
        }
        renderItem={({ item }) => (
          <Card style={{ marginBottom: spacing.md, padding: spacing.lg, borderRadius: radii.xl, shadowColor: colors.primary, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 5 }}>
            <View style={styles.taskRow}>
              <View style={[styles.checkbox, { borderColor: colors.border, borderRadius: radii.sm }]} />
              <View style={{ flex: 1, marginLeft: spacing.lg }}>
                <Text style={{ color: colors.text, fontFamily: headlineFontFamily, fontSize: fontSize.lg, fontWeight: '700', lineHeight: lineHeight.lg }}>{item.title}</Text>
                <View style={[styles.chips, { marginTop: spacing.md }]}><Text style={[styles.chipText, { color: colors.textMuted, borderColor: colors.border, borderRadius: radii.sm, fontSize: fontSize.xs }]}>{item.subject}</Text></View>
              </View>
            </View>
          </Card>
        )}
      />
      <Pressable accessibilityRole="button" accessibilityLabel="Add a task" onPress={() => show({ message: 'Task composer coming next.' })} style={({ pressed }) => [styles.addTask, { right: spacing.lg, bottom: spacing.xxl + 64, backgroundColor: colors.primary, borderRadius: radii.full, opacity: pressed ? 0.75 : 1 }]}>
        <Text style={{ color: colors.onPrimary, fontSize: fontSize.xxl, lineHeight: fontSize.xxl }}>+</Text>
      </Pressable>
      <AppBottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  progress: { height: 8, overflow: 'hidden' },
  progressFill: { height: '100%' },
  taskRow: { flexDirection: 'row', alignItems: 'flex-start' },
  checkbox: { width: 28, height: 28, borderWidth: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipText: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, fontWeight: '600' },
  addTask: { position: 'absolute', width: 52, height: 52, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#14382C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
});

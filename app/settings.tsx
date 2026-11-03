import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBottomNav } from '../src/components/AppBottomNav';
import { AppHeader } from '../src/components/AppHeader';
import { Card } from '../src/components/Card';
import { useProfile } from '../src/hooks/useProfile';
import { useTheme } from '../src/theme/ThemeProvider';

const TARGET_MIN = 50;
const TARGET_MAX = 95;
const TARGET_CHOICES = [65, 70, 75, 80, 85];

export default function SettingsScreen() {
  const { colors, spacing, radii, fontSize, fontWeight, numberFontFamily, headlineFontFamily } = useTheme();
  const { profile, updateProfile, error } = useProfile();
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [strictWarningsEnabled, setStrictWarningsEnabled] = useState(false);
  const target = profile?.targetPct ?? 75;
  const sliderPosition = `${Math.max(0, Math.min(100, ((target - TARGET_MIN) / (TARGET_MAX - TARGET_MIN)) * 100))}%`;

  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: colors.background }]} edges={['top']}>
      <AppHeader />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl + 72 }} showsVerticalScrollIndicator={false}>
        <Text style={{ color: colors.textMuted, fontSize: fontSize.xs, fontWeight: fontWeight.bold, letterSpacing: 1.8 }}>MAKE IT YOURS</Text>
        <Text style={{ color: colors.text, fontFamily: headlineFontFamily, fontSize: fontSize.display, fontWeight: fontWeight.bold, marginTop: spacing.xs }}>Settings</Text>

        <Card style={[styles.cardShadow, { marginTop: spacing.lg, shadowColor: colors.primary }]}>
          <Text style={{ color: colors.text, fontFamily: headlineFontFamily, fontSize: fontSize.lg, fontWeight: fontWeight.bold }}>Your details</Text>
          <DetailField label="STUDENT NAME" value={profile?.displayName ?? 'Kartik Jain'} />
          <DetailField label="COLLEGE" value="Apex Institute of Tech" />
        </Card>

        <Card style={[styles.cardShadow, { marginTop: spacing.lg, shadowColor: colors.primary }]}>
          <View style={styles.targetHeader}>
            <Text style={{ color: colors.text, fontFamily: headlineFontFamily, fontSize: fontSize.xl, fontWeight: fontWeight.bold }}>Attendance target</Text>
            <Text style={{ color: colors.primary, fontFamily: numberFontFamily, fontSize: fontSize.hero, fontWeight: fontWeight.bold }}>{target}%</Text>
          </View>
          <Text style={{ color: colors.textMuted, fontSize: fontSize.sm, lineHeight: 20, marginTop: spacing.md }}>Your college's minimum. Every skip / attend count follows this.</Text>
          <View style={[styles.sliderTrack, { backgroundColor: colors.border, marginTop: spacing.xl }]}>
            <View style={[styles.sliderFill, { backgroundColor: colors.primary, width: sliderPosition }]} />
            <View style={[styles.sliderThumb, { backgroundColor: colors.primary, borderColor: colors.surface, left: sliderPosition }]} />
          </View>
          <View style={styles.sliderLabels}><Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>50%</Text><Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>95%</Text></View>
          <View style={styles.targetChoices}>
            {TARGET_CHOICES.map((value) => <Pressable key={value} accessibilityRole="button" onPress={() => updateProfile({ targetPct: value })} style={[styles.choice, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radii.full }]}><Text style={{ color: colors.primary, fontSize: fontSize.sm, fontWeight: fontWeight.medium }}>{value}%</Text></Pressable>)}
          </View>
        </Card>

        <Card style={[styles.cardShadow, { marginTop: spacing.lg, shadowColor: colors.primary }]}>
          <Text style={{ color: colors.text, fontFamily: headlineFontFamily, fontSize: fontSize.xl, fontWeight: fontWeight.bold }}>Preferences</Text>
          <PreferenceRow title="Daily class reminders" detail="Alerts 15 mins before each lecture" value={remindersEnabled} onValueChange={setRemindersEnabled} />
          <PreferenceRow title="Strict warning threshold" detail="Flag alert when I bunk away from limit" value={strictWarningsEnabled} onValueChange={setStrictWarningsEnabled} />
          <Pressable accessibilityRole="button" style={[styles.resetButton, { backgroundColor: colors.dangerSoft, borderColor: colors.dangerBorder, borderRadius: radii.full }]}><Text style={{ color: colors.danger, fontSize: fontSize.sm, fontWeight: fontWeight.medium }}>Reset Semester Data</Text></Pressable>
        </Card>

        {error && <Text style={{ color: colors.danger, fontSize: fontSize.xs, marginTop: spacing.md, textAlign: 'center' }}>{error}</Text>}
        <Text style={{ color: colors.textMuted, fontSize: fontSize.xs, marginTop: spacing.xl, textAlign: 'center' }}>BunkBuddy v2.4 · Made for easy attendance tracking</Text>
      </ScrollView>
      <AppBottomNav />
    </SafeAreaView>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  const { colors, spacing, radii, fontSize, fontWeight } = useTheme();
  return <View style={{ marginTop: spacing.lg }}><Text style={{ color: colors.textMuted, fontSize: fontSize.xs, fontWeight: fontWeight.medium, letterSpacing: 1 }}>{label}</Text><View style={[styles.detailField, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radii.md, marginTop: spacing.sm }]}><Text style={{ color: colors.text, flex: 1, fontSize: fontSize.md, fontWeight: fontWeight.medium }}>{value}</Text><Text style={{ color: colors.textMuted, fontSize: fontSize.lg }}>✎</Text></View></View>;
}

function PreferenceRow({ title, detail, value, onValueChange }: { title: string; detail: string; value: boolean; onValueChange: (value: boolean) => void }) {
  const { colors, spacing, fontSize } = useTheme();
  return <View style={[styles.preferenceRow, { borderBottomColor: colors.border, paddingVertical: spacing.md }]}><View style={styles.preferenceText}><Text style={{ color: colors.text, fontSize: fontSize.md }}>{title}</Text><Text style={{ color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.xs }}>{detail}</Text></View><Switch accessibilityLabel={title} onValueChange={onValueChange} value={value} trackColor={{ false: colors.border, true: colors.primary }} thumbColor={colors.surface} /></View>;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  cardShadow: { shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.09, shadowRadius: 12, elevation: 4 },
  targetHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  detailField: { alignItems: 'center', borderWidth: 1, flexDirection: 'row', minHeight: 48, paddingHorizontal: 16 },
  sliderTrack: { height: 8, position: 'relative' },
  sliderFill: { height: '100%' },
  sliderThumb: { borderRadius: 999, borderWidth: 2, height: 20, position: 'absolute', top: -6, transform: [{ translateX: -10 }], width: 20 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  targetChoices: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  choice: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  guidance: { borderWidth: 1, padding: 16 },
  preferenceRow: { alignItems: 'center', borderBottomWidth: 1, flexDirection: 'row' },
  preferenceText: { flex: 1 },
  resetButton: { alignSelf: 'center', alignItems: 'center', borderWidth: 1, justifyContent: 'center', marginTop: 16, minHeight: 44, minWidth: 160, paddingHorizontal: 24, paddingVertical: 10 },
});

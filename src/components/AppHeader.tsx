import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';

export function AppHeader() {
  const { colors, spacing, radii, fontSize, fontWeight, numberFontFamily, mode, setMode } = useTheme();
  const toggleTheme = () => setMode(mode === 'dark' ? 'light' : 'dark');

  return (
    <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border, paddingHorizontal: spacing.lg, height: 68 }]}>
      <Text style={{ color: colors.primary, fontFamily: numberFontFamily, fontSize: fontSize.hero, lineHeight: fontSize.hero, fontWeight: fontWeight.bold }}>BunkBuddy</Text>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" accessibilityLabel="Toggle theme" onPress={toggleTheme} style={[styles.themeButton, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.full }]}>
          <Text style={{ color: colors.textMuted, fontSize: fontSize.lg }}>{mode === 'dark' ? '☀' : '◐'}</Text>
        </Pressable>
        <View style={[styles.avatar, { backgroundColor: colors.primary, borderRadius: radii.full }]}><Text style={{ color: colors.onPrimary, fontSize: fontSize.xs, fontWeight: fontWeight.bold }}>KJ</Text></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { width: '100%', flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', columnGap: 10 , marginLeft: 'auto' },
  themeButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  avatar: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});

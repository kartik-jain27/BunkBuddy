import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';

import { useTheme } from '../theme/ThemeProvider';

const ITEMS = [
  { route: '/', label: 'Today', icon: '▦' },
  { route: '/tasks', label: 'Tasks', icon: '▤' },
  { route: '/week', label: 'Week', icon: '▣' },
  { route: '/settings', label: 'Settings', icon: '⚙' },
] as const;

export function AppBottomNav() {
  const { colors, spacing, fontSize, fontWeight } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={[styles.nav, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: spacing.sm, paddingTop: spacing.sm }]}>
      {ITEMS.map((item) => {
        const active = item.route === '/' ? pathname === '/' : pathname.startsWith(item.route);
        return (
          <Pressable
            key={item.route}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => router.replace(item.route)}
            style={({ pressed }) => [styles.item, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={{ color: active ? colors.primary : colors.textMuted, fontSize: fontSize.xl }}>{item.icon}</Text>
            <Text style={{ color: active ? colors.primary : colors.textMuted, fontSize: fontSize.xs, fontWeight: fontWeight.bold, marginTop: spacing.xs }}>{item.label.toUpperCase()}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', borderTopWidth: 1 },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 56 },
});

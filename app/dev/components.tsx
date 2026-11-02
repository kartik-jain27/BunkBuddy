import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';

import { Chip } from '../../src/components/Chip';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { ComponentGallery } from '../../src/dev/ComponentGallery';
import { useTheme } from '../../src/theme/ThemeProvider';

export default function ComponentsDevScreen() {
  const { colors, spacing, scheme } = useTheme();
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView
        style={[styles.fill, { backgroundColor: colors.background }]}
        edges={['top', 'bottom']}
      >
        <ScreenHeader
          title="Components"
          subtitle="M1 design foundation · dev only"
          onBack={() => router.back()}
          right={<Chip label={scheme} dotColor={colors.primary} />}
        />
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: spacing.lg }}
        >
          <ComponentGallery />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});

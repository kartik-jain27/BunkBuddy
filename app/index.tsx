import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '../src/components/Button';
import { useSubjects } from '../src/hooks/useSubjects';

// TEMPORARY M2 dev check. M3 replaces this screen with the real Subjects tab.
const DEV_SUBJECT = {
  name: 'Test',
  color: '#7C3AED',
  initialPresent: 23,
  initialTotal: 29,
};

export default function Home() {
  const router = useRouter();
  const { subjects, loading, error, createSubject } = useSubjects();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BunkWise is running</Text>

      <Pressable
        accessibilityRole="button"
        onPress={() => {
          createSubject(DEV_SUBJECT).catch(() => undefined);
        }}
        style={styles.button}
      >
        <Text style={styles.buttonLabel}>Create test subject</Text>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? <Text>Loading subjects…</Text> : null}

      {subjects.map((subject) => (
        <Text key={subject.id} style={styles.subject}>
          {subject.name}: {subject.present} / {subject.total}
        </Text>
      ))}

      <Button
        label="Open UI kit (dev)"
        variant="secondary"
        onPress={() => router.push('/dev/components')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  button: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    fontSize: 14,
    textAlign: 'center',
  },
  subject: {
    fontSize: 16,
  },
});

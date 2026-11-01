/**
 * DatabaseProvider.tsx — opens and migrates the local database once, then
 * exposes the connection through context.
 *
 * Children are not rendered until the database is ready, so repositories and
 * hooks can assume getDatabase() always returns a migrated connection.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';

import { setDatabase } from './client';
import { openAndMigrate } from './migrate';

const DatabaseContext = createContext<SQLiteDatabase | null>(null);

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);

    openAndMigrate()
      .then((opened) => {
        if (cancelled) return;
        setDatabase(opened);
        setDb(opened);
      })
      .catch(() => {
        if (cancelled) return;
        setDatabase(null);
        setError("Couldn't open the database on this device.");
      });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>{error}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => setAttempt((value) => value + 1)}
          style={styles.retry}
        >
          <Text style={styles.retryLabel}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  if (!db) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text style={styles.message}>Loading BunkWise…</Text>
      </View>
    );
  }

  return <DatabaseContext.Provider value={db}>{children}</DatabaseContext.Provider>;
}

export function useDatabase(): SQLiteDatabase {
  const db = useContext(DatabaseContext);
  if (!db) {
    throw new Error('useDatabase() must be used inside a DatabaseProvider.');
  }
  return db;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
  },
  retry: {
    minHeight: 48,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  retryLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});

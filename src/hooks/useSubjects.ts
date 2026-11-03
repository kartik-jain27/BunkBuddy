/**
 * useSubjects.ts — subjects with derived counts plus the actions the UI needs.
 * Every write refreshes the list so screens never compute counts themselves.
 */

import { useCallback, useEffect, useState } from 'react';

import { useDatabase } from '../db/DatabaseProvider';
import {
  createSubject as createSubjectRecord,
  deleteSubjectCascade,
  listSubjectsWithCounts,
  reorderSubjects as reorderSubjectRecords,
  restore,
  seedDemoSubjectsIfEmpty,
  updateSubject as updateSubjectRecord,
  type CreateSubjectInput,
  type SubjectPatch,
} from '../db/repo/subjects';
import type { DeleteToken, Subject, SubjectWithCounts } from '../db/types';

export interface UseSubjectsResult {
  subjects: SubjectWithCounts[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createSubject: (input: CreateSubjectInput) => Promise<Subject>;
  updateSubject: (id: string, patch: SubjectPatch) => Promise<void>;
  deleteSubject: (id: string) => Promise<DeleteToken>;
  restoreSubject: (token: DeleteToken) => Promise<void>;
  seedDemoSubjects: () => Promise<void>;
  reorderSubjects: (ids: ReadonlyArray<string>) => Promise<void>;
}

export function useSubjects(): UseSubjectsResult {
  const db = useDatabase();
  const [subjects, setSubjects] = useState<SubjectWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    try {
      const rows = await listSubjectsWithCounts();
      setSubjects(rows);
      setError(null);
    } catch {
      setError("Couldn't load your subjects.");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    listSubjectsWithCounts()
      .then((rows) => {
        if (cancelled) return;
        setSubjects(rows);
        setError(null);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load your subjects.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [db]);

  const runWrite = useCallback(
    async <T,>(action: () => Promise<T>): Promise<T> => {
      try {
        const result = await action();
        await load();
        return result;
      } catch (caught) {
        setError("Couldn't save. Try again.");
        throw caught;
      }
    },
    [load],
  );

  const createSubject = useCallback(
    (input: CreateSubjectInput) => runWrite(() => createSubjectRecord(input)),
    [runWrite],
  );

  const updateSubject = useCallback(
    (id: string, patch: SubjectPatch) => runWrite(() => updateSubjectRecord(id, patch)),
    [runWrite],
  );

  const deleteSubject = useCallback(
    (id: string) => runWrite(() => deleteSubjectCascade(id)),
    [runWrite],
  );

  const restoreSubject = useCallback(
    (token: DeleteToken) => runWrite(() => restore(token)),
    [runWrite],
  );

  const seedDemoSubjects = useCallback(
    () => runWrite(() => seedDemoSubjectsIfEmpty(DEMO_SUBJECTS)),
    [runWrite],
  );

  const reorderSubjects = useCallback(
    (ids: ReadonlyArray<string>) => runWrite(() => reorderSubjectRecords(ids)),
    [runWrite],
  );

  return {
    subjects,
    loading,
    error,
    refresh: load,
    createSubject,
    updateSubject,
    deleteSubject,
    restoreSubject,
    seedDemoSubjects,
    reorderSubjects,
  };
}

const DEMO_SUBJECTS = [
  { name: 'Networks', color: '#B3261E', initialPresent: 20, initialTotal: 28 },
  { name: 'DBMS', color: '#1C4A3B', initialPresent: 23, initialTotal: 29 },
  { name: 'DBMS Lab', color: '#255E4B', initialPresent: 18, initialTotal: 20 },
  { name: 'Data Structures C++', color: '#1C4A3B', initialPresent: 23, initialTotal: 28 },
] as const;

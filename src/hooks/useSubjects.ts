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
  restore,
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

  return {
    subjects,
    loading,
    error,
    refresh: load,
    createSubject,
    updateSubject,
    deleteSubject,
    restoreSubject,
  };
}

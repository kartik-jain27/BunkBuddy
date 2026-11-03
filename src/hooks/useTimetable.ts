import { useCallback, useEffect, useState } from 'react';

import { useDatabase } from '../db/DatabaseProvider';
import { listSlots } from '../db/repo/slots';
import type { Slot } from '../lib/timetable';

export interface UseTimetableResult {
  slots: Slot[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useTimetable(): UseTimetableResult {
  const db = useDatabase();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    try {
      setSlots(await listSlots());
      setError(null);
    } catch {
      setError("Couldn't load your timetable.");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listSlots()
      .then((rows) => {
        if (!cancelled) {
          setSlots(rows);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load your timetable.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [db]);

  return { slots, loading, error, refresh };
}

import { useMemo } from 'react';
import { format } from 'date-fns';
import { useStore } from '../store/useStore';
import { calculateStreakStats, StreakStats } from '../lib/streak';

export function useStreak(todayDate?: string): StreakStats {
  const checkIns = useStore((state) => state.checkIns);
  const today = useMemo(() => todayDate || format(new Date(), 'yyyy-MM-dd'), [todayDate]);

  return useMemo(() => {
    return calculateStreakStats(checkIns, today);
  }, [checkIns, today]);
}


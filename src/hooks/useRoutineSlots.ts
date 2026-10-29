import { useMemo } from 'react';
import { format } from 'date-fns';
import { useStore } from '../store/useStore';
import { useWeeklyPlan } from './useWeeklyPlan';
import { buildDailyRoutineSlots, RoutineSteps } from '../lib/matchProducts';
import { Day } from '../types';

export function useRoutineSlots(selectedDay?: Day): {
  slots: RoutineSteps;
  currentDay: Day;
  todayDate: string;
} {
  const products = useStore((state) => state.products);
  const { plan } = useWeeklyPlan();

  const todayDate = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  // Compute current day of week ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')
  const defaultDay = useMemo((): Day => {
    const dayIndex = new Date().getDay(); // 0 is Sun, 1 is Mon...
    const map: Day[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    return map[dayIndex];
  }, []);

  const currentDay = selectedDay || defaultDay;

  const slots = useMemo(() => {
    return buildDailyRoutineSlots(products, plan, currentDay);
  }, [products, plan, currentDay]);

  return { slots, currentDay, todayDate };
}


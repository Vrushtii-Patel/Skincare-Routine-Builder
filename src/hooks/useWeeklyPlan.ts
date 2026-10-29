import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { loadReferenceData } from '../lib/loadData';
import { buildWeeklyPlan } from '../lib/buildWeeklyPlan';
import { WeekPlan } from '../types';

export function useWeeklyPlan(): { plan: WeekPlan; data: ReturnType<typeof loadReferenceData> } {
  const products = useStore((state) => state.products);
  const profile = useStore((state) => state.profile);

  const data = useMemo(() => loadReferenceData(), []);

  const plan = useMemo(() => {
    return buildWeeklyPlan(products, profile, data);
  }, [products, profile, data]);

  return { plan, data };
}


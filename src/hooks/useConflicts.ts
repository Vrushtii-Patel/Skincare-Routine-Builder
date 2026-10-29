import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { loadReferenceData } from '../lib/loadData';
import { matchProductConflicts } from '../lib/matchRules';
import { MatchedConflict } from '../types';

export function useConflicts(): {
  conflicts: MatchedConflict[];
  hasCautions: boolean;
  hasNotices: boolean;
} {
  const products = useStore((state) => state.products);
  const data = useMemo(() => loadReferenceData(), []);

  const conflicts = useMemo(() => {
    return matchProductConflicts(products, data);
  }, [products, data]);

  const hasCautions = useMemo(() => conflicts.some((c) => c.severity === 'caution'), [conflicts]);
  const hasNotices = useMemo(() => conflicts.some((c) => c.severity === 'notice'), [conflicts]);

  return { conflicts, hasCautions, hasNotices };
}


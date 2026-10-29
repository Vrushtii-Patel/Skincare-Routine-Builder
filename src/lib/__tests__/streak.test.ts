import { describe, it, expect } from 'vitest';
import { calculateStreakStats } from '../streak';
import { CheckInRecord } from '../../types';

describe('Streak and Completion Engine', () => {
  it('calculates current streak when today is completed', () => {
    const checkIns: Record<string, CheckInRecord> = {
      '2026-10-27': { am: true, pm: true },
      '2026-10-28': { am: true, pm: false },
      '2026-10-29': { am: true, pm: false }, // Today
    };

    const stats = calculateStreakStats(checkIns, '2026-10-29');
    expect(stats.currentStreak).toBe(3);
    expect(stats.isTodayAmComplete).toBe(true);
    expect(stats.isTodayPmComplete).toBe(false);
  });

  it('keeps streak active if yesterday was completed and today is not completed yet', () => {
    const checkIns: Record<string, CheckInRecord> = {
      '2026-10-27': { am: true, pm: true },
      '2026-10-28': { am: false, pm: true }, // Yesterday
      // 2026-10-29 (Today) not done yet
    };

    const stats = calculateStreakStats(checkIns, '2026-10-29');
    expect(stats.currentStreak).toBe(2);
    expect(stats.isTodayAmComplete).toBe(false);
    expect(stats.isTodayPmComplete).toBe(false);
  });

  it('resets streak to 0 if yesterday was missed and today is not completed yet', () => {
    const checkIns: Record<string, CheckInRecord> = {
      '2026-10-25': { am: true, pm: true },
      '2026-10-26': { am: true, pm: true },
      // 2026-10-27 missed
      // 2026-10-28 missed
    };

    const stats = calculateStreakStats(checkIns, '2026-10-29');
    expect(stats.currentStreak).toBe(0);
  });

  it('calculates longest streak historically', () => {
    const checkIns: Record<string, CheckInRecord> = {
      '2026-10-01': { am: true, pm: false },
      '2026-10-02': { am: true, pm: false },
      '2026-10-03': { am: true, pm: false },
      '2026-10-04': { am: true, pm: false }, // 4 day run
      // gap
      '2026-10-28': { am: true, pm: false },
      '2026-10-29': { am: true, pm: false }, // 2 day run
    };

    const stats = calculateStreakStats(checkIns, '2026-10-29');
    expect(stats.currentStreak).toBe(2);
    expect(stats.longestStreak).toBe(4);
    expect(stats.totalCompletedDays).toBe(6);
  });
});


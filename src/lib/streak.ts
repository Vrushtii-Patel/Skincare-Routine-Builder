/**
 * Skincare Daily Check-In & Streak Engine
 * Pure TypeScript functions operating with YYYY-MM-DD local dates.
 */

import { subDays, parseISO, format, isValid } from 'date-fns';
import { CheckInRecord } from '../types';

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  totalCompletedDays: number;
  isTodayAmComplete: boolean;
  isTodayPmComplete: boolean;
  completionRate7d: number;
}

/**
 * Calculates streak and completion stats for check-in records relative to today.
 */
export function calculateStreakStats(
  checkIns: Record<string, CheckInRecord>,
  todayString: string
): StreakStats {
  const todayDate = parseISO(todayString);
  if (!isValid(todayDate)) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalCompletedDays: 0,
      isTodayAmComplete: false,
      isTodayPmComplete: false,
      completionRate7d: 0,
    };
  }

  const todayRecord = checkIns[todayString];
  const isTodayAmComplete = !!todayRecord?.am;
  const isTodayPmComplete = !!todayRecord?.pm;
  const isTodayAnyComplete = isTodayAmComplete || isTodayPmComplete;

  // Total completed days (any day with at least one routine done)
  const completedDateStrings = Object.keys(checkIns).filter(
    (d) => checkIns[d]?.am || checkIns[d]?.pm
  );
  const totalCompletedDays = completedDateStrings.length;

  // Calculate current streak
  let currentStreak = 0;
  let checkDate = todayDate;

  // If today is completed, start from today, else start checking from yesterday
  if (isTodayAnyComplete) {
    currentStreak += 1;
    checkDate = subDays(todayDate, 1);
  } else {
    // If today is not done yet, streak can continue if yesterday was done
    checkDate = subDays(todayDate, 1);
  }

  while (true) {
    const dateStr = format(checkDate, 'yyyy-MM-dd');
    const rec = checkIns[dateStr];
    if (rec && (rec.am || rec.pm)) {
      currentStreak += 1;
      checkDate = subDays(checkDate, 1);
    } else {
      break;
    }
  }

  // Calculate longest streak historically
  const sortedDates = completedDateStrings.sort();
  let longestStreak = currentStreak;
  let currentRun = 0;
  let prevDate: Date | null = null;

  for (const dateStr of sortedDates) {
    const d = parseISO(dateStr);
    if (!prevDate) {
      currentRun = 1;
    } else {
      const dayDiff = Math.round((d.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      if (dayDiff === 1) {
        currentRun += 1;
      } else if (dayDiff > 1) {
        currentRun = 1;
      }
    }
    prevDate = d;
    if (currentRun > longestStreak) {
      longestStreak = currentRun;
    }
  }

  // 7-day completion rate
  let last7DaysDone = 0;
  for (let i = 0; i < 7; i++) {
    const dStr = format(subDays(todayDate, i), 'yyyy-MM-dd');
    if (checkIns[dStr]?.am || checkIns[dStr]?.pm) {
      last7DaysDone += 1;
    }
  }
  const completionRate7d = Math.round((last7DaysDone / 7) * 100);

  return {
    currentStreak,
    longestStreak,
    totalCompletedDays,
    isTodayAmComplete,
    isTodayPmComplete,
    completionRate7d,
  };
}


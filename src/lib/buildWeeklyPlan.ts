/**
 * Deterministic Skincare Routine Scheduling Engine
 * Reference: MASTER_CONTEXT.md section D and AUDIT_REPORT.md.
 * Pure TypeScript, no clock access, no side effects, deterministic.
 */

import {
  Product,
  Profile,
  ReferenceData,
  WeekPlan,
  PlanWarning,
  PlanDecision,
  Day,
  ConflictRule,
} from '../types';
import { findRuleForIngredientPair } from './matchRules';

export const DAYS_OF_WEEK: Day[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const IRRITATION_RANK: Record<string, number> = {
  high: 3,
  moderate: 2,
  low: 1,
  none: 0,
};

interface ScheduledUnit {
  id: string;
  product: Product;
  scheduledIngredients: string[];
  nights: number;
  time: 'AM' | 'PM' | 'any';
  isFixed: boolean;
  fixedDays?: Day[];
  hasRetinoid: boolean;
  maxIrritation: number;
  degree: number;
}

function getSeverityWeight(
  severity: ConflictRule['severity'],
  weights: ReferenceData['scheduling']['penaltyWeights']
): number {
  if (severity === 'caution') return weights.caution;
  if (severity === 'notice') return weights.notice;
  return 0;
}

/**
 * Generates an explainable, deterministic weekly schedule for active skincare products.
 */
export function buildWeeklyPlan(
  products: Product[],
  profile: Profile,
  data: ReferenceData
): WeekPlan {
  const warnings: PlanWarning[] = [];
  const decisions: PlanDecision[] = [];
  const explanations: string[] = [];

  // Initialize weekly grid and every-routine sets
  const grid: Record<'AM' | 'PM', Record<Day, string[]>> = {
    AM: { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] },
    PM: { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] },
  };

  const everyRoutine: Record<'AM' | 'PM', string[]> = {
    AM: [],
    PM: [],
  };

  const ingredientMap = new Map(data.ingredients.map((i) => [i.id, i]));
  const excludedSet = new Set(profile.excludedIngredients || []);

  // Filter active products and sort by ID for absolute determinism
  const activeProducts = [...products]
    .filter((p) => !p.isArchived)
    .sort((a, b) => a.id.localeCompare(b.id));

  // Step 1: Evaluate exclusions, every-routine items, and scheduled units
  const candidateUnits: ScheduledUnit[] = [];

  for (const prod of activeProducts) {
    // 1.1 Excluded ingredients check (Hard constraint 2)
    const productExcluded = prod.ingredients.filter((id) => excludedSet.has(id));
    if (productExcluded.length > 0) {
      const names = productExcluded.map((id) => ingredientMap.get(id)?.name || id).join(', ');
      decisions.push({
        code: 'EXCLUDED_INGREDIENT',
        productId: prod.id,
        reason: `Contains excluded ingredient(s): ${names}. The app never auto-schedules avoided ingredients.`,
        resolutionOptions: [
          'Remove product from shelf',
          'Review excluded ingredients in Settings',
        ],
      });
      continue;
    }

    // 1.2 Identify scheduled, user-directed, and every-routine ingredients
    const scheduledIngs = prod.ingredients.filter(
      (id) => ingredientMap.get(id)?.schedulingMode === 'scheduled'
    );
    const userDirectedIngs = prod.ingredients.filter(
      (id) => ingredientMap.get(id)?.schedulingMode === 'user-directed'
    );
    const everyRoutineIngs = prod.ingredients.filter(
      (id) => ingredientMap.get(id)?.schedulingMode === 'every-routine'
    );

    // 1.3 Prescription / user-directed check (e.g. tretinoin, tazarotene)
    if (userDirectedIngs.length > 0) {
      const hasDirections =
        prod.directions &&
        ((prod.directions.fixedDays && prod.directions.fixedDays.length > 0) ||
          (typeof prod.directions.nightsPerWeek === 'number' && prod.directions.nightsPerWeek > 0));

      if (!hasDirections) {
        decisions.push({
          code: 'NEEDS_CLINICIAN_DIRECTIONS',
          productId: prod.id,
          reason:
            "Add the schedule your prescriber gave you. We don't suggest one for prescription products.",
          resolutionOptions: [
            'Edit product to add prescriber directions',
            'Consult your dermatologist or doctor',
          ],
        });
        continue;
      }
    }

    // 1.4 Handle every-routine products (cleansers, moisturizers, gentle serums)
    if (scheduledIngs.length === 0 && userDirectedIngs.length === 0) {
      // Basic routine items or gentle actives
      const isSunscreen = prod.type === 'sunscreen' || prod.ingredients.includes('sunscreen-filters');
      const isCleanser = prod.type === 'cleanser';
      const isMoisturizer = prod.type === 'moisturizer';

      if (isSunscreen) {
        everyRoutine.AM.push(prod.id);
      } else if (isCleanser || isMoisturizer) {
        everyRoutine.AM.push(prod.id);
        everyRoutine.PM.push(prod.id);
      } else {
        // Serums / Toners / Hydrators
        const timePref = prod.directions?.time || (
          everyRoutineIngs.some((id) => ingredientMap.get(id)?.preferredTime === 'AM')
            ? 'AM'
            : everyRoutineIngs.some((id) => ingredientMap.get(id)?.preferredTime === 'PM')
            ? 'PM'
            : 'any'
        );

        if (timePref === 'AM' || timePref === 'any') {
          everyRoutine.AM.push(prod.id);
        }
        if (timePref === 'PM' || timePref === 'any') {
          everyRoutine.PM.push(prod.id);
        }
      }
      continue;
    }

    // 1.5 Build scheduled unit
    // Calculate nights per week
    let nights = 0;
    const allActives = [...scheduledIngs, ...userDirectedIngs];

    if (typeof prod.directions?.nightsPerWeek === 'number') {
      const maxUserNights = Math.min(
        ...allActives.map((k) => data.frequencies[k]?.maxUserNights ?? 7)
      );

      if (
        prod.directions.nightsPerWeek > maxUserNights &&
        prod.directions.source !== 'clinician'
      ) {
        nights = maxUserNights;
        warnings.push({
          code: 'NIGHTS_CAPPED_AT_MAX',
          severity: 'notice',
          productIds: [prod.id],
          message: `Nights per week for ${prod.name} capped at default safe maximum of ${maxUserNights} (label/clinician override required for higher).`,
        });
      } else {
        nights = prod.directions.nightsPerWeek;
      }
    } else if (scheduledIngs.length > 0) {
      // Lowest applicable default among scheduled actives
      nights = Math.min(
        ...scheduledIngs.map((k) => {
          const freq = data.frequencies[k];
          if (!freq) return 3;
          return profile.sensitive ? freq.sensitiveNights ?? 2 : freq.normalNights ?? 3;
        })
      );

      if (prod.productForm === 'rinse-off' && !prod.directions?.nightsPerWeek) {
        explanations.push(
          `${prod.name} (rinse-off) is using leave-on planning defaults because no specific directions were entered.`
        );
      }
    }

    // Determine initial time preference
    let time: 'AM' | 'PM' | 'any' = 'any';
    if (prod.directions?.time) {
      time = prod.directions.time;
    } else {
      const timeSet = new Set(
        allActives.map((k) => data.frequencies[k]?.time || ingredientMap.get(k)?.preferredTime || 'any')
      );
      timeSet.delete('any');
      if (timeSet.size === 1) {
        time = Array.from(timeSet)[0] as 'AM' | 'PM';
      } else if (timeSet.has('PM')) {
        time = 'PM';
      }
    }

    const hasRetinoid = prod.ingredients.some(
      (id) => ingredientMap.get(id)?.tags.includes('retinoid')
    );

    const maxIrritation = Math.max(
      0,
      ...prod.ingredients.map(
        (id) => IRRITATION_RANK[ingredientMap.get(id)?.irritationPotential || 'none'] ?? 0
      )
    );

    const isFixed =
      prod.directions?.source === 'clinician' &&
      Array.isArray(prod.directions?.fixedDays) &&
      prod.directions.fixedDays.length > 0;

    candidateUnits.push({
      id: prod.id,
      product: prod,
      scheduledIngredients: allActives,
      nights,
      time,
      isFixed,
      fixedDays: prod.directions?.fixedDays,
      hasRetinoid,
      maxIrritation,
      degree: 0,
    });
  }

  // Deduplicate everyRoutine lists
  everyRoutine.AM = Array.from(new Set(everyRoutine.AM));
  everyRoutine.PM = Array.from(new Set(everyRoutine.PM));

  // Step 2: Place clinician fixed days first (Hard constraint 1)
  const placedUnits: ScheduledUnit[] = [];
  const unitsToSchedule: ScheduledUnit[] = [];

  for (const u of candidateUnits) {
    if (u.isFixed && u.fixedDays) {
      const slotTime = u.time === 'AM' ? 'AM' : 'PM';
      for (const day of u.fixedDays) {
        grid[slotTime][day].push(u.id);
      }
      explanations.push(
        `Following your prescriber's directions for ${u.product.name} on ${u.fixedDays.join(', ')}.`
      );
      placedUnits.push(u);
    } else {
      unitsToSchedule.push(u);
    }
  }

  // Step 3: Compute soft rule pairs between units to schedule
  const softPairs = new Map<string, ConflictRule>();

  for (let i = 0; i < unitsToSchedule.length; i++) {
    for (let j = i + 1; j < unitsToSchedule.length; j++) {
      const uA = unitsToSchedule[i];
      const uB = unitsToSchedule[j];

      // Check clinician-directed together suppression
      const aDirectsB = uA.product.directions?.directedTogetherWith?.includes(uB.id);
      const bDirectsA = uB.product.directions?.directedTogetherWith?.includes(uA.id);
      const isClinicianSuppressed =
        (uA.product.directions?.source === 'clinician' && aDirectsB) ||
        (uB.product.directions?.source === 'clinician' && bDirectsA);

      let highestPenaltyRule: ConflictRule | null = null;
      let highestWeight = -1;

      for (const ingA of uA.scheduledIngredients) {
        for (const ingB of uB.scheduledIngredients) {
          if (ingA === ingB) continue;
          const rule = findRuleForIngredientPair(ingA, ingB, data);
          if (!rule || rule.enforcement !== 'soft') continue;

          if (
            isClinicianSuppressed &&
            rule.excludeWhen.includes('clinician-directed-together')
          ) {
            continue;
          }

          const weight = getSeverityWeight(rule.severity, data.scheduling.penaltyWeights);
          if (weight > highestWeight) {
            highestWeight = weight;
            highestPenaltyRule = rule;
          }
        }
      }

      if (highestPenaltyRule) {
        const pairKey = [uA.id, uB.id].sort().join('::');
        softPairs.set(pairKey, highestPenaltyRule);
        uA.degree += 1;
        uB.degree += 1;
      }
    }
  }

  // Step 4: Time-of-day resolution
  const sortedPairKeys = Array.from(softPairs.keys()).sort();
  for (const pairKey of sortedPairKeys) {
    const rule = softPairs.get(pairKey)!;
    const [id1, id2] = pairKey.split('::');
    const u1 = unitsToSchedule.find((u) => u.id === id1);
    const u2 = unitsToSchedule.find((u) => u.id === id2);

    if (!u1 || !u2) continue;

    if (rule.resolutionOrder && rule.resolutionOrder[0] === 'time-of-day') {
      if (u1.time === 'any' && (u2.time === 'AM' || u2.time === 'PM')) {
        u1.time = u2.time === 'PM' ? 'AM' : 'PM';
        explanations.push(
          `${u1.product.name} moved to ${u1.time === 'AM' ? 'morning' : 'evening'} (separated from ${u2.product.name} by time of day, rule ${rule.id}).`
        );
      } else if (u2.time === 'any' && (u1.time === 'AM' || u1.time === 'PM')) {
        u2.time = u1.time === 'PM' ? 'AM' : 'PM';
        explanations.push(
          `${u2.product.name} moved to ${u2.time === 'AM' ? 'morning' : 'evening'} (separated from ${u1.product.name} by time of day, rule ${rule.id}).`
        );
      }
    }
  }

  // Default any remaining 'any' units to PM
  for (const u of unitsToSchedule) {
    if (u.time === 'any') {
      u.time = 'PM';
    }
  }

  // Step 5: Sort units by degree desc, nights desc, maxIrritation desc, id asc
  unitsToSchedule.sort((a, b) => {
    if (a.degree !== b.degree) return b.degree - a.degree;
    if (a.nights !== b.nights) return b.nights - a.nights;
    if (a.maxIrritation !== b.maxIrritation) return b.maxIrritation - a.maxIrritation;
    return a.id.localeCompare(b.id);
  });

  // Step 6: Greedy Placement with deterministic score (penalty, activesInSlot, dayIndex)
  const W = data.scheduling.penaltyWeights;

  for (const u of unitsToSchedule) {
    const chosenDays: Day[] = [];
    const needed = Math.min(u.nights, 7);

    for (let step = 0; step < needed; step++) {
      let bestScore: [number, number, number] | null = null;
      let bestDay: Day | null = null;

      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const day = DAYS_OF_WEEK[dayIndex];
        if (chosenDays.includes(day)) continue;

        let penalty = 0;
        const currentSlot = grid[u.time as 'AM' | 'PM'][day];

        // Soft rule penalties with units already in that slot-night
        for (const existingId of currentSlot) {
          const pairKey = [u.id, existingId].sort().join('::');
          const rule = softPairs.get(pairKey);
          if (rule && rule.resolutionOrder.includes('night')) {
            penalty += getSeverityWeight(rule.severity, W);
          }
        }

        // Over max scheduled actives penalty
        if (currentSlot.length >= data.scheduling.maxScheduledActivesPerNight) {
          penalty += W.overMaxActives ?? 2;
        }

        // Consecutive retinoid check across ALL retinoid products (Bugfix from Python prototype!)
        if (u.hasRetinoid && u.time === 'PM') {
          const prevDayIndex = (dayIndex - 1 + 7) % 7;
          const nextDayIndex = (dayIndex + 1) % 7;
          const prevDay = DAYS_OF_WEEK[prevDayIndex];
          const nextDay = DAYS_OF_WEEK[nextDayIndex];

          const hasRetinoidOnDay = (d: Day) => {
            if (chosenDays.includes(d)) return true; // Unit itself scheduled
            // Check all other units already placed in PM on that day
            const prodsInPM = grid.PM[d];
            return prodsInPM.some((pId) => {
              const otherUnit = candidateUnits.find((cu) => cu.id === pId);
              return otherUnit?.hasRetinoid ?? false;
            });
          };

          if (hasRetinoidOnDay(prevDay) || hasRetinoidOnDay(nextDay)) {
            penalty += W.consecutiveRetinoid ?? 3;
          }
        }

        const score: [number, number, number] = [penalty, currentSlot.length, dayIndex];

        if (bestScore === null) {
          bestScore = score;
          bestDay = day;
        } else if (
          score[0] < bestScore[0] ||
          (score[0] === bestScore[0] && score[1] < bestScore[1]) ||
          (score[0] === bestScore[0] && score[1] === bestScore[1] && score[2] < bestScore[2])
        ) {
          bestScore = score;
          bestDay = day;
        }
      }

      if (bestDay !== null && bestScore !== null) {
        chosenDays.push(bestDay);
        grid[u.time as 'AM' | 'PM'][bestDay].push(u.id);

        if (bestScore[0] > 0) {
          warnings.push({
            code: 'UNRESOLVED_SOFT_PENALTY',
            severity: 'notice',
            productIds: [u.id],
            message: `${u.product.name} on ${bestDay.toUpperCase()} (${u.time}): scheduled with soft overlap penalty of ${bestScore[0]}.`,
          });
        }
      }
    }
  }

  // Step 7: Independent Validation & Post-schedule checks
  // 7.1 Rest Nights Check
  const pmRestDays = DAYS_OF_WEEK.filter((d) => grid.PM[d].length === 0);
  if (pmRestDays.length < data.scheduling.restNightsMin) {
    warnings.push({
      code: 'REST_NIGHTS_SHORT',
      severity: 'notice',
      productIds: [],
      message: `Schedule has only ${pmRestDays.length} evening rest night(s) without scheduled actives (recommendation is at least ${data.scheduling.restNightsMin} rest nights).`,
      tip: 'Consider reducing the weekly frequency of one active or consulting a dermatologist.',
    });
  }

  // 7.2 Check for accidental consecutive retinoids in final grid
  for (let i = 0; i < 7; i++) {
    const day = DAYS_OF_WEEK[i];
    const nextDay = DAYS_OF_WEEK[(i + 1) % 7];

    const dayHasRetinoid = grid.PM[day].some((pId) => {
      const u = candidateUnits.find((cu) => cu.id === pId);
      return u?.hasRetinoid;
    });

    const nextDayHasRetinoid = grid.PM[nextDay].some((pId) => {
      const u = candidateUnits.find((cu) => cu.id === pId);
      return u?.hasRetinoid;
    });

    if (dayHasRetinoid && nextDayHasRetinoid) {
      const existingWarning = warnings.some((w) => w.code === 'CONSECUTIVE_RETINOID_WARNING');
      if (!existingWarning) {
        warnings.push({
          code: 'CONSECUTIVE_RETINOID_WARNING',
          severity: 'caution',
          productIds: [],
          message: `Retinoids are scheduled on consecutive nights (${day.toUpperCase()} & ${nextDay.toUpperCase()}).`,
          tip: 'Alternating retinoids still exposes skin to vitamin A every night. Consider reducing days to allow skin recovery.',
        });
      }
    }
  }

  // 7.3 Determine overall plan status
  let status: WeekPlan['status'] = 'ok';
  if (decisions.length > 0) {
    status = 'needs-decision';
  } else if (warnings.length > 0) {
    status = 'ok-with-warnings';
  }

  return {
    status,
    grid,
    everyRoutine,
    warnings,
    decisions,
    explanations,
  };
}

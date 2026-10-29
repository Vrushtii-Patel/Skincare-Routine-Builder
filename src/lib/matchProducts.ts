/**
 * Routine Steps and Product Matching Engine
 * Pure TypeScript functions matching products to ordered daily routine slots.
 */

import { Product, RoutineSlotItem, WeekPlan, Day } from '../types';

export interface RoutineSteps {
  AM: RoutineSlotItem[];
  PM: RoutineSlotItem[];
}

/**
 * Builds ordered routine slots for morning and evening, mapping user products and identifying gaps.
 */
export function buildDailyRoutineSlots(
  products: Product[],
  weekPlan: WeekPlan,
  currentDay: Day
): RoutineSteps {
  const activeProducts = products.filter((p) => !p.isArchived);

  // Active product IDs scheduled for this day
  const amActiveIds = new Set([
    ...(weekPlan.grid.AM[currentDay] || []),
    ...(weekPlan.everyRoutine.AM || []),
  ]);

  const pmActiveIds = new Set([
    ...(weekPlan.grid.PM[currentDay] || []),
    ...(weekPlan.everyRoutine.PM || []),
  ]);

  const buildSlotsForRoutine = (
    timeOfDay: 'AM' | 'PM',
    scheduledIds: Set<string>
  ): RoutineSlotItem[] => {
    const slots: RoutineSlotItem[] = [];

    // 1. Cleanser (Essential)
    const cleanser = activeProducts.find((p) => p.type === 'cleanser');
    slots.push({
      slot: 'cleanser',
      product: cleanser,
      isOptional: false,
      isGap: !cleanser,
      guidance: timeOfDay === 'AM'
        ? 'Gently remove overnight oils and prepare skin.'
        : 'Remove makeup, sunscreen, and daily buildup with a gentle cleanser.',
    });

    // 2. Toner (Optional)
    const toners = activeProducts.filter(
      (p) => p.type === 'toner' && scheduledIds.has(p.id)
    );
    if (toners.length > 0) {
      for (const t of toners) {
        slots.push({
          slot: 'toner',
          product: t,
          isOptional: true,
          isGap: false,
          guidance: 'Pat gently onto damp skin to balance and hydrate.',
        });
      }
    }

    // 3. Serums & Treatments (Actives & Hydrators)
    const treatments = activeProducts.filter(
      (p) => (p.type === 'serum' || p.type === 'treatment' || p.type === 'exfoliant') && scheduledIds.has(p.id)
    );

    if (treatments.length > 0) {
      for (const t of treatments) {
        slots.push({
          slot: t.type === 'exfoliant' ? 'treatment' : 'serum',
          product: t,
          isOptional: true,
          isGap: false,
          guidance: t.productForm === 'rinse-off'
            ? 'Apply, leave on for recommended minutes, then rinse thoroughly.'
            : 'Apply 3-4 drops to face and neck. Allow 30 seconds to absorb.',
        });
      }
    }

    // 4. Moisturizer (Essential)
    const moisturizer = activeProducts.find((p) => p.type === 'moisturizer');
    slots.push({
      slot: 'moisturizer',
      product: moisturizer,
      isOptional: false,
      isGap: !moisturizer,
      guidance: timeOfDay === 'AM'
        ? 'Lightweight hydration to support your moisture barrier throughout the day.'
        : 'Nourishing cream to seal in actives and repair skin overnight.',
    });

    // 5. Sunscreen (Essential in AM, omitted in PM)
    if (timeOfDay === 'AM') {
      const sunscreen = activeProducts.find(
        (p) => p.type === 'sunscreen' || p.ingredients.includes('sunscreen-filters')
      );
      slots.push({
        slot: 'sunscreen',
        product: sunscreen,
        isOptional: false,
        isGap: !sunscreen,
        guidance: 'Use broad-spectrum SPF 30+ and water-resistant sunscreen, and reapply about every 2 hours when outdoors. Follow the label.',
      });
    }

    return slots;
  };

  return {
    AM: buildSlotsForRoutine('AM', amActiveIds),
    PM: buildSlotsForRoutine('PM', pmActiveIds),
  };
}

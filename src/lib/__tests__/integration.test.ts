import { describe, it, expect, beforeEach } from 'vitest';
import { useStore, SAMPLE_PRODUCTS } from '../../store/useStore';
import { buildWeeklyPlan } from '../buildWeeklyPlan';
import { loadReferenceData } from '../loadData';

describe('Integration Flow: Quiz -> Shelf -> Plan -> Check-In', () => {
  beforeEach(() => {
    useStore.getState().clearAllData();
  });

  it('completes the onboarding quiz and persists user profile', () => {
    const store = useStore.getState();
    expect(store.profile.isOnboarded).toBe(false);

    store.updateProfile({
      skinType: 'oily',
      concerns: ['acne', 'texture'],
      sensitive: false,
      experienceLevel: 'intermediate',
      isOnboarded: true,
    });

    const updated = useStore.getState();
    expect(updated.profile.isOnboarded).toBe(true);
    expect(updated.profile.skinType).toBe('oily');
    expect(updated.profile.concerns).toEqual(['acne', 'texture']);
  });

  it('adds products to shelf and generates a valid week plan', () => {
    const store = useStore.getState();
    const data = loadReferenceData();

    // Add cleanser
    store.addProduct({
      name: 'Gentle Cleanser',
      type: 'cleanser',
      ingredients: ['glycerin'],
      productForm: 'rinse-off',
      openedOn: '2026-10-01',
      monthsValid: 12,
      bottle: 'pump',
      color: '#919D85',
      isCombinationProduct: false,
    });

    // Add retinol
    store.addProduct({
      name: 'Retinol 0.2%',
      type: 'serum',
      ingredients: ['retinol'],
      productForm: 'leave-on',
      openedOn: '2026-10-01',
      monthsValid: 6,
      bottle: 'dropper',
      color: '#C496A1',
      isCombinationProduct: false,
    });

    const currentProds = useStore.getState().products;
    expect(currentProds).toHaveLength(2);

    const plan = buildWeeklyPlan(currentProds, useStore.getState().profile, data);
    expect(plan.status).toBe('ok');
    // Cleanser should be in everyRoutine AM and PM
    expect(plan.everyRoutine.AM).toContain(currentProds[0].id);
    expect(plan.everyRoutine.PM).toContain(currentProds[0].id);

    // Retinol should be scheduled in PM (3 nights for normal skin)
    const retinolNights = Object.values(plan.grid.PM).filter((slot) => slot.includes(currentProds[1].id)).length;
    expect(retinolNights).toBe(3);
  });

  it('records routine check-ins and tracks streak', () => {
    const store = useStore.getState();
    store.recordRoutineCheckIn('2026-10-29', 'am', true);
    store.recordRoutineCheckIn('2026-10-29', 'pm', true);

    const checkIns = useStore.getState().checkIns;
    expect(checkIns['2026-10-29'].am).toBe(true);
    expect(checkIns['2026-10-29'].pm).toBe(true);
  });

  it('exports state to JSON and imports it back reliably', () => {
    const store = useStore.getState();
    store.loadSampleData();

    const exportedJson = store.exportData();
    expect(typeof exportedJson).toBe('string');
    expect(exportedJson).toContain('Skincare Routine Builder');

    // Clear state
    store.clearAllData();
    expect(useStore.getState().products).toHaveLength(0);

    // Re-import
    const result = store.importData(exportedJson);
    expect(result.success).toBe(true);
    expect(useStore.getState().products).toHaveLength(SAMPLE_PRODUCTS.length);
  });
});


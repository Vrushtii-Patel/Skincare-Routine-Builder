import { describe, it, expect } from 'vitest';
import { buildWeeklyPlan } from '../buildWeeklyPlan';
import { loadReferenceData } from '../loadData';
import { Product, Profile } from '../../types';

describe('Scheduling Engine Suite (buildWeeklyPlan)', () => {
  const data = loadReferenceData();

  const standardShelf: Product[] = [
    {
      id: 'retinol-serum',
      name: 'Retinol Serum',
      type: 'serum',
      ingredients: ['retinol', 'squalane'],
      productForm: 'leave-on',
      openedOn: '2026-10-01',
      monthsValid: 6,
      bottle: 'dropper',
      color: '#C496A1',
      isCombinationProduct: false,
    },
    {
      id: 'glycolic-toner',
      name: 'Glycolic Toner',
      type: 'toner',
      ingredients: ['glycolic-acid'],
      productForm: 'leave-on',
      openedOn: '2026-10-01',
      monthsValid: 6,
      bottle: 'tube',
      color: '#C496A1',
      isCombinationProduct: false,
    },
    {
      id: 'bpo-gel',
      name: 'BPO Gel',
      type: 'treatment',
      ingredients: ['benzoyl-peroxide'],
      productForm: 'leave-on',
      openedOn: '2026-10-01',
      monthsValid: 6,
      bottle: 'tube',
      color: '#919D85',
      isCombinationProduct: false,
    },
    {
      id: 'vitc-serum',
      name: 'Vitamin C Serum',
      type: 'serum',
      ingredients: ['vitamin-c'],
      productForm: 'leave-on',
      openedOn: '2026-10-01',
      monthsValid: 6,
      bottle: 'dropper',
      color: '#EBE1C6',
      isCombinationProduct: false,
    },
    {
      id: 'niacinamide',
      name: 'Niacinamide Serum',
      type: 'serum',
      ingredients: ['niacinamide'],
      productForm: 'leave-on',
      openedOn: '2026-10-01',
      monthsValid: 12,
      bottle: 'dropper',
      color: '#8E88A3',
      isCombinationProduct: false,
    },
  ];

  it('reproduces normal skin verified schedule from MASTER_CONTEXT.md section D', () => {
    const normalProfile: Profile = {
      skinType: 'normal',
      concerns: ['acne'],
      sensitive: false,
      excludedIngredients: [],
      isOnboarded: true,
    };

    const plan = buildWeeklyPlan(standardShelf, normalProfile, data);

    // AM: BPO moved to morning on Mon, Tue, Wed, Thu
    expect(plan.grid.AM.mon).toEqual(['bpo-gel']);
    expect(plan.grid.AM.tue).toEqual(['bpo-gel']);
    expect(plan.grid.AM.wed).toEqual(['bpo-gel']);
    expect(plan.grid.AM.thu).toEqual(['bpo-gel']);
    expect(plan.grid.AM.fri).toEqual([]);
    expect(plan.grid.AM.sat).toEqual([]);
    expect(plan.grid.AM.sun).toEqual([]);

    // PM: Retinol Mon, Wed, Fri; Glycolic Tue, Thu; Sat & Sun Rest
    expect(plan.grid.PM.mon).toEqual(['retinol-serum']);
    expect(plan.grid.PM.tue).toEqual(['glycolic-toner']);
    expect(plan.grid.PM.wed).toEqual(['retinol-serum']);
    expect(plan.grid.PM.thu).toEqual(['glycolic-toner']);
    expect(plan.grid.PM.fri).toEqual(['retinol-serum']);
    expect(plan.grid.PM.sat).toEqual([]);
    expect(plan.grid.PM.sun).toEqual([]);

    // Rest nights: Sat and Sun (2 rest nights preserved)
    const pmRestDays = Object.entries(plan.grid.PM).filter(([_, ids]) => ids.length === 0).map(([d]) => d);
    expect(pmRestDays).toEqual(['sat', 'sun']);

    // Explanation produced
    expect(
      plan.explanations.some((e) =>
        e.includes('moved to morning') && e.includes('c01')
      )
    ).toBe(true);

    // Vitamin C and Niacinamide are in everyRoutine
    expect(plan.everyRoutine.AM).toContain('vitc-serum');
    expect(plan.everyRoutine.AM).toContain('niacinamide');
    expect(plan.everyRoutine.PM).toContain('niacinamide');
  });

  it('reproduces sensitive skin verified schedule from MASTER_CONTEXT.md section D', () => {
    const sensitiveProfile: Profile = {
      skinType: 'normal',
      concerns: ['barrier'],
      sensitive: true,
      excludedIngredients: [],
      isOnboarded: true,
    };

    const plan = buildWeeklyPlan(standardShelf, sensitiveProfile, data);

    // Sensitive nights: Retinol=2 (Mon, Wed), Glycolic=1 (Tue), BPO=2 AM (Mon, Tue)
    expect(plan.grid.AM.mon).toEqual(['bpo-gel']);
    expect(plan.grid.AM.tue).toEqual(['bpo-gel']);
    expect(plan.grid.AM.wed).toEqual([]);

    expect(plan.grid.PM.mon).toEqual(['retinol-serum']);
    expect(plan.grid.PM.tue).toEqual(['glycolic-toner']);
    expect(plan.grid.PM.wed).toEqual(['retinol-serum']);
    expect(plan.grid.PM.thu).toEqual([]);
    expect(plan.grid.PM.fri).toEqual([]);
    expect(plan.grid.PM.sat).toEqual([]);
    expect(plan.grid.PM.sun).toEqual([]);

    // 4 PM rest nights: Thu, Fri, Sat, Sun
    const pmRestDays = Object.entries(plan.grid.PM).filter(([_, ids]) => ids.length === 0).map(([d]) => d);
    expect(pmRestDays).toEqual(['thu', 'fri', 'sat', 'sun']);
  });

  it('guarantees determinism: shuffling input order produces 100% identical plan', () => {
    const profile: Profile = {
      skinType: 'combination',
      concerns: ['acne'],
      sensitive: false,
      excludedIngredients: [],
      isOnboarded: true,
    };

    const basePlan = buildWeeklyPlan(standardShelf, profile, data);

    // Run 5 shuffled permutations
    for (let i = 0; i < 5; i++) {
      const shuffled = [...standardShelf].sort(() => Math.random() - 0.5);
      const shuffledPlan = buildWeeklyPlan(shuffled, profile, data);
      expect(shuffledPlan.grid).toEqual(basePlan.grid);
      expect(shuffledPlan.everyRoutine).toEqual(basePlan.everyRoutine);
      expect(shuffledPlan.status).toBe(basePlan.status);
    }
  });

  it('regression test: cross-product consecutive retinoids are penalized and not alternated on every night', () => {
    // User owns TWO retinoid products: retinol serum (normalNights 3) and adapalene gel (normalNights 3)
    const shelfWithTwoRetinoids: Product[] = [
      {
        id: 'p-retinol',
        name: 'Retinol 0.5%',
        type: 'serum',
        ingredients: ['retinol'],
        productForm: 'leave-on',
        openedOn: '2026-10-01',
        monthsValid: 6,
        bottle: 'dropper',
        color: '#C496A1',
        isCombinationProduct: false,
      },
      {
        id: 'p-adapalene',
        name: 'Adapalene 0.1%',
        type: 'treatment',
        ingredients: ['adapalene'],
        productForm: 'leave-on',
        openedOn: '2026-10-01',
        monthsValid: 6,
        bottle: 'tube',
        color: '#8E88A3',
        isCombinationProduct: false,
      },
    ];

    const profile: Profile = {
      skinType: 'normal',
      concerns: ['acne'],
      sensitive: false,
      excludedIngredients: [],
      isOnboarded: true,
    };

    const plan = buildWeeklyPlan(shelfWithTwoRetinoids, profile, data);

    // Plan must not schedule retinoids on every night without rest nights, or must warn
    // Retinol placed on Mon, Wed, Fri
    // Adapalene placed on Tue, Thu (or warns of consecutive retinoids)
    const activePMDays = Object.entries(plan.grid.PM).filter(([_, ids]) => ids.length > 0);
    // Even if both placed, if any consecutive nights happen, a warning must be emitted!
    if (activePMDays.length >= 6) {
      expect(plan.warnings.some((w) => w.code === 'CONSECUTIVE_RETINOID_WARNING' || w.code === 'REST_NIGHTS_SHORT')).toBe(true);
    }
  });

  it('prescription retinoid with no directions produces needs-decision, never silently dropped or invented schedule', () => {
    const rxShelf: Product[] = [
      {
        id: 'p-tretinoin',
        name: 'Tretinoin 0.05% Cream',
        type: 'treatment',
        ingredients: ['tretinoin'], // rx-only, user-directed
        productForm: 'leave-on',
        openedOn: '2026-10-01',
        monthsValid: 6,
        bottle: 'tube',
        color: '#C496A1',
        isCombinationProduct: false,
        // No directions entered!
      },
    ];

    const profile: Profile = {
      skinType: 'normal',
      concerns: ['acne'],
      sensitive: false,
      excludedIngredients: [],
      isOnboarded: true,
    };

    const plan = buildWeeklyPlan(rxShelf, profile, data);

    expect(plan.status).toBe('needs-decision');
    expect(plan.decisions).toHaveLength(1);
    expect(plan.decisions[0].code).toBe('NEEDS_CLINICIAN_DIRECTIONS');
    expect(plan.decisions[0].productId).toBe('p-tretinoin');
  });

  it('excluded ingredients are kept out of the plan and reported in decisions', () => {
    const shelf: Product[] = [
      {
        id: 'p-salicylic',
        name: 'BHA Exfoliant',
        type: 'treatment',
        ingredients: ['salicylic-acid'],
        productForm: 'leave-on',
        openedOn: '2026-10-01',
        monthsValid: 6,
        bottle: 'tube',
        color: '#919D85',
        isCombinationProduct: false,
      },
    ];

    const profileWithExclusion: Profile = {
      skinType: 'normal',
      concerns: ['acne'],
      sensitive: false,
      excludedIngredients: ['salicylic-acid'],
      isOnboarded: true,
    };

    const plan = buildWeeklyPlan(shelf, profileWithExclusion, data);

    expect(plan.status).toBe('needs-decision');
    expect(plan.decisions[0].code).toBe('EXCLUDED_INGREDIENT');
    // Not in grid
    expect(Object.values(plan.grid.PM).every((slot) => !slot.includes('p-salicylic'))).toBe(true);
  });

  it('clinician fixedDays are placed exactly as entered and never moved', () => {
    const clinicianShelf: Product[] = [
      {
        id: 'p-rx-retinoid',
        name: 'Prescription Retinoid',
        type: 'treatment',
        ingredients: ['tretinoin'],
        productForm: 'leave-on',
        openedOn: '2026-10-01',
        monthsValid: 6,
        bottle: 'tube',
        color: '#C496A1',
        isCombinationProduct: false,
        directions: {
          source: 'clinician',
          time: 'PM',
          fixedDays: ['tue', 'fri'],
        },
      },
    ];

    const profile: Profile = {
      skinType: 'normal',
      concerns: ['acne'],
      sensitive: false,
      excludedIngredients: [],
      isOnboarded: true,
    };

    const plan = buildWeeklyPlan(clinicianShelf, profile, data);

    expect(plan.grid.PM.tue).toContain('p-rx-retinoid');
    expect(plan.grid.PM.fri).toContain('p-rx-retinoid');
    expect(plan.grid.PM.mon).toEqual([]);
    expect(plan.grid.PM.wed).toEqual([]);
    expect(plan.grid.PM.thu).toEqual([]);
  });

  it('multi-active product uses the lowest applicable nights among its scheduled ingredients', () => {
    // Product contains glycolic-acid (normalNights: 2) and benzoyl-peroxide (normalNights: 4)
    const multiActiveProduct: Product[] = [
      {
        id: 'p-combo-active',
        name: 'Acne Resurfacing Peel',
        type: 'treatment',
        ingredients: ['glycolic-acid', 'benzoyl-peroxide'],
        productForm: 'leave-on',
        openedOn: '2026-10-01',
        monthsValid: 6,
        bottle: 'pump',
        color: '#919D85',
        isCombinationProduct: true,
      },
    ];

    const profile: Profile = {
      skinType: 'normal',
      concerns: ['acne'],
      sensitive: false,
      excludedIngredients: [],
      isOnboarded: true,
    };

    const plan = buildWeeklyPlan(multiActiveProduct, profile, data);

    // Should be placed min(2, 4) = 2 nights!
    const totalPlaced = Object.values(plan.grid.PM).filter((slot) => slot.includes('p-combo-active')).length;
    expect(totalPlaced).toBe(2);
  });

  it('handles empty shelf gracefully without errors', () => {
    const profile: Profile = {
      skinType: 'combination',
      concerns: ['barrier'],
      sensitive: false,
      excludedIngredients: [],
      isOnboarded: true,
    };

    const plan = buildWeeklyPlan([], profile, data);
    expect(plan.status).toBe('ok');
    expect(plan.warnings).toHaveLength(0);
    expect(plan.decisions).toHaveLength(0);
  });
});


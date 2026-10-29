import { describe, it, expect } from 'vitest';
import { findRuleForIngredientPair, matchProductConflicts } from '../matchRules';
import { loadReferenceData } from '../loadData';
import { Product } from '../../types';

describe('Match Rules Compatibility Engine', () => {
  const data = loadReferenceData();

  it('matches rules symmetrically (a/b order does not matter)', () => {
    const forward = findRuleForIngredientPair('retinol', 'benzoyl-peroxide', data);
    const backward = findRuleForIngredientPair('benzoyl-peroxide', 'retinol', data);

    expect(forward).not.toBeNull();
    expect(backward).not.toBeNull();
    expect(forward?.id).toBe(backward?.id);
    expect(forward?.id).toBe('c01');
  });

  it('applies specificity correctly (id+id beats id+tag beats tag+tag)', () => {
    // retinol + benzoyl-peroxide has specific rule c01 (id+id)
    const c01 = findRuleForIngredientPair('retinol', 'benzoyl-peroxide', data);
    expect(c01?.id).toBe('c01');

    // adapalene + benzoyl-peroxide has specific rule c03 (id+id)
    const c03 = findRuleForIngredientPair('adapalene', 'benzoyl-peroxide', data);
    expect(c03?.id).toBe('c03');

    // tretinoin + benzoyl-peroxide has specific rule c02 (id+id)
    const c02 = findRuleForIngredientPair('tretinoin', 'benzoyl-peroxide', data);
    expect(c02?.id).toBe('c02');

    // generic retinoid + aha matches c04 (tag+tag)
    const c04 = findRuleForIngredientPair('retinol', 'glycolic-acid', data);
    expect(c04?.id).toBe('c04');
  });

  it('fires distinct ingredient rules for tags (a === b fires only for distinct ingredients)', () => {
    // Two distinct retinoids (retinol and adapalene) fire c06 (retinoid + retinoid)
    const c06 = findRuleForIngredientPair('retinol', 'adapalene', data);
    expect(c06?.id).toBe('c06');
    expect(c06?.kind).toBe('duplicate-active');

    // Same ingredient pair (retinol with retinol) returns null
    const self = findRuleForIngredientPair('retinol', 'retinol', data);
    expect(self).toBeNull();

    // Two distinct AHAs (glycolic-acid and lactic-acid) fire c08
    const c08 = findRuleForIngredientPair('glycolic-acid', 'lactic-acid', data);
    expect(c08?.id).toBe('c08');

    // AHA + BHA (glycolic-acid and salicylic-acid) fires c07
    const c07 = findRuleForIngredientPair('glycolic-acid', 'salicylic-acid', data);
    expect(c07?.id).toBe('c07');

    // BPO + Exfoliant fires c09
    const c09 = findRuleForIngredientPair('benzoyl-peroxide', 'salicylic-acid', data);
    expect(c09?.id).toBe('c09');

    // Sulfur + Retinoid fires c10
    const c10 = findRuleForIngredientPair('sulfur', 'retinol', data);
    expect(c10?.id).toBe('c10');
  });

  it('reviewedNoRule pairs deliberately produce no warning', () => {
    // Niacinamide + Vitamin C
    expect(findRuleForIngredientPair('niacinamide', 'vitamin-c', data)).toBeNull();
    expect(findRuleForIngredientPair('vitamin-c', 'niacinamide', data)).toBeNull();

    // Vitamin C + Retinoid
    expect(findRuleForIngredientPair('vitamin-c', 'retinol', data)).toBeNull();
    expect(findRuleForIngredientPair('retinol', 'vitamin-c', data)).toBeNull();

    // Vitamin C + AHA (glycolic acid)
    expect(findRuleForIngredientPair('vitamin-c', 'glycolic-acid', data)).toBeNull();

    // Vitamin C + Benzoyl Peroxide
    expect(findRuleForIngredientPair('vitamin-c', 'benzoyl-peroxide', data)).toBeNull();
  });

  it('suppresses warnings when clinician directs products together', () => {
    const prodRetinol: Product = {
      id: 'p-retinol',
      name: 'Retinol Serum',
      type: 'serum',
      ingredients: ['retinol'],
      productForm: 'leave-on',
      openedOn: '2026-10-01',
      monthsValid: 6,
      bottle: 'dropper',
      color: '#C496A1',
      isCombinationProduct: false,
      directions: {
        source: 'clinician',
        directedTogetherWith: ['p-bpo'],
      },
    };

    const prodBPO: Product = {
      id: 'p-bpo',
      name: 'BPO Gel',
      type: 'treatment',
      ingredients: ['benzoyl-peroxide'],
      productForm: 'leave-on',
      openedOn: '2026-10-01',
      monthsValid: 6,
      bottle: 'tube',
      color: '#919D85',
      isCombinationProduct: false,
    };

    const conflicts = matchProductConflicts([prodRetinol, prodBPO], data);
    // Should be suppressed because c01 has clinician-directed-together in excludeWhen
    expect(conflicts.filter((c) => c.ruleId === 'c01')).toHaveLength(0);
  });

  it('suppresses warnings for ingredients within a combination product', () => {
    const comboProduct: Product = {
      id: 'p-combo',
      name: 'Multi-Active Formula',
      type: 'treatment',
      ingredients: ['glycolic-acid', 'lactic-acid'], // Two AHAs (rule c08 has combination-product in excludeWhen)
      productForm: 'leave-on',
      openedOn: '2026-10-01',
      monthsValid: 6,
      bottle: 'pump',
      color: '#C496A1',
      isCombinationProduct: true,
    };

    const conflicts = matchProductConflicts([comboProduct], data);
    expect(conflicts.filter((c) => c.ruleId === 'c08')).toHaveLength(0);
  });
});


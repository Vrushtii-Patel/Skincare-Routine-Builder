import { describe, it, expect } from 'vitest';
import { validateReferenceData } from '../validateData';
import { loadReferenceData } from '../loadData';
import { ReferenceData } from '../../types';

describe('Data Validation Suite (validateData)', () => {
  it('passes on the real reference data files', () => {
    const data = loadReferenceData();
    const errors = validateReferenceData(data);
    expect(errors).toHaveLength(0);
  });

  const getBaseData = (): ReferenceData => {
    const original = loadReferenceData();
    return JSON.parse(JSON.stringify(original));
  };

  it('detects duplicate ingredient ids', () => {
    const data = getBaseData();
    data.ingredients.push({ ...data.ingredients[0] });
    const errors = validateReferenceData(data);
    expect(errors.some((e) => e.includes('duplicate ingredient ids'))).toBe(true);
  });

  it('detects collision between ingredient ids and tags', () => {
    const data = getBaseData();
    data.tags['retinol'] = 'Colliding tag with retinol id';
    const errors = validateReferenceData(data);
    expect(errors.some((e) => e.includes('ids collide with tags'))).toBe(true);
  });

  it('detects unknown tag on an ingredient', () => {
    const data = getBaseData();
    data.ingredients[0].tags.push('non-existent-tag');
    const errors = validateReferenceData(data);
    expect(errors.some((e) => e.includes('unknown tag non-existent-tag'))).toBe(true);
  });

  it('detects missing pregnancyAdvisory on retinoid', () => {
    const data = getBaseData();
    const retinol = data.ingredients.find((i) => i.id === 'retinol')!;
    retinol.pregnancyAdvisory = false;
    const errors = validateReferenceData(data);
    expect(errors.some((e) => e.includes('retinoid missing pregnancyAdvisory'))).toBe(true);
  });

  it('detects rx-only product not marked user-directed', () => {
    const data = getBaseData();
    const tret = data.ingredients.find((i) => i.id === 'tretinoin')!;
    tret.schedulingMode = 'scheduled';
    const errors = validateReferenceData(data);
    expect(errors.some((e) => e.includes('rx-only must be user-directed'))).toBe(true);
  });

  it('detects hard enforcement rules (forbidden in v1 dataset)', () => {
    const data = getBaseData();
    data.rules[0].enforcement = 'hard' as any;
    const errors = validateReferenceData(data);
    expect(errors.some((e) => e.includes('hard rules not allowed in this dataset'))).toBe(true);
  });

  it('detects duplicate symmetric rule pairs', () => {
    const data = getBaseData();
    data.rules.push({
      ...data.rules[0],
      id: 'c99',
      a: data.rules[0].b,
      b: data.rules[0].a,
    });
    const errors = validateReferenceData(data);
    expect(errors.some((e) => e.includes('duplicate (symmetric) pair'))).toBe(true);
  });

  it('detects empty text fields in rules', () => {
    const data = getBaseData();
    data.rules[0].title = '   ';
    const errors = validateReferenceData(data);
    expect(errors.some((e) => e.includes('empty rule text field title'))).toBe(true);
  });

  it('detects missing frequency entry for scheduled ingredient', () => {
    const data = getBaseData();
    delete data.frequencies['retinol'];
    const errors = validateReferenceData(data);
    expect(errors.some((e) => e.includes('retinol: scheduled/user-directed but no frequency entry'))).toBe(true);
  });

  it('detects every-routine ingredient with a frequency entry', () => {
    const data = getBaseData();
    data.frequencies['hyaluronic-acid'] = {
      mode: 'every-routine',
      time: 'any',
      basis: 'invalid',
    };
    const errors = validateReferenceData(data);
    expect(errors.some((e) => e.includes('hyaluronic-acid: every-routine must not have frequency entry'))).toBe(true);
  });

  it('detects frequency nights ordering violation (sens <= normal <= maxUser <= 7)', () => {
    const data = getBaseData();
    data.frequencies['retinol'].sensitiveNights = 5;
    data.frequencies['retinol'].normalNights = 3; // 5 > 3 violation
    const errors = validateReferenceData(data);
    expect(errors.some((e) => e.includes('nights not ordered 1<=sens<=normal<=max<=7'))).toBe(true);
  });

  it('detects unknown source id on ingredient', () => {
    const data = getBaseData();
    data.ingredients[0].sourceIds.push('s-fake-unknown-source');
    const errors = validateReferenceData(data);
    expect(errors.some((e) => e.includes('unknown source s-fake-unknown-source'))).toBe(true);
  });
});

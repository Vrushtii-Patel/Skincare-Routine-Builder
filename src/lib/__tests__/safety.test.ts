import { describe, it, expect } from 'vitest';
import { loadReferenceData } from '../loadData';

describe('Safety Wording and Evidence Integrity', () => {
  const data = loadReferenceData();

  it('rules with evidence "insufficient" are explicitly described as conservative planning notes', () => {
    const insufficientRules = data.rules.filter((r) => r.evidence === 'insufficient');
    expect(insufficientRules.length).toBeGreaterThan(0);

    for (const rule of insufficientRules) {
      expect(
        rule.explanation.toLowerCase().includes('conservative')
      ).toBe(true);
      // Insufficient rules must not list source IDs
      expect(rule.sourceIds).toHaveLength(0);
    }
  });

  it('no rule in dataset claims two ingredients are "safe to use"', () => {
    for (const rule of data.rules) {
      expect(rule.explanation.toLowerCase()).not.toContain('safe to use');
      expect(rule.tip.toLowerCase()).not.toContain('safe to use');
      expect(rule.title.toLowerCase()).not.toContain('safe to use');
    }
  });

  it('no rule claims to cure skin conditions', () => {
    for (const rule of data.rules) {
      expect(rule.explanation.toLowerCase()).not.toContain('cure');
      expect(rule.tip.toLowerCase()).not.toContain('cure');
    }
  });

  it('every retinoid has pregnancyAdvisory set to true', () => {
    const retinoids = data.ingredients.filter((i) => i.tags.includes('retinoid'));
    expect(retinoids.length).toBeGreaterThan(0);
    for (const r of retinoids) {
      expect(r.pregnancyAdvisory).toBe(true);
    }
  });

  it('non-retinoids do not have pregnancyAdvisory set to true', () => {
    const nonRetinoids = data.ingredients.filter((i) => !i.tags.includes('retinoid'));
    for (const nr of nonRetinoids) {
      expect(nr.pregnancyAdvisory).toBe(false);
    }
  });
});


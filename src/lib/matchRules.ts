/**
 * Conflict Matching Engine
 * Pure TypeScript implementation of skincare ingredient compatibility rules.
 * Reference: MASTER_CONTEXT.md section C and conflicts.json semantics.
 */

import {
  Product,
  ConflictRule,
  ReferenceData,
  ConflictSeverity,
  MatchedConflict,
  Ingredient,
} from '../types';

const SEVERITY_RANK: Record<ConflictSeverity, number> = {
  caution: 3,
  notice: 2,
  info: 1,
};

/**
 * Calculates specificity score:
 * 2 = id + id
 * 1 = id + tag (or tag + id)
 * 0 = tag + tag
 */
function getSpecificity(rule: ConflictRule, ingredientMap: Map<string, Ingredient>): number {
  const isAId = ingredientMap.has(rule.a);
  const isBId = ingredientMap.has(rule.b);
  if (isAId && isBId) return 2;
  if (isAId || isBId) return 1;
  return 0;
}

/**
 * Tests if an ingredient matches an endpoint `x` (which may be an ingredient id or tag).
 */
function ingredientMatches(x: string, ingredient: Ingredient): boolean {
  return x === ingredient.id || ingredient.tags.includes(x);
}

/**
 * Finds the most specific applicable rule for a pair of distinct ingredient ids.
 */
export function findRuleForIngredientPair(
  ingAId: string,
  ingBId: string,
  data: ReferenceData
): ConflictRule | null {
  if (ingAId === ingBId) {
    return null; // A distinct pair is required
  }

  const ingredientMap = new Map(data.ingredients.map((i) => [i.id, i]));
  const ingA = ingredientMap.get(ingAId);
  const ingB = ingredientMap.get(ingBId);

  if (!ingA || !ingB) {
    return null;
  }

  // Check reviewedNoRule first
  for (const nr of data.reviewedNoRule) {
    const matchesForward = ingredientMatches(nr.a, ingA) && ingredientMatches(nr.b, ingB);
    const matchesBackward = ingredientMatches(nr.a, ingB) && ingredientMatches(nr.b, ingA);
    if (matchesForward || matchesBackward) {
      return null; // Deliberately suppressed with no warning
    }
  }

  // Find all matching rules
  const matchingRules: ConflictRule[] = [];

  for (const rule of data.rules) {
    // When a === b (a tag), fires only for two distinct ingredients that both have that tag
    if (rule.a === rule.b) {
      if (ingA.tags.includes(rule.a) && ingB.tags.includes(rule.a)) {
        matchingRules.push(rule);
      }
    } else {
      const forward = ingredientMatches(rule.a, ingA) && ingredientMatches(rule.b, ingB);
      const backward = ingredientMatches(rule.a, ingB) && ingredientMatches(rule.b, ingA);
      if (forward || backward) {
        matchingRules.push(rule);
      }
    }
  }

  if (matchingRules.length === 0) {
    return null;
  }

  // Sort by:
  // 1. Specificity desc (id+id > id+tag > tag+tag)
  // 2. Severity desc (caution > notice > info)
  // 3. Rule ID asc (c01 < c02)
  matchingRules.sort((r1, r2) => {
    const spec1 = getSpecificity(r1, ingredientMap);
    const spec2 = getSpecificity(r2, ingredientMap);
    if (spec1 !== spec2) return spec2 - spec1;

    const sev1 = SEVERITY_RANK[r1.severity] ?? 0;
    const sev2 = SEVERITY_RANK[r2.severity] ?? 0;
    if (sev1 !== sev2) return sev2 - sev1;

    return r1.id.localeCompare(r2.id);
  });

  return matchingRules[0];
}

/**
 * Evaluates conflict rules across a list of user products.
 * Handles single-product combinations and pairwise product interactions.
 */
export function matchProductConflicts(
  products: Product[],
  data: ReferenceData
): MatchedConflict[] {
  const activeProducts = products.filter((p) => !p.isArchived);
  const matchedConflicts: MatchedConflict[] = [];
  const seenPairKeys = new Set<string>();

  // Compare each pair of products
  for (let i = 0; i < activeProducts.length; i++) {
    for (let j = i + 1; j < activeProducts.length; j++) {
      const prodA = activeProducts[i];
      const prodB = activeProducts[j];

      // Check clinician-directed together suppression
      const aDirectsB = prodA.directions?.directedTogetherWith?.includes(prodB.id);
      const bDirectsA = prodB.directions?.directedTogetherWith?.includes(prodA.id);
      const isClinicianDirectedTogether =
        (prodA.directions?.source === 'clinician' && aDirectsB) ||
        (prodB.directions?.source === 'clinician' && bDirectsA);

      for (const ingAId of prodA.ingredients) {
        for (const ingBId of prodB.ingredients) {
          if (ingAId === ingBId) continue; // Same ingredient in both products handled separately if needed

          const rule = findRuleForIngredientPair(ingAId, ingBId, data);
          if (!rule) continue;

          // Check suppressions
          if (
            isClinicianDirectedTogether &&
            rule.excludeWhen.includes('clinician-directed-together')
          ) {
            continue;
          }

          // Deduplicate key by ruleId and sorted product IDs and sorted ingredients
          const sortedProds = [prodA.id, prodB.id].sort().join(':');
          const sortedIngs = [ingAId, ingBId].sort().join(':');
          const dedupKey = `${rule.id}__${sortedProds}__${sortedIngs}`;

          if (seenPairKeys.has(dedupKey)) continue;
          seenPairKeys.add(dedupKey);

          matchedConflicts.push({
            ruleId: rule.id,
            aIngredientId: ingAId,
            bIngredientId: ingBId,
            productAId: prodA.id,
            productBId: prodB.id,
            kind: rule.kind,
            severity: rule.severity,
            enforcement: rule.enforcement,
            resolutionOrder: rule.resolutionOrder,
            evidence: rule.evidence,
            title: rule.title,
            explanation: rule.explanation,
            tip: rule.tip,
            sourceIds: rule.sourceIds,
          });
        }
      }
    }
  }

  // Also check intra-product conflicts for non-combination products (if user added conflicting actives to one custom product)
  for (const prod of activeProducts) {
    if (prod.isCombinationProduct) continue; // Combination products are formulated together

    for (let i = 0; i < prod.ingredients.length; i++) {
      for (let j = i + 1; j < prod.ingredients.length; j++) {
        const ingAId = prod.ingredients[i];
        const ingBId = prod.ingredients[j];
        if (ingAId === ingBId) continue;

        const rule = findRuleForIngredientPair(ingAId, ingBId, data);
        if (!rule) continue;
        if (rule.excludeWhen.includes('combination-product')) continue;

        const dedupKey = `${rule.id}__${prod.id}:${prod.id}__${[ingAId, ingBId].sort().join(':')}`;
        if (seenPairKeys.has(dedupKey)) continue;
        seenPairKeys.add(dedupKey);

        matchedConflicts.push({
          ruleId: rule.id,
          aIngredientId: ingAId,
          bIngredientId: ingBId,
          productAId: prod.id,
          productBId: prod.id,
          kind: rule.kind,
          severity: rule.severity,
          enforcement: rule.enforcement,
          resolutionOrder: rule.resolutionOrder,
          evidence: rule.evidence,
          title: rule.title,
          explanation: rule.explanation,
          tip: rule.tip,
          sourceIds: rule.sourceIds,
        });
      }
    }
  }

  return matchedConflicts;
}


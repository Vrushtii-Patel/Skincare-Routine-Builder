/**
 * Skincare Data Validator
 * Pure TypeScript port reproducing every consistency check in validate.py.
 */

import { ReferenceData } from '../types';

export class DataValidationError extends Error {
  public errors: string[];

  constructor(errors: string[]) {
    super(`Data validation failed with ${errors.length} error(s):\n - ${errors.join('\n - ')}`);
    this.name = 'DataValidationError';
    this.errors = errors;
  }
}

const VALID_CATEGORIES = new Set([
  'retinoid',
  'retinol-alternative',
  'exfoliating-acid',
  'antibacterial',
  'other-active',
  'antioxidant',
  'hydrator',
  'soothing',
  'sunscreen',
]);

const VALID_IRRITATION = new Set(['none', 'low', 'moderate', 'high']);
const VALID_AVAILABILITY = new Set(['otc', 'rx', 'both']);
const VALID_MODES = new Set(['scheduled', 'every-routine', 'user-directed']);
const VALID_TIMES = new Set(['AM', 'PM', 'any']);
const VALID_KINDS = new Set(['irritation', 'efficacy-timing', 'duplicate-active']);
const VALID_SEVERITIES = new Set(['info', 'notice', 'caution']);
const VALID_ENFORCEMENT = new Set(['none', 'soft', 'hard']);
const VALID_EVIDENCE = new Set(['established', 'partial', 'limited', 'insufficient']);
const VALID_EXCLUDE_WHEN = new Set(['combination-product', 'clinician-directed-together']);
const VALID_RESOLUTION = new Set(['time-of-day', 'night']);

export function validateReferenceData(data: ReferenceData): string[] {
  const errors: string[] = [];
  const err = (msg: string) => errors.push(msg);

  const { ingredients, tags: tagsMap, rules, reviewedNoRule, frequencies, scheduling, sources } = data;

  const tagList = Object.keys(tagsMap);
  const tagSet = new Set(tagList);

  // 1. Ingredients ID uniqueness & collisions
  const ingIds = ingredients.map((i) => i.id);
  const uniqueIngIds = new Set(ingIds);
  if (ingIds.length !== uniqueIngIds.size) {
    err('duplicate ingredient ids');
  }

  for (const id of ingIds) {
    if (tagSet.has(id)) {
      err(`ids collide with tags: ${id}`);
    }
  }

  const byId = new Map(ingredients.map((i) => [i.id, i]));

  // 2. Sources validation
  const srcIds = sources.map((s) => s.id);
  const uniqueSrcIds = new Set(srcIds);
  if (srcIds.length !== uniqueSrcIds.size) {
    err('duplicate source ids');
  }

  for (const s of sources) {
    if (!s.title || !s.organization || !s.supports) {
      err(`${s.id || 'unknown'}: source missing title/organization/supports`);
    }
    try {
      const u = new URL(s.url);
      if (u.protocol !== 'https:' || !u.hostname) {
        err(`${s.id}: source URL must be an absolute HTTPS URL`);
      }
    } catch {
      err(`${s.id}: source URL must be an absolute HTTPS URL`);
    }
  }

  // 3. Ingredients field and relation checks
  const usedTags = new Set<string>();

  for (const i of ingredients) {
    const k = i.id;
    if (!VALID_CATEGORIES.has(i.category)) err(`${k}: bad category`);
    if (!VALID_IRRITATION.has(i.irritationPotential)) err(`${k}: bad irritationPotential`);
    if (!VALID_AVAILABILITY.has(i.availability)) err(`${k}: bad availability`);
    if (!VALID_MODES.has(i.schedulingMode)) err(`${k}: bad schedulingMode`);
    if (!VALID_TIMES.has(i.preferredTime)) err(`${k}: bad preferredTime`);

    for (const t of i.tags) {
      usedTags.add(t);
      if (!tagSet.has(t)) err(`${k}: unknown tag ${t}`);
    }

    for (const s of i.sourceIds) {
      if (!uniqueSrcIds.has(s)) err(`${k}: unknown source ${s}`);
    }

    const hasRetinoidTag = i.tags.includes('retinoid');
    if (i.pregnancyAdvisory && !hasRetinoidTag) {
      err(`${k}: pregnancyAdvisory on non-retinoid`);
    }
    if (hasRetinoidTag && !i.pregnancyAdvisory) {
      err(`${k}: retinoid missing pregnancyAdvisory`);
    }
    if (i.availability === 'rx' && i.schedulingMode !== 'user-directed') {
      err(`${k}: rx-only must be user-directed`);
    }
  }

  for (const t of tagSet) {
    if (!usedTags.has(t)) {
      err(`unused tag ${t}`);
    }
  }

  const resolves = (x: string) => byId.has(x) || tagSet.has(x);
  const expand = (x: string): string[] => {
    if (byId.has(x)) return [x];
    if (tagSet.has(x)) {
      return ingredients.filter((i) => i.tags.includes(x)).map((i) => i.id);
    }
    return [];
  };

  // 4. Conflict rules validation
  const seenPairs = new Set<string>();
  const ruleIds: string[] = [];

  for (const r of rules) {
    ruleIds.push(r.id);

    if (!r.title || !r.title.trim()) err(`${r.id}: empty rule text field title`);
    if (!r.explanation || !r.explanation.trim()) err(`${r.id}: empty rule text field explanation`);
    if (!r.tip || !r.tip.trim()) err(`${r.id}: empty rule text field tip`);

    if (!resolves(r.a) || !resolves(r.b)) err(`${r.id}: unresolved a/b`);
    if (!VALID_KINDS.has(r.kind)) err(`${r.id}: bad kind`);
    if (!VALID_SEVERITIES.has(r.severity)) err(`${r.id}: bad severity`);
    if (!VALID_ENFORCEMENT.has(r.enforcement)) err(`${r.id}: bad enforcement`);
    if (r.enforcement === 'hard') err(`${r.id}: hard rules not allowed in this dataset`);
    if (!VALID_EVIDENCE.has(r.evidence)) err(`${r.id}: bad evidence`);

    for (const ex of r.excludeWhen) {
      if (!VALID_EXCLUDE_WHEN.has(ex)) err(`${r.id}: bad excludeWhen ${ex}`);
    }

    for (const ro of r.resolutionOrder) {
      if (!VALID_RESOLUTION.has(ro)) err(`${r.id}: bad resolutionOrder ${ro}`);
    }

    if (r.enforcement === 'soft' && (!r.resolutionOrder || r.resolutionOrder.length === 0)) {
      err(`${r.id}: soft rule needs resolutionOrder`);
    }
    if (r.enforcement === 'none' && r.severity !== 'info') {
      err(`${r.id}: enforcement none should be info`);
    }
    if (r.severity === 'info' && r.enforcement !== 'none') {
      err(`${r.id}: info must be enforcement none`);
    }
    if (r.evidence === 'insufficient' && r.sourceIds && r.sourceIds.length > 0) {
      err(`${r.id}: insufficient evidence but sources listed`);
    }
    if (r.evidence !== 'insufficient' && (!r.sourceIds || r.sourceIds.length === 0)) {
      err(`${r.id}: sourced evidence but no sources`);
    }
    if (r.evidence === 'insufficient' && !r.explanation.includes('conservative')) {
      err(`${r.id}: insufficient rule must say it is conservative`);
    }

    for (const s of r.sourceIds) {
      if (!uniqueSrcIds.has(s)) err(`${r.id}: unknown source ${s}`);
    }

    const pairKey = [r.a, r.b].sort().join('::');
    if (seenPairs.has(pairKey)) {
      err(`${r.id}: duplicate (symmetric) pair`);
    }
    seenPairs.add(pairKey);

    if (expand(r.a).length === 0 || expand(r.b).length === 0) {
      err(`${r.id}: matches no ingredients`);
    }
  }

  const uniqueRuleIds = new Set(ruleIds);
  if (ruleIds.length !== uniqueRuleIds.size) {
    err('duplicate rule ids');
  }

  // 5. Reviewed no-rule pairs
  const seenNoRule = new Set<string>();
  for (const n of reviewedNoRule) {
    const pairKey = [n.a, n.b].sort().join('::');
    if (seenNoRule.has(pairKey)) {
      err(`duplicate reviewedNoRule pair ${n.a}/${n.b}`);
    }
    seenNoRule.add(pairKey);

    if (!n.decision || !n.reason) {
      err(`reviewedNoRule ${n.a}/${n.b}: missing decision/reason`);
    }
    if (!resolves(n.a) || !resolves(n.b)) {
      err(`noRule ${n.a}/${n.b} unresolved`);
    }
    if (seenPairs.has(pairKey)) {
      err(`noRule ${n.a}/${n.b} also has a rule`);
    }
    for (const s of n.sourceIds) {
      if (!uniqueSrcIds.has(s)) {
        err(`noRule unknown source ${s}`);
      }
    }
  }

  // 6. Frequencies check
  for (const [k, f] of Object.entries(frequencies)) {
    if (!byId.has(k)) {
      err(`freq ${k}: unknown ingredient`);
      continue;
    }
    const ingItem = byId.get(k)!;
    if (f.mode !== ingItem.schedulingMode) err(`freq ${k}: mode mismatch`);
    if (f.time !== ingItem.preferredTime) err(`freq ${k}: time mismatch`);

    if (f.mode === 'scheduled') {
      const sens = f.sensitiveNights ?? 0;
      const norm = f.normalNights ?? 0;
      const maxN = f.maxUserNights ?? 0;
      if (!(1 <= sens && sens <= norm && norm <= maxN && maxN <= 7)) {
        err(`freq ${k}: nights not ordered 1<=sens<=normal<=max<=7`);
      }
    } else {
      if (!f.requiresDirections) err(`freq ${k}: user-directed needs requiresDirections`);
    }
  }

  for (const i of ingredients) {
    if ((i.schedulingMode === 'scheduled' || i.schedulingMode === 'user-directed') && !frequencies[i.id]) {
      err(`${i.id}: scheduled/user-directed but no frequency entry`);
    }
    if (i.schedulingMode === 'every-routine' && frequencies[i.id]) {
      err(`${i.id}: every-routine must not have frequency entry`);
    }
  }

  // 7. Scheduling config checks
  for (const t of scheduling.noConsecutiveNightsForTags) {
    if (!tagSet.has(t)) err(`unknown tag in scheduling: ${t}`);
  }

  for (const [key, val] of Object.entries(scheduling.penaltyWeights)) {
    if (typeof val !== 'number' || val <= 0 || !Number.isInteger(val)) {
      err(`penalty weight for ${key} must be a positive integer`);
    }
  }

  return errors;
}


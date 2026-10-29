/**
 * Skincare Routine Builder — Domain Types
 * Strict typing adhering to MASTER_CONTEXT.md and data specifications.
 */

export type IrritationPotential = 'none' | 'low' | 'moderate' | 'high';
export type Availability = 'otc' | 'rx' | 'both';
export type SchedulingMode = 'scheduled' | 'every-routine' | 'user-directed';
export type PreferredTime = 'AM' | 'PM' | 'any';

export type IngredientCategory =
  | 'retinoid'
  | 'retinol-alternative'
  | 'exfoliating-acid'
  | 'antibacterial'
  | 'other-active'
  | 'antioxidant'
  | 'hydrator'
  | 'soothing'
  | 'sunscreen';

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  tags: string[];
  irritationPotential: IrritationPotential;
  availability: Availability;
  schedulingMode: SchedulingMode;
  preferredTime: PreferredTime;
  pregnancyAdvisory: boolean;
  notes: string;
  sourceIds: string[];
}

export type ConflictKind = 'irritation' | 'efficacy-timing' | 'duplicate-active';
export type ConflictSeverity = 'info' | 'notice' | 'caution';
export type ConflictEnforcement = 'none' | 'soft' | 'hard';
export type ConflictEvidence = 'established' | 'partial' | 'limited' | 'insufficient';
export type ResolutionTactic = 'time-of-day' | 'night';
export type ExcludeWhenCondition = 'combination-product' | 'clinician-directed-together';

export interface ConflictRule {
  id: string;
  a: string;
  b: string;
  kind: ConflictKind;
  severity: ConflictSeverity;
  enforcement: ConflictEnforcement;
  resolutionOrder: ResolutionTactic[];
  excludeWhen: ExcludeWhenCondition[];
  evidence: ConflictEvidence;
  title: string;
  explanation: string;
  tip: string;
  sourceIds: string[];
}

export interface ReviewedNoRule {
  a: string;
  b: string;
  decision: string;
  reason: string;
  sourceIds: string[];
}

export interface IngredientFrequency {
  mode: SchedulingMode;
  time: PreferredTime;
  normalNights?: number;
  sensitiveNights?: number;
  maxUserNights?: number;
  requiresDirections?: boolean;
  basis: string;
}

export interface PenaltyWeights {
  notice: number;
  caution: number;
  consecutiveRetinoid: number;
  restNightShortfall: number;
  overMaxActives: number;
}

export interface GlobalSchedulingConfig {
  weekStartsOn: 'monday';
  restNightsMin: number;
  maxScheduledActivesPerNight: number;
  noConsecutiveNightsForTags: string[];
  penaltyWeights: PenaltyWeights;
  allSchedulingPreferencesAre: 'soft';
}

export type SourceTier = 'authoritative' | 'institutional' | 'secondary';

export interface Source {
  id: string;
  title: string;
  organization: string;
  url: string;
  tier: SourceTier;
  supports: string;
}

export interface ReferenceData {
  ingredients: Ingredient[];
  tags: Record<string, string>;
  rules: ConflictRule[];
  reviewedNoRule: ReviewedNoRule[];
  frequencies: Record<string, IngredientFrequency>;
  scheduling: GlobalSchedulingConfig;
  sources: Source[];
}

export type ProductType =
  | 'cleanser'
  | 'toner'
  | 'serum'
  | 'treatment'
  | 'moisturizer'
  | 'sunscreen'
  | 'exfoliant';

export type ProductForm = 'leave-on' | 'rinse-off';
export type BottleShape = 'dropper' | 'tube' | 'jar' | 'pump';
export type Day = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type DirectionSource = 'default' | 'label' | 'clinician';

export interface ProductDirections {
  source: DirectionSource;
  nightsPerWeek?: number;
  fixedDays?: Day[];
  time?: 'AM' | 'PM';
  directedTogetherWith?: string[];
}

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  ingredients: string[];
  productForm: ProductForm;
  openedOn: string; // YYYY-MM-DD
  monthsValid: number; // PAO
  bottle: BottleShape;
  color: string;
  isCombinationProduct: boolean;
  directions?: ProductDirections;
  notes?: string;
  isArchived?: boolean;
}

export type SkinType = 'normal' | 'dry' | 'oily' | 'combination';
export type SkinConcern =
  | 'acne'
  | 'aging'
  | 'hyperpigmentation'
  | 'texture'
  | 'redness'
  | 'barrier'
  | 'dullness'
  | 'dryness';

export interface Profile {
  skinType: SkinType;
  concerns: SkinConcern[];
  sensitive: boolean;
  excludedIngredients: string[];
  experienceLevel?: 'beginner' | 'intermediate' | 'experienced';
  pregnancyOrNursing?: boolean;
  isOnboarded: boolean;
}

export interface CheckInRecord {
  am: boolean;
  pm: boolean;
  skinFeel?: 'great' | 'good' | 'neutral' | 'tight' | 'irritated';
  concernsNoticed?: SkinConcern[];
  notes?: string;
  updatedAt?: string;
}

export interface PlanWarning {
  code: string;
  severity: ConflictSeverity;
  ruleId?: string;
  productIds: string[];
  message: string;
  explanation?: string;
  tip?: string;
}

export interface PlanDecision {
  code: string;
  productId: string;
  reason: string;
  resolutionOptions: string[];
}

export interface WeekPlan {
  status: 'ok' | 'ok-with-warnings' | 'needs-decision';
  grid: Record<'AM' | 'PM', Record<Day, string[]>>;
  everyRoutine: Record<'AM' | 'PM', string[]>;
  warnings: PlanWarning[];
  decisions: PlanDecision[];
  explanations: string[];
}

export interface MatchedConflict {
  ruleId: string;
  aIngredientId: string;
  bIngredientId: string;
  productAId: string;
  productBId: string;
  kind: ConflictKind;
  severity: ConflictSeverity;
  enforcement: ConflictEnforcement;
  resolutionOrder: ResolutionTactic[];
  evidence: ConflictEvidence;
  title: string;
  explanation: string;
  tip: string;
  sourceIds: string[];
}

export interface RoutineSlotItem {
  slot: 'cleanser' | 'toner' | 'serum' | 'treatment' | 'moisturizer' | 'sunscreen';
  product?: Product;
  isOptional: boolean;
  isGap: boolean;
  guidance?: string;
}


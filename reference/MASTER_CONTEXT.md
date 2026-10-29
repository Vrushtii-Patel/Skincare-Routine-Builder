# MASTER CONTEXT: Skincare Routine Builder

Primary reference for every implementation phase. **If anything in a prompt or in your own judgement conflicts with this file or with the JSON data files, the files win.** Never invent conflict rules, frequencies, ingredient facts or sources. If something is missing, stop and report it.

Data files (source of truth, in `src/data/`): `ingredients.json`, `conflicts.json`, `frequencies.json`, `sources.json`. Run `validate.py` (or its TypeScript port) after any change to them.

---

## A. Project overview

**Purpose.** A personal skincare organiser. The user tells the app which products they own and which ingredients are in them; the app builds an AM/PM routine from those real products, flags irritation-risk and timing issues, and generates an explainable weekly schedule for the stronger actives.

**Target users.** Adults managing an OTC skincare shelf (students, beginners). Not patients under treatment, though some use prescribed retinoids or benzoyl peroxide; the app must respect those directions.

**Problem solved.** People layer actives without knowing which can irritate together, forget product expiry, and have no weekly plan.

**Version 1 scope.** Google login; skin-profile quiz; product shelf with ingredient picker and expiry badges; routine with slots filled from the shelf (and gap cards); conflict notices; deterministic weekly plan; daily AM/PM check-in with streak; sunscreen and patch-test guidance; safety notices; export of data as JSON.

**Out of version 1.** Diagnosis of any skin condition; dosage or concentration advice; product recommendations or shopping links; ingredient parsing from photos or barcodes; multi-user sharing; push notifications; clinician features; pregnancy status collection.

**Positioning (user-facing and README).** A planning tool for general skincare organisation, not medical advice.

## B. Technical architecture

Already decided; do not change without asking.

| Layer | Choice |
|---|---|
| Framework | React + Vite + TypeScript |
| Styling | Tailwind CSS (soft pastel theme, rounded cards) |
| State | Zustand (in-app copy of user data) |
| Auth + DB | Firebase Auth (Google sign-in only) + Firestore |
| Dates | date-fns |
| Tests | Vitest |
| Hosting | Vercel |
| Backend | None. No custom server. |

**Separation of concerns (strict).**
- `src/data/`: static JSON, identical for all users.
- `src/lib/`: pure TypeScript logic. No React, no Firebase, no `Date.now()` (take `today` as a parameter), no randomness.
- `src/services/`: the only code that imports Firebase.
- `src/store/`: Zustand store; connects services to UI.
- `src/hooks/`: derive values by calling `lib/` with store data.
- `src/pages/` and `src/components/`: presentation only. No scheduling or conflict logic in components.

**Folder structure.**

```
src/
  data/        ingredients.json conflicts.json frequencies.json sources.json
  types/       index.ts
  lib/         loadData.ts validateData.ts matchRules.ts generateRoutine.ts
               matchProducts.ts buildWeeklyPlan.ts expiry.ts streak.ts
               __tests__/
  services/    firebase.ts auth.ts db.ts
  store/       useStore.ts
  hooks/       useAuth.ts useConflicts.ts useWeeklyPlan.ts
  pages/       Welcome Quiz Today Week Routine Shelf Settings
  components/  auth/ layout/ quiz/ shelf/ routine/ week/ today/ ui/ safety/
```

**Data loading and validation.** `loadData.ts` imports the JSON and runs `validateData.ts` once at startup (and in tests). Validation must reproduce every check in `validate.py`: unique ids, valid enums, tags and ingredient references resolve, source ids exist, no symmetric duplicate rules, no `hard` rules, scheduled/user-directed ingredients have frequency entries, `every-routine` ingredients have none, nights satisfy `1 <= sensitive <= normal <= maxUser <= 7`. On failure throw a descriptive error; the app must refuse to schedule with invalid data.

## C. Data architecture

### Ingredient (`ingredients.json`)
`id`, `name`, `category`, `tags[]`, `irritationPotential` (`none|low|moderate|high`, approximate, tie-break only), `availability` (`otc|rx|both`), `schedulingMode` (`scheduled|every-routine|user-directed`), `preferredTime` (`AM|PM|any`, soft), `pregnancyAdvisory` (bool, true only for retinoids; false means "no advisory shipped", not "safe"), `notes`, `sourceIds[]`.

`schedulingMode` meaning: **scheduled** = scheduler assigns nights; **every-routine** = appears in its slot by default, never required daily, product directions may reduce it, no minimum enforced; **user-directed** = never auto-assigned, needs user/clinician-entered directions.

The old `strength` field and `schedulable` boolean were removed (see rationale in the report): strength was replaced by approximate `irritationPotential`; the boolean could not express "optional but not daily" or "prescriber-directed".

### Conflict rule (`conflicts.json`)
`id`, `a`, `b` (ingredient id or tag; symmetric), `kind` (`irritation|efficacy-timing|duplicate-active`), `severity` (`info|notice|caution`, a display level only), `enforcement` (`none|soft|hard`), `resolutionOrder[]` (`time-of-day|night`), `excludeWhen[]`, `evidence` (`established|partial|limited|insufficient`), `title`, `explanation`, `tip`, `sourceIds[]`.

Semantics (also embedded in the file under `semantics`):
- Matching is symmetric; `a === b` (a tag) fires for two **distinct** ingredients with that tag.
- Most specific rule wins per ingredient pair: id+id > id+tag > tag+tag; ties by higher severity, then lower rule id.
- **No rule means no default warning, not "safe".**
- **No rule in v1 is `hard`.** Do not implement any rule as hard. Soft rules never drop a product or change its frequency.
- `evidence: insufficient` rules must be presented as conservative planning preferences, never as medical claims.
- `reviewedNoRule` pairs must produce no warning (niacinamide + vitamin C, vitamin C + retinoid, vitamin C + AHA, vitamin C + benzoyl peroxide).

### Frequencies (`frequencies.json`)
Per scheduled ingredient: `mode`, `time`, `normalNights`, `sensitiveNights`, `maxUserNights`, `basis`. User-directed: `requiresDirections: true`. Global `scheduling` block: `restNightsMin`, `maxScheduledActivesPerNight`, `noConsecutiveNightsForTags`, `penaltyWeights`; **all are soft**. Every number is a planning default, not a clinical recommendation.

### Product (user data, Firestore `users/{uid}/products/{id}`)
```ts
interface Product {
  id: string; name: string;
  type: 'cleanser'|'toner'|'serum'|'treatment'|'moisturizer'|'sunscreen'|'exfoliant';
  ingredients: string[];              // ingredient ids
  productForm: 'leave-on'|'rinse-off';
  openedOn: string;                   // YYYY-MM-DD, not in the future
  monthsValid: number;
  bottle: 'dropper'|'tube'|'jar'|'pump'; color: string;
  isCombinationProduct: boolean;      // single product formulated with several actives
  directions?: {
    source: 'default'|'label'|'clinician';
    nightsPerWeek?: number;           // above maxUserNights only if source==='clinician'
    fixedDays?: Array<'mon'|'tue'|'wed'|'thu'|'fri'|'sat'|'sun'>; // clinician only
    time?: 'AM'|'PM';
    directedTogetherWith?: string[];  // product ids a clinician directed to be used together
  };
}
```
Profile: `skinType`, `concerns[]`, `sensitive: boolean` (a preference, not a diagnosis), `excludedIngredients: string[]` (user-declared avoids/allergies; never diagnosed or inferred). Check-ins: `users/{uid}/checkins/{YYYY-MM-DD}` = `{am, pm}`.

**Source references.** Every rule and ingredient carries `sourceIds`; the UI "Why?" panel shows rule `explanation`, `evidence` label, and linked titles from `sources.json`. Source access varies by reference. `sources.json` records which claims are supported and warns where only excerpts or abstracts were available. Do not describe every source as fully verified; use the evidence label and the source-specific note.

## D. Scheduler specification

**Inputs:** `products`, `profile`, `data` (validated files), `today` (unused for placement; the week is Monday-first and abstract).
**Output:**
```ts
interface WeekPlan {
  status: 'ok' | 'ok-with-warnings' | 'needs-decision';
  grid: Record<'AM'|'PM', Record<Day, string[]>>;   // product ids
  everyRoutine: Record<'AM'|'PM', string[]>;        // gentle products shown each routine
  warnings: PlanWarning[];                          // code, severity, ruleId?, productIds, message
  decisions: PlanDecision[];                        // things the user must resolve
  explanations: string[];                           // human-readable reasons for each placement choice
}
```

**Units.** A scheduled unit is a product with at least one `scheduled` ingredient. Its nights = `directions.nightsPerWeek` if present and valid, else the **lowest** applicable default among its scheduled ingredients (`sensitiveNights` if `profile.sensitive`). Rinse-off products use their own directions; without them, fall back to defaults and add an info explanation.

**Hard constraints (never violated).**
1. Clinician `fixedDays` are placed exactly as entered, on the entered time.
2. A product containing an ingredient in `profile.excludedIngredients` is never auto-scheduled; it appears in `decisions` with the reason.
3. Essential routine steps (cleanser, moisturizer, AM sunscreen) are never removed or rescheduled by the scheduler.
4. Nothing is silently dropped and no frequency is silently changed. Any deviation is reported.

**Soft preferences (weighted penalties from `frequencies.json`).** Separate `soft` rule pairs (`resolutionOrder` decides tactic order); no consecutive nights for retinoid-tagged units; keep `restNightsMin` PM nights with no scheduled active; at most `maxScheduledActivesPerNight` per slot-night.

**Informational (no scheduling effect).** `info` rules; duplicate-ingredient notices; retinoid pregnancy/breastfeeding notice; patch-test reminder for products added in the last 14 days; sunscreen guidance; combination-product note.

**Never override a prescriber.** If `directions.source === 'clinician'`, schedule exactly as directed, suppress conflict warnings for pairs listed in `directedTogetherWith`, and show a neutral line ("Following your prescriber's directions").

**Algorithm (deterministic).**
1. Validate inputs and data; build units; apply exclusions (decisions).
2. Place clinician `fixedDays` first.
3. Compute soft-rule pairs between remaining units (using `matchRules`, skipping `excludeWhen` matches).
4. **Time-of-day resolution:** for each soft pair whose `resolutionOrder[0] === 'time-of-day'`, if one unit's time is `any` and the other is fixed, set the flexible one to the opposite routine and record an explanation. Remaining `any` units default to PM.
5. Sort units by (number of soft pairs desc, nights desc, max irritationPotential desc, id asc). *This replaces the earlier fixed order "retinoids → BPO → AHA → BHA → vitamin C"; it produces the same ordering in typical shelves but is derived from the data, not hard-coded.*
6. For each unit, for each needed night, evaluate all unused days with score `(penalty, activesAlreadyThatSlotNight, dayIndex)` and choose the minimum. Penalty sums: weight of each soft rule between this unit and units already in that slot-night where `night` is a listed tactic; `consecutiveRetinoid` for adjacent retinoid nights; `overMaxActives`. Day index is the final tie-break, so output is identical for identical input. No randomness, no iteration over unordered objects (sort keys explicitly).
7. If a chosen night still has penalty > 0, emit a warning with the rule id and explanation. Do not alter frequency.
8. Count PM nights without scheduled actives; if fewer than `restNightsMin`, emit `REST_NIGHTS_SHORT` (soft).
9. `status`: `needs-decision` if `decisions` is non-empty; `ok-with-warnings` if warnings exist; else `ok`.

**Failure handling.** Invalid data or malformed products return `needs-decision` with a plain explanation, never a partial silent plan. The UI shows what conflicts, why, and offers: choose a different time, lower a product's frequency yourself, or mark "my clinician directed these together".

**Illustrative example (reference prototype, Python, throwaway; not a full scheduler verification).** Shelf: retinol serum, glycolic toner, benzoyl peroxide gel, vitamin C serum, niacinamide. Normal skin:

| | Mon | Tue | Wed | Thu | Fri | Sat | Sun |
|---|---|---|---|---|---|---|---|
| AM | BPO gel | BPO gel | BPO gel | BPO gel | | | |
| PM | retinol | glycolic | retinol | glycolic | retinol | rest | rest |

Explanation produced: "BPO moved to morning (separated from retinol by time of day, rule c01)." Vitamin C and niacinamide are every-routine. Sensitive profile: retinol Mon/Wed, glycolic Tue, BPO Mon/Tue AM; 4 rest nights. Both runs are identical on repeat. Reimplement in TypeScript; do not port the prototype. The Python prototype is only an illustrative deterministic-placement example, not a complete implementation of this specification: it does not implement all product-direction, exclusion, fixed-day, combination-product suppression, or clinician-directed-pair semantics, and its consecutive-retinoid/rest-night handling is incomplete. The TypeScript scheduler must pass the tests in section G rather than relying on this prototype as proof of correctness.

## E. Safety requirements

Notices are contextual and calm. Prominent only where genuinely important. Wording below is the UI source text.

| Where | Text |
|---|---|
| Footer (every page) | "General skincare organiser, not medical advice. It cannot diagnose skin conditions or replace a dermatologist." |
| Retinoid on shelf (`pregnancyAdvisory`) | "If you are pregnant or planning a pregnancy, do not use topical retinoids without medical advice. If breastfeeding, ask your clinician whether your specific product is appropriate." Shown once per retinoid product card; no pregnancy status is collected. |
| `clinician` directions | "Following your prescriber's directions. This app won't change them." |
| Prescription retinoid without directions | "Add the schedule your prescriber gave you. We don't suggest one for prescription products." |
| Irritation (Week and Today, small link) | "If you have persistent burning, swelling, severe redness or significant peeling, stop the suspected product and ask a pharmacist or doctor." |
| Patch test (new product, 14 days) | "New product? Try it on a small spot (inner forearm) twice a day for 7 to 10 days first. Labels like 'natural' or 'hypoallergenic' don't guarantee a reaction-free product. A patch test lowers risk but doesn't guarantee your face will tolerate it." |
| Sunscreen slot | "Use broad-spectrum SPF 30+ and water-resistant sunscreen, and reapply about every 2 hours when outdoors. Follow the label." |
| Sensitive toggle | "This only lowers suggested frequencies. It isn't a diagnosis." |
| Excluded ingredients | "Tell us ingredients you avoid and we'll keep products containing them out of your plan. We can't diagnose allergies." |
| Defaults disclosure (Week page) | "Frequencies are cautious planning defaults, not medical advice. Product directions come first." |
| Combination product | "This product combines several actives in one formula. Combined products can behave differently from the same ingredients used separately, so follow its directions." |
| Rule explanation with `evidence: insufficient` | Prefix "Conservative planning note:" |

Requirements: ingredient-level defaults never replace product directions; the app never diagnoses; never claims a combination is "safe"; never tells a user to stop or change a prescribed treatment (only "talk to your prescriber"); evidence level is shown on every rule detail.

## F. User experience

- **Auth:** Welcome page with "Continue with Google". All other routes protected. Loading state while auth resolves.
- **Quiz:** one question per screen, progress bar: skin type, up to 3 concerns, sensitive toggle (with the disclaimer), optional excluded ingredients. Retakeable from Settings.
- **Shelf:** cards with SVG bottle, expiry badge (fresh / under 30 days / expired), add/edit/delete. `IngredientPicker` is a searchable chip selector; benzoyl peroxide and retinoids must be easy to find because they hide in cleansers and spot treatments. Fields for form (leave-on/rinse-off), combination-product toggle, and optional directions panel ("Do you have directions from a label or clinician?").
- **Routine:** AM and PM tabs; slots filled from shelf; gap cards; swap button; sunscreen slot with guidance.
- **Week:** 7-day grid, AM above PM, rest nights labelled "rest night", tap a cell for the explanation and rule details. A top banner shows `status`.
- **Warnings:** `caution` = banner; `notice` = inline chip; `info` = details view only. Maximum one banner per screen; group the rest.
- **Unschedulable explanations:** plain language, what conflicts, why, what the user can do, never alarming.
- **Today:** tonight's steps with product names, check-in buttons, streak flame.
- **Editing:** any edit recomputes the plan immediately; plan is derived, never stored.
- **Accessibility:** colour is never the only signal; focus states; labels on icon buttons.

## G. Testing

Vitest. `today` and all dates are injected. Minimum suites:
1. **Data validation:** each failure mode in `validateData` has a failing fixture; the real files pass.
2. **matchRules:** symmetry; tag expansion; `a === b` distinct-ingredient behaviour; specificity (retinol+BPO uses c01, adapalene+BPO uses c03); no duplicate warnings per pair; `excludeWhen` suppression; `reviewedNoRule` pairs produce nothing.
3. **Scheduler:** the example above (normal and sensitive) as snapshot tests; determinism (shuffle input order → identical output); no consecutive retinoid nights; rest nights; time-of-day resolution; clinician fixedDays honoured and never moved; excluded ingredient → decision, not silent drop; duplicate ingredient in two products → warning, no silent change; empty shelf; only every-routine products; two retinoids; product with two scheduled actives uses lowest nights; sensitive profile; rinse-off fallback.
4. **Safety:** retinoid product shows the advisory; clinician directions suppress paired warnings and never alter nights; prescription retinoid with no directions produces a decision, not an invented schedule; no UI string contains "safe to use", "diagnos", or "cure" (string scan test); every `insufficient` rule is prefixed as a conservative note.
5. **Expiry and streak:** boundary days, leap year, future opened date rejected, streak resets after a gap.
6. **Integration:** quiz → shelf → plan flow with mocked Firestore service.
7. **Regression:** fixtures for the shelves above stay in `__tests__/fixtures`; any scheduler change must update snapshots deliberately.

Never report a test as passing unless it was executed.

## H. Project conventions

- TypeScript `strict`. No `any`. Ids and enums as string-literal unions generated from the JSON where practical.
- File and folder names as in section B; components PascalCase, functions camelCase, data keys kebab-case ids.
- Business logic exists in exactly one place (`lib/`). If a component needs a derived value, add a hook, not logic.
- Errors: `lib/` functions return typed results or throw typed errors; UI converts them to calm messages; Firebase failures show a toast and never lose local edits.
- Dependencies: only those listed in section B plus `react-router-dom`. Ask before adding any other.
- Dates as `YYYY-MM-DD` local-time strings; never timestamps for expiry or streaks.
- Secrets in `.env` (gitignored); commit `.env.example` and `firestore.rules`.
- Commit after each phase with a conventional message.
- Comments explain *why* (especially evidence and planning-default caveats), not *what*.

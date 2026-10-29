# Antigravity phased prompts

Give these **one at a time**. Do not start the next phase until you have run the app, read the completion report, and committed. Always attach `MASTER_CONTEXT.md` and the four JSON files from `src/data/` to Phase 1; later phases say "re-read MASTER_CONTEXT.md first".

Adjustments from the original phase list: Firebase auth and Firestore got their own phase (this app has login), and the UI phase is split so the scheduler is verified before any screens depend on it.

---

## GLOBAL RULES (paste at the top of every phase)

```
You are implementing the Skincare Routine Builder. Source of truth: MASTER_CONTEXT.md and the JSON files in src/data/. Re-read them now.

Rules for every phase:
1. Inspect the existing repository before changing anything. Do not assume it is empty or that a framework is configured. Preserve working functionality.
2. Never invent conflict rules, frequencies, ingredient facts, sources or safety text. If something is missing or contradictory, stop and report it instead of guessing.
3. All business logic lives in src/lib (pure TypeScript, no React, no Firebase, no Date.now). Components contain no scheduling or conflict logic.
4. Add no dependency beyond those in MASTER_CONTEXT.md section B without asking.
5. Do not fabricate test results. In your completion report separate: (a) commands you actually ran with their real output summary, (b) checks you could not run and why.
6. Finish with a completion report in this format: Summary / Files created or changed / Commands run and results / Not run / Deviations from MASTER_CONTEXT.md (with justification) / Open questions.
```

---

## PHASE 1: Repository audit and foundation

**Objective.** Understand the repo and set up the foundation. Do not write feature code yet.

**Tasks**
1. Inspect the repo: framework, package manager, existing files, scripts, lint/test setup. Report what exists.
2. Produce an implementation plan (files to create or change per phase) **and wait for my approval before modifying any file**.
3. After approval: ensure Vite + React + TypeScript (strict) + Tailwind + Vitest + react-router-dom + zustand + date-fns are configured; create the folder structure from section B; copy the four JSON files into `src/data/`; add `.env.example`, `.gitignore` entries, and an empty `firestore.rules`.

**Constraints.** Do not create Firebase code yet. Do not create UI beyond a placeholder App.

**Acceptance criteria.** `npm run dev`, `npm run build`, and `npm test` all run (an empty test suite is acceptable); TypeScript strict is on; folder structure matches; JSON files are in place unchanged.

**Required tests.** None beyond the toolchain smoke tests.

---

## PHASE 2: Types, data loading and validation

**Objective.** Typed data layer with strict validation.

**Tasks**
1. `src/types/index.ts`: types for Ingredient, ConflictRule, FrequencyConfig, Source, Product, Profile, CheckIn, WeekPlan, PlanWarning, PlanDecision exactly as in MASTER_CONTEXT.md section C and D.
2. `src/lib/loadData.ts` and `src/lib/validateData.ts`: load the JSON and validate every check listed in MASTER_CONTEXT.md section B (port of `validate.py`).
3. Fail loudly with descriptive errors; the app must not schedule on invalid data.

**Constraints.** Do not modify the JSON files. If you believe a data file has a problem, report it; do not fix it.

**Acceptance criteria.** The real data passes; each deliberately broken fixture fails with a clear message naming the problem.

**Required tests.** One failing fixture per validation rule (unknown tag, unresolved rule reference, duplicate symmetric pair, `hard` enforcement present, missing frequency entry, every-routine with a frequency entry, nights ordering, unknown source id, duplicate ids) plus a passing test on the real files.

---

## PHASE 3: Conflict matching engine

**Objective.** `src/lib/matchRules.ts`: given a list of products, return the warnings.

**Tasks**
1. Expand tags to ingredient ids; match symmetrically; for `a === b` fire only for two distinct ingredients with that tag.
2. Resolve overlaps by specificity (id+id > id+tag > tag+tag), then higher severity, then lower rule id; one result per ingredient pair; deduplicate across products.
3. Apply `excludeWhen`: `combination-product` (either product flagged) and `clinician-directed-together` (via `directions.directedTogetherWith`).
4. Ensure `reviewedNoRule` pairs never produce output.
5. Return typed results with `ruleId`, `severity`, `enforcement`, `kind`, `productIds`, `ingredientIds`, `evidence`, `title`, `explanation`, `tip`, `sourceIds`.

**Constraints.** No UI. No scheduling. Pure functions. Do not treat any rule as hard.

**Acceptance criteria.** Behaviour matches MASTER_CONTEXT.md section C semantics.

**Required tests.** Symmetry; tag expansion; retinol+BPO uses c01 and adapalene+BPO uses c03; tretinoin+BPO uses c02; two retinoids fire c06 once; glycolic+lactic fire c08; AHA+BHA fires c07; BPO+exfoliant fires c09; sulfur+retinoid fires c10; niacinamide+vitamin C, vitamin C+retinol, vitamin C+glycolic, vitamin C+BPO produce nothing; combination-product and clinician suppression; the same ingredient in two products does not produce a self-conflict.

---

## PHASE 4: Scheduling engine

**Objective.** `src/lib/buildWeeklyPlan.ts` implementing MASTER_CONTEXT.md section D exactly.

**Tasks**
1. Build units, nights (lowest applicable default; `directions.nightsPerWeek` with the `maxUserNights` / clinician rule), exclusions, fixedDays, time-of-day resolution, deterministic greedy placement with the stated score `(penalty, load, dayIndex)`, rest-night check, status and explanations.
2. Sort every collection explicitly before iterating; no reliance on object key order or input order.
3. Never drop a product or change a frequency silently; unresolved items go to `warnings` or `decisions`.

**Constraints.** No UI, no Firebase, no clock access. No new rules or numbers.

**Acceptance criteria.** The two verified examples in section D reproduce exactly; shuffling the input products gives identical output.

**Required tests.** Everything under "Scheduler" in MASTER_CONTEXT.md section G, with snapshot tests for the two examples.

---

## PHASE 5: Routine matching and user interface (local state)

**Objective.** Screens working on local Zustand state only (no Firebase yet).

**Tasks**
1. `matchProducts.ts` (slots filled from the shelf, gap cards, skip expired) and `expiry.ts`, `streak.ts`, `generateRoutine.ts` (slots from the profile).
2. Zustand store with persist to localStorage for now.
3. Pages: Quiz, Shelf (add/edit/delete, IngredientPicker, expiry badges, directions panel, combination and rinse-off toggles), Routine, Week (grid, status banner, explanation drawer), Today (check-ins, streak). Pastel Tailwind theme, SVG `Bottle`, empty states, loading and error states.
4. Warnings display per MASTER_CONTEXT.md section F (caution banner, notice chip, info in details).

**Constraints.** Components call hooks; hooks call `lib/`. No logic in components. Do not add safety copy yet beyond placeholders.

**Acceptance criteria.** A user can complete the quiz, add three products, and see a routine, a week plan with explanations, and a working check-in streak, with data surviving a page refresh.

**Required tests.** `matchProducts` (gap card, expired skipped, best-ingredient preference), `expiry` boundaries, `streak` reset, and one integration test of quiz → shelf → plan.

---

## PHASE 6: Safety notices and product directions

**Objective.** Implement every row of the safety table in MASTER_CONTEXT.md section E using the exact wording given.

**Tasks**
1. `components/safety/` components for each notice; place them contextually, not as a wall of warnings.
2. Directions flow: prescription retinoids require entered directions; clinician source suppresses paired warnings and never alters nights; the plan never invents a prescription schedule.
3. Rule detail view showing evidence level and linked source titles; `insufficient` rules prefixed "Conservative planning note:".
4. Excluded-ingredients setting and its effect on the plan.

**Constraints.** Do not paraphrase safety text. Do not add medical claims. Never use the words "safe to use", "diagnose" (except in the stated disclaimers), or "cure" elsewhere.

**Acceptance criteria.** Each notice appears only in its stated context; a clinician-directed shelf shows the prescriber line and no warnings for the directed pair.

**Required tests.** Section G "Safety" suite, including the banned-phrase string scan.

---

## PHASE 7: Firebase auth and data layer

**Objective.** Google sign-in and Firestore persistence.

**Tasks**
1. `services/firebase.ts`, `auth.ts`, `db.ts`, `hooks/useAuth.ts`; ProtectedRoute; Welcome page with a Google button.
2. Firestore layout: `users/{uid}` (profile), `users/{uid}/products/{id}`, `users/{uid}/checkins/{YYYY-MM-DD}`.
3. Load on login into the store; save on change; toast on failure without losing local edits. Replace localStorage persist with this (keep an in-memory cache).
4. `firestore.rules`: a user can read and write only documents under their own uid. Never open access to everyone.
5. JSON export/import in Settings.

**Constraints.** Only `services/` imports Firebase. Config via `.env`; never commit real keys. Explain how to add the Vercel domain to Firebase authorized domains.

**Acceptance criteria.** Sign in, add a product, refresh, sign in on another browser: data is present. Signed-out users cannot reach protected routes.

**Required tests.** Mocked-service integration tests for load/save/failure; rules reviewed manually (state clearly that rules were not executed against the emulator unless you ran them).

---

## PHASE 8: Testing and debugging

**Objective.** Run everything, fix defects, verify acceptance criteria.

**Tasks.** Run lint, type-check, tests and a production build. Fix failures without weakening tests. Manually walk through: first-time user, returning user, sensitive profile, clinician-directed retinoid, excluded ingredient, empty shelf, two retinoids, expired product. Report each walkthrough result honestly.

**Acceptance criteria.** All suites pass; build succeeds; no `any`; no logic in components.

**Completion report must list** every command run with its outcome and anything not verified (for example, real Google sign-in if it could not be tested).

---

## PHASE 9: Final audit and documentation

**Objective.** Check the implementation against MASTER_CONTEXT.md and finish the README.

**Tasks**
1. Audit: list each requirement in MASTER_CONTEXT.md and mark Met / Partly / Not met with file references.
2. Remove inconsistencies and dead code; confirm no rule is enforced as hard and no safety wording was altered.
3. README: what it is, screenshots/GIF placeholders, live link placeholder, stack, architecture diagram (data → lib → store → UI), how the scheduler works, how rules and sources are stored, safety stance ("planning tool, not medical advice"), known limitations, v2 ideas.
4. Document in the README that the niacinamide + vitamin C pairing was deliberately left without a warning, and why.

**Acceptance criteria.** A new developer can understand and run the project from the README alone.

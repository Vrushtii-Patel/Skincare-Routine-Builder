# Skincare Routine Builder — Final Data & Evidence Audit

**Audit date:** 2026-10-29  
**Scope:** Data, source records, validator, master context, phased implementation prompts, and reference scheduler.  
**Decision:** **Conditional go for implementation planning; do not port the Python prototype.** The data files pass structural validation after the corrections below, but the TypeScript scheduler must implement the full written specification and pass the required tests before the app is considered ready.

## Changes made in this audit

1. Updated AAD source URLs to canonical `www.aad.org` paths.
2. Added the primary AAD pregnancy-treatment page as `s-aad-pregnancy` and linked it to all retinoid ingredient records.
3. Updated the AAD retinoid/retinol and patch-testing source summaries to reflect the accessible page content.
4. Updated the source-access note: some AAD pages were accessible in full during this audit, while other references may still be excerpts/abstracts. The old blanket claim that *all* sources were excerpt-only was inaccurate.
5. Reworded `c01` (retinol + benzoyl peroxide) so the oxidation claim is explicitly limited and the rule is framed as a cautious timing preference, not a universal incompatibility.
6. Reworded `c02` (tretinoin + benzoyl peroxide) to acknowledge that AAD lists prescribed combination medicines, including tretinoin-containing Twyneo, while still distinguishing separate products and deferring to product/prescriber instructions.
7. Revised the retinoid safety copy to separate pregnancy/planning-pregnancy guidance from breastfeeding, which should be checked with a clinician for the specific product.
8. Strengthened `validate.py` to check required fields, non-empty rule text, source metadata and HTTPS URLs, and duplicate `reviewedNoRule` pairs.
9. Updated `MASTER_CONTEXT.md` to state explicitly that the Python scheduler is illustrative and incomplete, not proof that the full scheduler specification has been met.

## Checks actually run

- `python3 validate.py` — **PASS**: `ingredients=27 tags=14 rules=10 noRule=4 freq=10 sources=15`; `ALL CHECKS PASSED`.
- `python3 reference_scheduler_prototype.py` — **runs** and repeats the same output for the included normal/sensitive example.
- Targeted prototype probes — **FAIL against the full specification**, as detailed below. These are known prototype limitations, not failures of the JSON validator.

## Important prototype findings — do not port this code

The Python prototype is explicitly marked as throwaway, and these probes confirm it is not a complete scheduler:

1. **Prescription retinoid with no directions:** a shelf containing only tretinoin returns an empty schedule with no decision or warning. The specification requires `needs-decision` and an explanation; prescription products must never silently disappear.
2. **Consecutive retinoid nights:** retinol and adapalene are placed on alternating days across the week, creating a retinoid every night. The prototype's consecutive-night penalty only considers nights selected for the current product, not retinoid products already placed by other units.
3. **Rest-night shortfall:** a high-active shelf can leave zero PM rest nights, but the prototype does not emit the specified `REST_NIGHTS_SHORT` warning.
4. **Product directions and exclusions:** the prototype does not implement the full contract for `fixedDays`, `nightsPerWeek`, excluded ingredients, `directedTogetherWith`, or `excludeWhen` suppression. Do not use it as evidence those cases work.
5. **Every-routine products:** the prototype's output only includes scheduled units; it does not return the separate `everyRoutine` collections required by the TypeScript `WeekPlan`.

These are not reasons to abandon the project. They are reasons to implement the TypeScript scheduler from `MASTER_CONTEXT.md` and test every required case instead of translating the prototype.

## Evidence notes

- AAD acne treatment guidance lists retinoid + benzoyl peroxide combination medicines, including Epiduo, Epiduo Forte and Twyneo. This means the app must not state that the pairing is universally incompatible.
- AAD pregnancy guidance says tazarotene should not be used during pregnancy and that most experts recommend stopping adapalene and tretinoin; it advises consulting an obstetrician or dermatologist before treating acne during pregnancy.
- AAD patch-testing guidance recommends testing a product on a small spot twice daily for 7–10 days, following its normal directions. This lowers uncertainty but does not guarantee facial tolerance.
- Frequencies in `frequencies.json` remain explicitly labelled planning defaults, not clinical recommendations.
- Secondary sources should not be the sole basis for a hard safety restriction. The dataset currently contains no hard rules.

## Go/no-go

**GO** to the Antigravity repository audit/foundation phase after confirming that the corrected files are the versions you intend to use.

**NO-GO** to treating the Python prototype as a validated scheduler, or to claiming the app's scheduling logic is correct before the TypeScript tests pass.

Before implementation phases that depend on scheduling, the acceptance tests must cover at minimum: prescription product with no directions, fixed clinician days, excluded ingredients, clinician-directed pairs, combination products, shuffled input order, cross-product consecutive retinoid nights, rest-night shortfall, every-routine products, and empty shelves.

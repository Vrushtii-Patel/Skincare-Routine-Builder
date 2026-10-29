# Skincare Routine Builder

An editorial, evidence-informed web application and daily skincare journal designed to help users organize their skincare shelf, understand ingredient interactions, build morning and evening routines, and generate a deterministic 7-day schedule for strong active ingredients.

---

## 🌸 Visual Aesthetic & Design Direction

"Modern feminine skincare journal meets premium beauty editorials."

- **Color Palette:**
  - Dusty Rose: `#C496A1` (Primary accent & call-to-action glow)
  - Muted Sage: `#919D85` (Balancing botanical green & completion state)
  - Lavender Purple: `#8E88A3` (Evening routine & active category)
  - Vintage Cream: `#EBE1C6` (Warm paper & neutral borders)
  - Soft Ivory: `#FAF7F2` (Calm background)
  - Cocoa Brown: `#28221E` (Readable text)
- **Typography:** Refined editorial headers (*Playfair Display*) paired with clean, accessible interface typography (*Plus Jakarta Sans*).
- **Custom Illustrations:** Bespoke SVG illustrations for skincare bottles, jars, tubes, droppers, pumps, droplets, and botanical motifs.

---

## 🛠️ Architecture & Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | React 18 + Vite |
| **Language** | TypeScript (Strict mode enabled, no `any`) |
| **Styling** | Tailwind CSS with custom design tokens |
| **State Management** | Zustand with versioned `localStorage` persistence |
| **Date Arithmetic** | `date-fns` |
| **Icons** | Lucide Icons |
| **Celebration Motion**| `canvas-confetti` |
| **Testing** | Vitest + React Testing Library + JSDOM |
| **Backend Integration** | Local-First Architecture (Offline-ready; Firebase auth/Firestore pluggable) |

### Separation of Concerns

```
reference/       Audit documentation, master context, and python reference tools
                 - MASTER_CONTEXT.md, AUDIT_REPORT.md, ANTIGRAVITY_PROMPTS.md
                 - validate.py, reference_scheduler_prototype.py
                 - ingredients.json, conflicts.json, frequencies.json, sources.json
src/
  data/          Static reference JSON files (primary source of truth for app)
                 - ingredients.json, conflicts.json, frequencies.json, sources.json
  types/         Strict TypeScript domain interfaces and discriminated unions
  lib/           Pure TypeScript business logic (no React, no clock access, 100% deterministic)
                 - validateData.ts: Port of validate.py ensuring data consistency
                 - loadData.ts: Safe loader and validator
                 - matchRules.ts: Specificity-based ingredient conflict matcher
                 - buildWeeklyPlan.ts: Deterministic weekly routine scheduling engine
                 - expiry.ts: Period After Opening (PAO) & expiry calculator
                 - streak.ts: Daily completion and streak engine
                 - matchProducts.ts: Ordered routine slot builder & gap identifier
  store/         Zustand store with versioned persistence and JSON import/export
  hooks/         React hooks deriving reactive state from lib/
  components/    Presentation components
                 - layout/: Navbar, AppLayout
                 - skincare/: Custom SVG illustrations (droppers, jars, tubes, pumps, twigs)
                 - safety/: Contextual medical disclaimers & caution banners
                 - shelf/: IngredientPicker, ProductFormModal
                 - ui/: Modal, Toast
  pages/         Welcome, Quiz, Today (Dashboard), Routine, Shelf, Week, Compatibility, Settings
```

---

## 🧠 Scheduling Engine Mechanics

The TypeScript scheduling engine (`src/lib/buildWeeklyPlan.ts`) is deterministic, reproducible, and explainable:

1. **Units:** Evaluates products owning at least one `scheduled` active. Frequencies follow `frequencies.json` defaults (`sensitiveNights` for sensitive profiles) unless clinician-directed or label directions are entered.
2. **Hard Constraints:**
   - Clinician `fixedDays` are anchored exactly on specified days and never moved.
   - Products containing any ingredient in `profile.excludedIngredients` are never auto-scheduled and surface in `decisions`.
   - Prescription retinoids (e.g., tretinoin, tazarotene) without entered directions produce `NEEDS_CLINICIAN_DIRECTIONS` instead of an invented schedule.
   - Essential steps (cleanser, moisturizer, AM sunscreen) are never dropped.
3. **Time-of-Day Resolution:** Soft rules with `time-of-day` tactic separate compatible pairs between morning and evening (e.g., benzoyl peroxide moved to AM while retinol stays in PM).
4. **Greedy Placement with Lookahead Scoring:**
   - Candidate units are sorted by soft conflict degree descending, nights descending, maximum irritation potential descending, and product ID ascending.
   - Day selection minimizes `score = (penalty, activesAlreadyInSlot, dayIndex)`:
     - Conflict weight penalty from `frequencies.json`
     - Cross-product consecutive retinoid penalty (weight 3) across all products with a `retinoid` tag
     - Slot capacity penalty if slot already contains $\ge 2$ scheduled actives
5. **Rest Nights Preservation:** Counts PM nights without scheduled actives. If fewer than `restNightsMin` (2 nights), emits a `REST_NIGHTS_SHORT` warning.
6. **No Silent Drops:** Products and ingredients are never silently omitted. Explanations describe every time-of-day move, alternating schedule, and soft warning.

---

## 🧪 Scientific Evidence & Compatibility Decisions

- **Niacinamide + Vitamin C:** Deliberately left without a conflict warning in `conflicts.json` (`reviewedNoRule`). Quoted dermatological consensus describes the old "cannot mix" claim as a laboratory artifact of high temperatures and unformulated raw chemicals.
- **Vitamin C + Retinoid:** Separated by default via `preferredTime` (Vitamin C in AM, Retinoid in PM) rather than claiming a chemical incompatibility.
- **Retinol + Benzoyl Peroxide:** Rule `c01` is classified as `efficacy-timing` with `partial` evidence. Resolved by time-of-day separation (BPO in AM, Retinol in PM).
- **Adapalene + Benzoyl Peroxide:** Rule `c03` is classified as `info` with `enforcement: none` because the pair is an established prescription combination (e.g., Epiduo).
- **Conservative Planning Notes:** All rules lacking formal clinical citations (`evidence: insufficient`) are explicitly labelled in the UI with the prefix `"Conservative planning note:"` to prevent misleading medical claims.

---

## 🛡️ Safety Disclaimers

This application is an educational and organizational tool. It does not provide medical diagnoses, treatment plans, or drug dosage recommendations.

- Every page displays: *"General skincare organiser, not medical advice. It cannot diagnose skin conditions or replace a dermatologist."*
- Retinoid advisory: *"If you are pregnant or planning a pregnancy, do not use topical retinoids without medical advice. If breastfeeding, ask your clinician whether your specific product is appropriate."*
- Patch-testing advice reflects American Academy of Dermatology (AAD) recommendations (testing on inner forearm twice daily for 7–10 days).

---

## 🚀 Running the Application

### Prerequisites

- Node.js (v18+)
- npm (v9+)

### Installation & Development

```bash
# Install dependencies
npm install

# Start local development server
npm run dev
```

### Running Automated Tests

```bash
# Run Vitest test suite
npm test

# Run Python reference data consistency validator
python3 reference/validate.py
```

### Production Build & Preview

```bash
# Type check and bundle for production
npm run build

# Preview production build locally
npm run preview
```


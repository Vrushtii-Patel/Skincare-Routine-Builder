import React from 'react';
import { AlertCircle, ShieldAlert, Sparkles, Info, HeartPulse } from 'lucide-react';

/**
 * Universal App Disclaimer Footer
 */
export const AppDisclaimerFooter: React.FC = () => (
  <footer className="mt-16 py-8 border-t border-cream-200 text-center text-xs text-cocoa-400 max-w-4xl mx-auto px-4">
    <div className="flex items-center justify-center gap-2 mb-2 font-medium text-cocoa-600">
      <Sparkles className="w-3.5 h-3.5 text-rose-500" />
      <span>Skincare Routine Builder</span>
    </div>
    <p>
      General skincare organiser, not medical advice. It cannot diagnose skin conditions or replace a dermatologist.
    </p>
  </footer>
);

/**
 * Retinoid Pregnancy & Nursing Advisory Notice
 */
export const RetinoidPregnancyAdvisory: React.FC = () => (
  <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-rose-50/80 border border-rose-200/90 text-xs text-rose-900 leading-relaxed my-2">
    <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
    <p>
      If you are pregnant or planning a pregnancy, do not use topical retinoids without medical advice. If breastfeeding, ask your clinician whether your specific product is appropriate.
    </p>
  </div>
);

/**
 * Clinician Directions Following Banner
 */
export const ClinicianPrescriberNotice: React.FC = () => (
  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sage-50 border border-sage-200 text-xs text-sage-800 font-medium">
    <HeartPulse className="w-3.5 h-3.5 text-sage-600" />
    <span>Following your prescriber's directions. This app won't change them.</span>
  </div>
);

/**
 * Prescription Retinoid Without Directions Notice
 */
export const PrescriptionMissingDirectionsNotice: React.FC = () => (
  <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-cream-100 border border-cream-300 text-xs text-cocoa-800 leading-relaxed my-2">
    <AlertCircle className="w-4 h-4 text-cocoa-600 shrink-0 mt-0.5" />
    <p>
      Add the schedule your prescriber gave you. We don't suggest one for prescription products.
    </p>
  </div>
);

/**
 * Persistent Irritation Caution Link & Modal Trigger
 */
export const IrritationGuidanceNotice: React.FC<{ compact?: boolean }> = ({ compact }) => {
  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50/60 px-3 py-1.5 rounded-full border border-rose-200/60">
        <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
        <span>Experiencing redness or burning? Stop suspected actives and consult a doctor.</span>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-50/90 border border-rose-200 text-xs text-rose-900 leading-relaxed my-3">
      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
      <div>
        <p className="font-medium mb-0.5">Reaction or Irritation Notice</p>
        <p>
          If you have persistent burning, swelling, severe redness or significant peeling, stop the suspected product and ask a pharmacist or doctor.
        </p>
      </div>
    </div>
  );
};

/**
 * Patch Test Reminder (for products introduced recently)
 */
export const PatchTestGuidanceNotice: React.FC = () => (
  <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-lavender-50/80 border border-lavender-200 text-xs text-lavender-900 leading-relaxed my-2">
    <Info className="w-4 h-4 text-lavender-600 shrink-0 mt-0.5" />
    <div>
      <span className="font-semibold block mb-0.5">Patch test guidance</span>
      <p>
        New product? Try it on a small spot (inner forearm) twice a day for 7 to 10 days first. Labels like 'natural' or 'hypoallergenic' don't guarantee a reaction-free product. A patch test lowers risk but doesn't guarantee your face will tolerate it.
      </p>
    </div>
  </div>
);

/**
 * Sunscreen Slot Guidance
 */
export const SunscreenGuidanceNotice: React.FC = () => (
  <div className="flex items-start gap-2 p-2.5 rounded-xl bg-cream-50 border border-cream-200 text-xs text-cocoa-700">
    <Sparkles className="w-3.5 h-3.5 text-cream-600 shrink-0 mt-0.5" />
    <p>
      Use broad-spectrum SPF 30+ and water-resistant sunscreen, and reapply about every 2 hours when outdoors. Follow the label.
    </p>
  </div>
);

/**
 * Sensitive Skin Toggle Disclaimer
 */
export const SensitiveToggleDisclaimer: React.FC = () => (
  <span className="text-[11px] text-cocoa-400 block mt-1">
    This only lowers suggested frequencies. It isn't a diagnosis.
  </span>
);

/**
 * Excluded Ingredients Disclaimer
 */
export const ExcludedIngredientsDisclaimer: React.FC = () => (
  <p className="text-xs text-cocoa-500 mt-1.5">
    Tell us ingredients you avoid and we'll keep products containing them out of your plan. We can't diagnose allergies.
  </p>
);

/**
 * Defaults Planning Disclosure (Week page)
 */
export const DefaultsDisclosureNotice: React.FC = () => (
  <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-cream-100/80 border border-cream-200/90 text-xs text-cocoa-600">
    <Info className="w-3.5 h-3.5 text-cream-700 shrink-0" />
    <span>Frequencies are cautious planning defaults, not medical advice. Product directions come first.</span>
  </div>
);

/**
 * Combination Product Notice
 */
export const CombinationProductNotice: React.FC = () => (
  <div className="flex items-start gap-2 p-2.5 rounded-xl bg-sage-50/70 border border-sage-200 text-xs text-sage-900">
    <Info className="w-3.5 h-3.5 text-sage-600 shrink-0 mt-0.5" />
    <p>
      This product combines several actives in one formula. Combined products can behave differently from the same ingredients used separately, so follow its directions.
    </p>
  </div>
);


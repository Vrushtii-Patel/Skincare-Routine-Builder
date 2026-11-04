import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles,
  ShieldCheck,
  Sun,
  Moon,
  Calendar,
  Lock,
  AlertCircle,
  Loader2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { SkinType, SkinConcern, SkinReactivity } from '../types';
import { Modal } from '../components/ui/Modal';
import { signInWithGoogleService } from '../services/auth';
import { isFirebaseConfigured } from '../services/firebase';

const SKIN_TYPES: { type: SkinType; label: string; desc: string }[] = [
  {
    type: 'normal',
    label: 'Balanced / Normal',
    desc: 'My skin generally feels comfortable, without excessive oiliness or dryness.',
  },
  {
    type: 'dry',
    label: 'Dry',
    desc: 'My skin often feels tight, rough, or flaky.',
  },
  {
    type: 'oily',
    label: 'Oily',
    desc: 'My face tends to look shiny or feel greasy throughout the day.',
  },
  {
    type: 'combination',
    label: 'Combination',
    desc: 'My forehead and nose get oily, while my cheeks stay normal or dry.',
  },
];

const CONCERNS: { id: SkinConcern; label: string; desc: string }[] = [
  { id: 'acne', label: 'Breakouts & clogged pores', desc: 'Pimples, blackheads, or frequent breakouts.' },
  { id: 'barrier', label: 'Skin barrier support', desc: 'Skin that feels irritated, tight, or easily uncomfortable.' },
  { id: 'hyperpigmentation', label: 'Dark spots & uneven tone', desc: 'Post-breakout marks or uneven pigmentation.' },
  { id: 'aging', label: 'Fine lines & skin firmness', desc: 'Early visible lines or changes in skin firmness.' },
  { id: 'texture', label: 'Rough or uneven texture', desc: 'Skin that feels bumpy or uneven.' },
  { id: 'redness', label: 'Redness & sensitivity', desc: 'Skin that frequently looks flushed or feels irritated.' },
  { id: 'dullness', label: 'Dullness & radiance', desc: 'Skin that looks tired or lacks radiance.' },
  { id: 'dryness', label: 'Dehydrated skin', desc: 'Skin that feels tight or lacks moisture, even if oily.' },
];

const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export const Quiz: React.FC = () => {
  const navigate = useNavigate();
  const profile = useStore((state) => state.profile);
  const updateProfile = useStore((state) => state.updateProfile);
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);

  const [currentStep, setCurrentStep] = useState(0);
  const [skinType, setSkinType] = useState<SkinType | null>(
    profile.isOnboarded ? profile.skinType ?? null : null
  );
  const [selectedConcerns, setSelectedConcerns] = useState<SkinConcern[]>(
    profile.isOnboarded ? profile.concerns : []
  );
  const [sensitive, setSensitive] = useState<boolean>(profile.isOnboarded ? profile.sensitive : false);
  const [skinReactivity, setSkinReactivity] = useState<SkinReactivity>(
    profile.isOnboarded && profile.skinReactivity
      ? profile.skinReactivity
      : profile.sensitive
      ? 'sometimes'
      : 'rarely'
  );
  const [experience, setExperience] = useState<'beginner' | 'intermediate' | 'experienced'>(
    profile.isOnboarded && profile.experienceLevel ? profile.experienceLevel : 'beginner'
  );
  const [excludedIngredients, setExcludedIngredients] = useState<string[]>(
    profile.isOnboarded ? profile.excludedIngredients : []
  );
  const [pregnancyOrNursing, setPregnancyOrNursing] = useState<boolean>(
    profile.isOnboarded && profile.pregnancyOrNursing ? profile.pregnancyOrNursing : false
  );

  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSkinGuideOpen, setIsSkinGuideOpen] = useState(false);
  const [expandedIngredients, setExpandedIngredients] = useState<string[]>([]);

  const toggleExpandedIngredient = (id: string) => {
    setExpandedIngredients((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const commonAvoidableIngredients = [
    {
      id: 'retinol',
      label: 'Retinol',
      desc: 'A vitamin A ingredient commonly used in skincare for acne and visible signs of aging.',
      preferenceReasons: 'Already using prescription retinoids, experiencing peeling/dryness, or personal preference to avoid active retinoids.',
      allergyNote: 'Exclude if pregnant or nursing without clinician approval. True contact allergy is rare; irritation is more common.',
    },
    {
      id: 'benzoyl-peroxide',
      label: 'Benzoyl Peroxide',
      desc: 'An antibacterial ingredient commonly used to target and prevent acne breakouts.',
      preferenceReasons: 'Skin prone to dryness and peeling, or wanting to prevent fabric and towel bleaching.',
      allergyNote: 'True allergic contact dermatitis can occur (severe itching, swelling, or hives). Discontinue if experienced.',
    },
    {
      id: 'salicylic-acid',
      label: 'Salicylic Acid (BHA)',
      desc: 'An exfoliating ingredient commonly used for clogged pores and acne-prone skin.',
      preferenceReasons: 'Skin prone to over-drying, or already using sufficient clarifying treatments in your routine.',
      allergyNote: 'Avoid if you have a known allergy or sensitivity to aspirin or other salicylates.',
    },
    {
      id: 'glycolic-acid',
      label: 'Glycolic Acid (AHA)',
      desc: 'An alpha-hydroxy acid commonly used to exfoliate skin surface texture and dullness.',
      preferenceReasons: 'Sensitized moisture barrier that easily stings, or currently focusing on barrier repair over resurfacing.',
      allergyNote: 'Primarily causes irritation rather than true allergy; avoid on compromised, peeling, or sunburned skin.',
    },
    {
      id: 'colloidal-oatmeal',
      label: 'Colloidal Oatmeal',
      desc: 'A soothing ingredient derived from finely ground oats, commonly used to calm dry or irritated skin.',
      preferenceReasons: 'Personal preference for lightweight gel formulas or non-oat moisturiser textures.',
      allergyNote: 'Avoid if you have a diagnosed oat allergy, grain allergy, or severe contact sensitivity.',
    },
    {
      id: 'sulfur',
      label: 'Sulfur',
      desc: 'A mineral ingredient commonly used in clarifying treatments for blemishes and oily skin.',
      preferenceReasons: 'Preference to avoid distinct mineral scents, or skin prone to over-drying with clarifying minerals.',
      allergyNote: 'Avoid if you have a known contact allergy or diagnosed sensitivity to topical sulfur products.',
    },
  ];

  // Total 6 steps:
  // 0: Skin Type, 1: Concerns, 2: Sensitivity & Experience, 3: Exclusions, 4: Review & Advisories, 5: Ritual Ready (Google Sign-In)
  const totalSteps = 6;

  const toggleConcern = (concern: SkinConcern) => {
    if (selectedConcerns.includes(concern)) {
      setSelectedConcerns(selectedConcerns.filter((c) => c !== concern));
    } else {
      if (selectedConcerns.length < 3) {
        setSelectedConcerns([...selectedConcerns, concern]);
      }
    }
  };

  const toggleExcluded = (id: string) => {
    if (excludedIngredients.includes(id)) {
      setExcludedIngredients(excludedIngredients.filter((i) => i !== id));
    } else {
      setExcludedIngredients([...excludedIngredients, id]);
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/welcome');
    }
  };

  // Google Sign-In & Completion Handler
  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const userSession = await signInWithGoogleService();
      setUser(userSession);
      updateProfile({
        skinType: skinType || 'combination',
        concerns: selectedConcerns,
        sensitive,
        skinReactivity,
        experienceLevel: experience,
        excludedIngredients,
        pregnancyOrNursing,
        isOnboarded: true,
      });
      navigate('/today');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign-in failed';
      if (
        msg.includes('auth/popup-closed-by-user') ||
        msg.includes('auth/cancelled-popup-request')
      ) {
        setAuthError(null);
      } else {
        setAuthError(msg);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // For users who are already authenticated
  const handleCompleteSignedIn = () => {
    updateProfile({
      skinType: skinType || 'combination',
      concerns: selectedConcerns,
      sensitive,
      skinReactivity,
      experienceLevel: experience,
      excludedIngredients,
      pregnancyOrNursing,
      isOnboarded: true,
    });
    navigate('/today');
  };

  // Safe fallback for dev/test environments without Firebase keys
  const handleDevBypass = () => {
    updateProfile({
      skinType: skinType || 'combination',
      concerns: selectedConcerns,
      sensitive,
      skinReactivity,
      experienceLevel: experience,
      excludedIngredients,
      pregnancyOrNursing,
      isOnboarded: true,
    });
    navigate('/today');
  };

  return (
    <div className="max-w-2xl mx-auto py-6 sm:py-10">
      {/* Progress Bar & Header */}
      <div className="space-y-4 mb-8">
        <div className="flex items-center justify-between text-xs text-cocoa-500 font-medium">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-cocoa-600 hover:text-cocoa-900 transition-colors focus:outline-none"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <span>
            {currentStep === 5
              ? 'Final Step • Sign In'
              : `Step ${currentStep + 1} of ${totalSteps}`}
          </span>
        </div>

        <div className="w-full h-1.5 bg-cream-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-rose-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="card-editorial p-6 sm:p-8 space-y-6">
        {/* Step 0: Skin Type */}
        {currentStep === 0 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <span className="text-xs uppercase tracking-widest text-rose-600 font-semibold">
                Foundation
              </span>
              <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-cocoa-900 mt-1">
                How does your skin usually feel throughout the day?
              </h2>
              <p className="text-xs sm:text-sm text-cocoa-500 mt-1 leading-relaxed">
                Think about how your skin feels a few hours after washing it, before applying skincare.
              </p>
              <div className="mt-2.5">
                <button
                  type="button"
                  onClick={() => setIsSkinGuideOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-lavender-700 hover:text-lavender-900 underline underline-offset-2 transition-colors focus:outline-none focus:ring-2 focus:ring-lavender-400 focus:ring-offset-1 rounded-sm"
                  aria-label="Not sure? Learn how to identify your skin type"
                >
                  <HelpCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Not sure? Learn how to identify your skin type.</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {SKIN_TYPES.map((st) => {
                const isSelected = skinType === st.type;
                return (
                  <button
                    key={st.type}
                    type="button"
                    onClick={() => setSkinType(st.type)}
                    className={`p-4 rounded-2xl text-left border transition-all ${
                      isSelected
                        ? 'bg-lavender-50/90 border-lavender-400 ring-1 ring-lavender-400 shadow-2xs'
                        : 'bg-white/80 border-cream-200 hover:border-cream-300 hover:bg-cream-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-cocoa-900">{st.label}</span>
                      {isSelected && <Check className="w-4 h-4 text-lavender-700 stroke-[3]" />}
                    </div>
                    <p className="text-xs text-cocoa-500 mt-1.5 leading-relaxed">{st.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 1: Main Concerns */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-rose-600 font-semibold">
                  Goals
                </span>
                <span
                  className={`text-[11px] sm:text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedConcerns.length === 3 ? 'text-rose-700 font-semibold' : 'text-cocoa-600'
                  }`}
                  aria-live="polite"
                >
                  Choose up to 3 concerns · {selectedConcerns.length}/3 selected
                </span>
              </div>
              <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-cocoa-900 mt-1">
                What would you like your skincare routine to help with?
              </h2>
              <p className="text-xs sm:text-sm text-cocoa-500 mt-1 leading-relaxed whitespace-nowrap">
                Choose up to 3 concerns. Pick the ones that matter most to you.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {CONCERNS.map((c) => {
                const isSelected = selectedConcerns.includes(c.id);
                const isMaxReached = selectedConcerns.length >= 3 && !isSelected;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleConcern(c.id)}
                    className={`p-4 rounded-2xl text-left border transition-all ${
                      isSelected
                        ? 'bg-lavender-50/90 border-lavender-400 ring-1 ring-lavender-400 shadow-2xs'
                        : isMaxReached
                        ? 'bg-white/60 border-cream-200/70 opacity-75 hover:opacity-100 hover:border-cream-300 hover:bg-cream-50 cursor-pointer'
                        : 'bg-white/80 border-cream-200 hover:border-cream-300 hover:bg-cream-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-cocoa-900">{c.label}</span>
                      {isSelected && <Check className="w-4 h-4 text-lavender-700 stroke-[3]" />}
                    </div>
                    <p className="text-xs text-cocoa-500 mt-1.5 leading-relaxed">{c.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Skin Reactivity & Ingredient Experience */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fade-in">
            {/* Question A: How easily does your skin react? */}
            <div className="space-y-3">
              <div>
                <span className="text-xs uppercase tracking-widest text-rose-600 font-semibold">
                  Skin Reactivity
                </span>
                <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-cocoa-900 mt-1">
                  How does your skin usually react to skincare products?
                </h2>
                <p className="text-xs sm:text-sm text-cocoa-500 mt-1 leading-relaxed">
                  Choose the option that feels closest to your experience. This isn't a diagnosis.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setSkinReactivity('rarely');
                    setSensitive(false);
                  }}
                  className={`p-4 rounded-2xl text-left border transition-all ${
                    skinReactivity === 'rarely'
                      ? 'bg-lavender-50/90 border-lavender-400 ring-1 ring-lavender-400 shadow-2xs'
                      : 'bg-white/80 border-cream-200 hover:border-cream-300 hover:bg-cream-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-cocoa-900">Rarely reacts</span>
                    {skinReactivity === 'rarely' && <Check className="w-4 h-4 text-lavender-700 stroke-[3]" />}
                  </div>
                  <p className="text-xs text-cocoa-500 mt-1.5 leading-relaxed">
                    Most products feel comfortable on my skin.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSkinReactivity('sometimes');
                    setSensitive(true);
                  }}
                  className={`p-4 rounded-2xl text-left border transition-all ${
                    skinReactivity === 'sometimes'
                      ? 'bg-lavender-50/90 border-lavender-400 ring-1 ring-lavender-400 shadow-2xs'
                      : 'bg-white/80 border-cream-200 hover:border-cream-300 hover:bg-cream-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-cocoa-900">Sometimes reacts</span>
                    {skinReactivity === 'sometimes' && <Check className="w-4 h-4 text-lavender-700 stroke-[3]" />}
                  </div>
                  <p className="text-xs text-cocoa-500 mt-1.5 leading-relaxed">
                    Certain products cause irritation or redness.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSkinReactivity('easily');
                    setSensitive(true);
                  }}
                  className={`p-4 rounded-2xl text-left border transition-all ${
                    skinReactivity === 'easily'
                      ? 'bg-lavender-50/90 border-lavender-400 ring-1 ring-lavender-400 shadow-2xs'
                      : 'bg-white/80 border-cream-200 hover:border-cream-300 hover:bg-cream-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-cocoa-900">Reacts easily</span>
                    {skinReactivity === 'easily' && <Check className="w-4 h-4 text-lavender-700 stroke-[3]" />}
                  </div>
                  <p className="text-xs text-cocoa-500 mt-1.5 leading-relaxed">
                    My skin frequently feels irritated or uncomfortable.
                  </p>
                </button>
              </div>
            </div>

            {/* Question B: Active Ingredient Familiarity */}
            <div className="pt-2 border-t border-cream-100 space-y-3">
              <div>
                <span className="text-xs uppercase tracking-widest text-rose-600 font-semibold">
                  Ingredient Experience
                </span>
                <h3 className="font-editorial text-xl sm:text-2xl font-semibold text-cocoa-900 mt-1">
                  How familiar are you with skincare ingredients like retinol and exfoliating acids?
                </h3>
                <p className="text-xs sm:text-sm text-cocoa-500 mt-1 leading-relaxed">
                  Helps pace your active introduction and weekly routine cadence.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {([
                  {
                    id: 'beginner',
                    label: 'Beginner',
                    desc: "I've never used them or have very little experience.",
                  },
                  {
                    id: 'intermediate',
                    label: 'Some experience',
                    desc: "I've used them occasionally.",
                  },
                  {
                    id: 'experienced',
                    label: 'Experienced',
                    desc: 'I use them regularly and generally tolerate them.',
                  },
                ] as const).map((exp) => (
                  <button
                    key={exp.id}
                    type="button"
                    onClick={() => setExperience(exp.id)}
                    className={`p-4 rounded-2xl text-left border transition-all ${
                      experience === exp.id
                        ? 'bg-lavender-50/90 border-lavender-400 ring-1 ring-lavender-400 shadow-2xs'
                        : 'bg-white/80 border-cream-200 hover:border-cream-300 hover:bg-cream-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-cocoa-900">{exp.label}</span>
                      {experience === exp.id && <Check className="w-4 h-4 text-lavender-700 stroke-[3]" />}
                    </div>
                    <p className="text-xs text-cocoa-500 mt-1.5 leading-relaxed">{exp.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Excluded Ingredients */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <span className="text-xs uppercase tracking-widest text-rose-600 font-semibold">
                Exclusions
              </span>
              <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-cocoa-900 mt-1">
                Are there any ingredients you prefer to avoid?
              </h2>
              <p className="text-xs sm:text-sm text-cocoa-500 mt-1 leading-relaxed">
                Select ingredients you already know you want to avoid. We'll exclude them from your suggested routine where possible.
              </p>
              <div className="mt-2 text-xs text-cocoa-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-cocoa-400 shrink-0" />
                <span>Exclusion is based on your preference and does not replace clinical allergy diagnosis.</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {commonAvoidableIngredients.map((item) => {
                const isSelected = excludedIngredients.includes(item.id);
                const isExpanded = expandedIngredients.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition-all text-left flex flex-col justify-between ${
                      isSelected
                        ? 'bg-lavender-50/90 border-lavender-400 ring-1 ring-lavender-400 shadow-2xs'
                        : 'bg-white/80 border-cream-200 hover:border-cream-300 hover:bg-cream-50'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleExcluded(item.id)}
                      className="cursor-pointer focus:outline-none flex-1 text-left w-full"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-cocoa-900">{item.label}</span>
                        {isSelected && <Check className="w-4 h-4 text-lavender-700 stroke-[3]" />}
                      </div>
                      <p className="text-xs text-cocoa-500 mt-1.5 leading-relaxed">{item.desc}</p>
                    </button>

                    <div className="mt-3 pt-2.5 border-t border-cream-100/90">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpandedIngredient(item.id);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-medium text-lavender-700 hover:text-lavender-900 focus:outline-none transition-colors cursor-pointer"
                        aria-expanded={isExpanded}
                      >
                        <span>{isExpanded ? 'Hide details' : 'Learn more'}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-2.5 p-3 rounded-xl bg-white/95 border border-cream-200/90 text-xs space-y-2 animate-fade-in shadow-2xs">
                          <div>
                            <span className="font-semibold text-cocoa-900 block text-[11px] uppercase tracking-wider mb-0.5">
                              Why people avoid it
                            </span>
                            <p className="text-cocoa-600 leading-relaxed text-[11.5px]">
                              {item.preferenceReasons}
                            </p>
                          </div>
                          <div className="pt-2 border-t border-cream-100">
                            <span className="font-semibold text-amber-900 block text-[11px] uppercase tracking-wider mb-0.5">
                              Allergy & Intolerance note
                            </span>
                            <p className="text-amber-800 leading-relaxed text-[11.5px]">
                              {item.allergyNote}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 4: Profile Review & Health Advisories */}
        {currentStep === 4 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <span className="text-xs uppercase tracking-widest text-rose-600 font-semibold">
                Profile Confirmation
              </span>
              <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-cocoa-900 mt-1">
                Review your skin parameters
              </h2>
              <p className="text-xs sm:text-sm text-cocoa-500 mt-1 leading-relaxed">
                Review your profile before we formulate your customized morning and evening routine.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(0)}
                className="p-4 rounded-2xl text-left border bg-white/80 border-cream-200 hover:border-cream-300 hover:bg-cream-50 transition-all cursor-pointer group"
                title="Click to edit skin type"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-semibold text-rose-600">Skin Type</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-lavender-700 bg-lavender-50 px-2 py-0.5 rounded-full border border-lavender-200">
                    <Check className="w-3 h-3 text-lavender-600" />
                    Confirmed
                  </span>
                </div>
                <div className="font-semibold text-sm text-cocoa-900 mt-1.5 capitalize">
                  {skinType ? SKIN_TYPES.find((st) => st.type === skinType)?.label || skinType : 'Balanced / Normal'}
                </div>
                <p className="text-xs text-cocoa-500 mt-1 leading-relaxed">
                  {SKIN_TYPES.find((st) => st.type === skinType)?.desc || 'Baseline sebum and hydration profile.'}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="p-4 rounded-2xl text-left border bg-white/80 border-cream-200 hover:border-cream-300 hover:bg-cream-50 transition-all cursor-pointer group"
                title="Click to edit skincare goals"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-semibold text-rose-600">Focus Areas</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-lavender-700 bg-lavender-50 px-2 py-0.5 rounded-full border border-lavender-200">
                    {selectedConcerns.length} Selected
                  </span>
                </div>
                <div className="font-semibold text-sm text-cocoa-900 mt-1.5">
                  {selectedConcerns.length > 0
                    ? selectedConcerns
                        .map((c) => CONCERNS.find((co) => co.id === c)?.label || c.replace('-', ' '))
                        .join(', ')
                    : 'General Skin Maintenance'}
                </div>
                <p className="text-xs text-cocoa-500 mt-1 leading-relaxed">
                  Targeted concerns calibrating active ingredients & barrier repair.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="p-4 rounded-2xl text-left border bg-white/80 border-cream-200 hover:border-cream-300 hover:bg-cream-50 transition-all cursor-pointer group"
                title="Click to edit reactivity & experience"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-semibold text-rose-600">Reactivity & Experience</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-lavender-700 bg-lavender-50 px-2 py-0.5 rounded-full border border-lavender-200 capitalize">
                    {experience === 'intermediate' ? 'Some experience' : experience}
                  </span>
                </div>
                <div className="font-semibold text-sm text-cocoa-900 mt-1.5 capitalize">
                  {skinReactivity === 'rarely'
                    ? 'Rarely Reacts'
                    : skinReactivity === 'sometimes'
                    ? 'Sometimes Reacts'
                    : 'Reacts Easily'}
                </div>
                <p className="text-xs text-cocoa-500 mt-1 leading-relaxed">
                  {skinReactivity === 'easily'
                    ? 'Ultra-gentle active pacing prioritizing barrier protection.'
                    : skinReactivity === 'sometimes'
                    ? 'Gentle pacing defaults applied to avoid unnecessary barrier stress.'
                    : 'Standard introductory progression for tolerated OTC actives.'}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="p-4 rounded-2xl text-left border bg-white/80 border-cream-200 hover:border-cream-300 hover:bg-cream-50 transition-all cursor-pointer group"
                title="Click to edit exclusions"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-semibold text-rose-600">Excluded Ingredients</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-lavender-700 bg-lavender-50 px-2 py-0.5 rounded-full border border-lavender-200">
                    {excludedIngredients.length > 0 ? `${excludedIngredients.length} Excluded` : 'None'}
                  </span>
                </div>
                <div className="font-semibold text-sm text-cocoa-900 mt-1.5">
                  {excludedIngredients.length > 0
                    ? excludedIngredients
                        .map((id) => commonAvoidableIngredients.find((i) => i.id === id)?.label || id)
                        .join(', ')
                    : 'None specified'}
                </div>
                <p className="text-xs text-cocoa-500 mt-1 leading-relaxed">
                  Strictly omitted from your daily and weekly routine formulations.
                </p>
              </button>
            </div>

            {/* Pregnancy / Nursing Advisory Confirmation Card */}
            <button
              type="button"
              onClick={() => setPregnancyOrNursing(!pregnancyOrNursing)}
              className={`w-full p-4 rounded-2xl text-left border transition-all cursor-pointer ${
                pregnancyOrNursing
                  ? 'bg-lavender-50/90 border-lavender-400 ring-1 ring-lavender-400 shadow-2xs'
                  : 'bg-white/80 border-cream-200 hover:border-cream-300 hover:bg-cream-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-cocoa-900">
                  Pregnancy & Nursing Safety Filter
                </span>
                {pregnancyOrNursing && <Check className="w-4 h-4 text-lavender-700 stroke-[3]" />}
              </div>
              <p className="text-xs text-cocoa-500 mt-1.5 leading-relaxed">
                I am currently pregnant, planning a pregnancy, or breastfeeding (applies retinoid advisories across all views).
              </p>
            </button>
          </div>
        )}

        {/* Step 5: Ritual Ready Celebration & Google Sign-In */}
        {currentStep === 5 && (
          <div className="space-y-6 animate-fade-in text-center">
            {/* Header / Celebration */}
            <div className="space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-100 text-rose-600 mb-1 shadow-2xs">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-widest text-rose-600 font-semibold">
                  Personal Ritual Ready
                </span>
                <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-cocoa-900 mt-1">
                  Your Personal Skin Ritual is Ready
                </h2>
                <p className="text-xs sm:text-sm text-cocoa-500 max-w-md mx-auto mt-1 leading-relaxed">
                  We’ve analyzed your profile and built a science-backed morning and evening routine tailored to your skin barrier.
                </p>
              </div>
            </div>

            {/* Ritual Calibration Summary */}
            <div className="p-5 rounded-3xl bg-cream-50/80 border border-cream-200/80 space-y-4 text-left">
              <div className="flex items-center justify-between pb-3 border-b border-cream-200/60">
                <span className="text-xs font-semibold text-cocoa-800 uppercase tracking-wider">
                  Calibrated For You
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-lavender-700 bg-lavender-50 px-2.5 py-0.5 rounded-full border border-lavender-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-lavender-600" />
                  Verified Conflict-Free
                </span>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-rose-100/70 text-rose-900 border border-rose-200/70 capitalize">
                  🌸 {skinType} Skin
                </span>
                {selectedConcerns.map((c) => (
                  <span
                    key={c}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-lavender-100/70 text-lavender-900 border border-lavender-200/70 capitalize"
                  >
                    🎯 {c.replace('-', ' ')}
                  </span>
                ))}
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-lavender-100/70 text-lavender-900 border border-lavender-200/70">
                  {skinReactivity === 'easily'
                    ? '🌿 Ultra-Gentle Barrier Pace'
                    : skinReactivity === 'sometimes'
                    ? '🌿 Sensitive Planning Mode'
                    : '⚡ Standard Active Cadence'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-cream-200/70 text-cocoa-800 border border-cream-300/70 capitalize">
                  {experience === 'intermediate' ? 'Some' : experience} Experience
                </span>
                {pregnancyOrNursing && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100/80 text-amber-900 border border-amber-200/80">
                    🤰 Retinoid-Safe Filter Active
                  </span>
                )}
              </div>

              {/* Ritual Features */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-left">
                <div className="p-4 rounded-2xl bg-white/80 border border-cream-200 hover:border-cream-300 hover:bg-cream-50 text-xs transition-all">
                  <div className="flex items-center gap-1.5 font-semibold text-cocoa-900 mb-1">
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>AM Defense</span>
                  </div>
                  <p className="text-xs text-cocoa-500 leading-relaxed">
                    Hydration, antioxidant protection & UV barrier
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white/80 border border-cream-200 hover:border-cream-300 hover:bg-cream-50 text-xs transition-all">
                  <div className="flex items-center gap-1.5 font-semibold text-cocoa-900 mb-1">
                    <Moon className="w-4 h-4 text-lavender-600" />
                    <span>PM Recovery</span>
                  </div>
                  <p className="text-xs text-cocoa-500 leading-relaxed">
                    Targeted active treatment & lipid barrier renewal
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white/80 border border-cream-200 hover:border-cream-300 hover:bg-cream-50 text-xs transition-all">
                  <div className="flex items-center gap-1.5 font-semibold text-cocoa-900 mb-1">
                    <Calendar className="w-4 h-4 text-rose-500" />
                    <span>Weekly Cadence</span>
                  </div>
                  <p className="text-xs text-cocoa-500 leading-relaxed">
                    Rest nights & alternating active cycling
                  </p>
                </div>
              </div>
            </div>

            {/* Google Sign-In Card */}
            <div className="p-6 rounded-3xl bg-white/80 border border-cream-200/90 shadow-2xs space-y-4 text-center">
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 text-xs text-cocoa-700">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="" className="w-6 h-6 rounded-full" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-rose-200 text-rose-800 text-[11px] font-bold flex items-center justify-center">
                        {(user.displayName || user.email || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    <span>
                      Signed in as <strong className="text-cocoa-900">{user.displayName || user.email}</strong>
                    </span>
                  </div>
                  <p className="text-xs text-cocoa-500">
                    Your personalized skin ritual will be securely saved to your account.
                  </p>
                  <button
                    type="button"
                    onClick={handleCompleteSignedIn}
                    className="w-full btn-primary text-sm py-3 justify-center shadow-xs cursor-pointer"
                  >
                    <span>Unlock & View My Routine</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-cocoa-800">
                    <Lock className="w-3.5 h-3.5 text-rose-500" />
                    <span>Sign in with Google to unlock your routine</span>
                  </div>
                  <p className="text-xs text-cocoa-500 max-w-sm mx-auto leading-relaxed">
                    Connecting your Google account securely saves your custom schedule, shelf products, and skin progress across all your devices.
                  </p>

                  {authError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs text-left flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <span>{authError}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={authLoading}
                    className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-2xl bg-white border border-cream-300 text-cocoa-900 font-medium shadow-2xs hover:bg-cream-50 hover:border-cream-400 hover:shadow-xs transition-all disabled:opacity-60 cursor-pointer text-sm"
                  >
                    {authLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                        <span>Connecting with Google...</span>
                      </>
                    ) : (
                      <>
                        <GoogleIcon />
                        <span>Sign in with Google</span>
                      </>
                    )}
                  </button>

                  {!isFirebaseConfigured() && (
                    <button
                      type="button"
                      onClick={handleDevBypass}
                      className="text-xs text-cocoa-500 underline hover:text-cocoa-800 pt-1 block mx-auto cursor-pointer"
                    >
                      Firebase keys not configured — Continue in local mode
                    </button>
                  )}

                  <p className="text-[11px] text-cocoa-400">
                    Secure authentication via Google Firebase • Zero spam
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-cream-100">
          <button
            type="button"
            onClick={handleBack}
            className="btn-ghost text-xs"
          >
            Back
          </button>
          {currentStep < totalSteps - 1 && (
            <button
              type="button"
              onClick={handleNext}
              disabled={currentStep === 0 && !skinType}
              className="btn-primary text-xs px-6 py-2.5 disabled:opacity-50 disabled:pointer-events-none"
            >
              <span>
                {currentStep === 0 && !skinType
                  ? 'Select Skin Type'
                  : currentStep === totalSteps - 2
                  ? 'Generate My Ritual'
                  : 'Continue'}
              </span>
              {currentStep === totalSteps - 2 ? (
                <Sparkles className="w-4 h-4 text-rose-200" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Skin Type Identification Modal */}
      <Modal
        isOpen={isSkinGuideOpen}
        onClose={() => setIsSkinGuideOpen(false)}
        title="Identifying Your Skin Type"
        maxWidth="xl"
      >
        <div className="space-y-3 text-cocoa-800 text-xs sm:text-[13px] leading-relaxed">
          {/* Bare-Face Test */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/90 space-y-1.5">
            <h4 className="font-semibold text-sm text-cocoa-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-lavender-700 shrink-0" />
              The Bare-Face Observation Test (30–60 Minutes)
            </h4>
            <p className="text-cocoa-600 text-xs">
              Wash your face with a gentle, non-stripping cleanser and gently pat dry. Leave your skin completely bare without any serums, toners, or moisturisers for 30–60 minutes, then check how it feels:
            </p>
            <ul className="space-y-1 pt-0.5 text-xs text-cocoa-700">
              <li className="flex items-start gap-1.5">
                <span className="font-semibold text-cocoa-900 shrink-0">Balanced / Normal:</span>
                <span>Feels comfortable, supple, and smooth with no taut tightness or greasy shine.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="font-semibold text-cocoa-900 shrink-0">Dry:</span>
                <span>Feels tight, parched, or rough, especially when smiling; may show flakiness.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="font-semibold text-cocoa-900 shrink-0">Oily:</span>
                <span>Looks visibly shiny and feels slick with excess sebum all across the face.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="font-semibold text-cocoa-900 shrink-0">Combination:</span>
                <span>Produces shine along the T-zone (forehead, nose, chin), while cheeks remain normal or dry.</span>
              </li>
            </ul>
          </div>

          {/* Skin Type vs Temporary Skin Condition */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-lavender-50/80 border border-lavender-200/90 space-y-1.5">
            <h4 className="font-semibold text-sm text-cocoa-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-lavender-700 shrink-0" />
              Skin Type vs. Temporary Skin Conditions
            </h4>
            <p className="text-cocoa-700 text-xs">
              It is easy to confuse your baseline <strong>skin type</strong> with temporary <strong>skin conditions</strong>:
            </p>
            <ul className="space-y-1.5 text-xs text-cocoa-700">
              <li className="flex items-start gap-1.5">
                <span className="font-bold text-lavender-800 shrink-0">•</span>
                <span>
                  <strong>Skin Type:</strong> Your genetic baseline for natural sebum (oil) production.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="font-bold text-lavender-800 shrink-0">•</span>
                <span>
                  <strong>Dehydration is a condition, not a type:</strong> Dehydrated skin lacks <em>water</em>, while dry skin lacks <em>oil</em>. For instance, oily skin can still experience dehydration if the skin barrier is stressed, feeling tight or flaky while simultaneously producing excess sebum to protect itself.
                </span>
              </li>
            </ul>
          </div>

          {/* Not a Diagnosis Notice */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/90 flex items-start gap-2.5 text-xs text-amber-950">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Skin type is not a medical diagnosis</span>
              <p className="text-amber-800 leading-relaxed text-xs">
                Your skin is dynamic, not permanent. It naturally adapts and changes over time with shifting seasons, weather, humidity, hormonal cycles, age, and lifestyle. You can always update your skin profile in Settings as your skin evolves.
              </p>
            </div>
          </div>

          {/* Back to Quiz Action */}
          <div className="pt-1 flex justify-end">
            <button
              type="button"
              onClick={() => setIsSkinGuideOpen(false)}
              className="px-5 py-2 rounded-full text-xs font-semibold bg-cocoa-900 text-white hover:bg-cocoa-800 transition-colors shadow-2xs"
            >
              Back to Quiz
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

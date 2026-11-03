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
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { SkinType, SkinConcern } from '../types';
import {
  SensitiveToggleDisclaimer,
  ExcludedIngredientsDisclaimer,
} from '../components/safety/SafetyNotices';
import { signInWithGoogleService } from '../services/auth';
import { isFirebaseConfigured } from '../services/firebase';

const SKIN_TYPES: { type: SkinType; label: string; desc: string }[] = [
  {
    type: 'normal',
    label: 'Balanced / Normal',
    desc: 'Neither too oily nor overly dry. Generally tolerates most active ingredients well.',
  },
  {
    type: 'dry',
    label: 'Dry',
    desc: 'Prone to tightness, flakiness, or lack of natural sebum. Needs hydrating humectants and barrier lipids.',
  },
  {
    type: 'oily',
    label: 'Oily',
    desc: 'Excess sebum across the face. Benefits from gentle cleansing, BHA, and lightweight hydrators.',
  },
  {
    type: 'combination',
    label: 'Combination',
    desc: 'Oily T-zone (forehead, nose, chin) with normal or dry cheeks. Requires balanced layering.',
  },
];

const CONCERNS: { id: SkinConcern; label: string; desc: string }[] = [
  { id: 'acne', label: 'Blemishes & Breakouts', desc: 'Active pimples, blackheads, or clogged pores.' },
  { id: 'barrier', label: 'Barrier Support', desc: 'Sensitized, tight, or compromised moisture barrier.' },
  { id: 'hyperpigmentation', label: 'Uneven Tone & Dark Spots', desc: 'Post-acne marks or sun-induced discoloration.' },
  { id: 'aging', label: 'Fine Lines & Firmness', desc: 'Early signs of expression lines or loss of elasticity.' },
  { id: 'texture', label: 'Rough Texture', desc: 'Uneven skin feel requiring gentle chemical exfoliation.' },
  { id: 'redness', label: 'Redness & Irritation', desc: 'Easily flushed or reactive complexion.' },
  { id: 'dullness', label: 'Dullness & Glow', desc: 'Lack of radiance, tired or fatigued appearance.' },
  { id: 'dryness', label: 'Dehydration', desc: 'Skin that feels perpetually thirsty and tight.' },
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

  const commonAvoidableIngredients = [
    { id: 'retinol', label: 'Retinol' },
    { id: 'benzoyl-peroxide', label: 'Benzoyl Peroxide' },
    { id: 'salicylic-acid', label: 'Salicylic Acid (BHA)' },
    { id: 'glycolic-acid', label: 'Glycolic Acid (AHA)' },
    { id: 'colloidal-oatmeal', label: 'Colloidal Oatmeal (Oat allergy)' },
    { id: 'sulfur', label: 'Sulfur' },
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
                How would you describe your skin?
              </h2>
              <p className="text-xs sm:text-sm text-cocoa-500 mt-1">
                Your general skin type helps calibrate hydration and texture preferences.
              </p>
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
                        ? 'bg-rose-50/80 border-rose-400 ring-1 ring-rose-400 shadow-2xs'
                        : 'bg-white/80 border-cream-200 hover:border-cream-300 hover:bg-cream-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-cocoa-900">{st.label}</span>
                      {isSelected && <Check className="w-4 h-4 text-rose-600 stroke-[3]" />}
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
              <span className="text-xs uppercase tracking-widest text-sage-600 font-semibold">
                Goals
              </span>
              <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-cocoa-900 mt-1">
                What are your main skincare focuses?
              </h2>
              <p className="text-xs sm:text-sm text-cocoa-500 mt-1">
                Select up to 3 concerns you would like your routine to target.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {CONCERNS.map((c) => {
                const isSelected = selectedConcerns.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleConcern(c.id)}
                    className={`p-3.5 rounded-2xl text-left border transition-all ${
                      isSelected
                        ? 'bg-sage-50/80 border-sage-400 ring-1 ring-sage-400 shadow-2xs'
                        : 'bg-white/80 border-cream-200 hover:border-cream-300 hover:bg-cream-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-cocoa-900">{c.label}</span>
                      {isSelected && <Check className="w-4 h-4 text-sage-600 stroke-[3]" />}
                    </div>
                    <p className="text-xs text-cocoa-500 mt-1">{c.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Skin Sensitivity */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <span className="text-xs uppercase tracking-widest text-lavender-600 font-semibold">
                Tolerability
              </span>
              <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-cocoa-900 mt-1">
                Does your skin lean sensitive?
              </h2>
              <p className="text-xs sm:text-sm text-cocoa-500 mt-1">
                Enabling sensitive mode automatically applies conservative frequency defaults (e.g. fewer active nights per week).
              </p>
            </div>

            <div className="p-4 rounded-3xl bg-cream-50 border border-cream-200 space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="font-semibold text-sm text-cocoa-900">
                    Apply gentle/sensitive planning defaults
                  </span>
                  <SensitiveToggleDisclaimer />
                </div>
                <input
                  type="checkbox"
                  checked={sensitive}
                  onChange={(e) => setSensitive(e.target.checked)}
                  className="w-5 h-5 rounded text-rose-500 focus:ring-rose-400 border-cream-300"
                />
              </label>
            </div>

            {/* Experience level */}
            <div className="pt-3">
              <label className="block text-xs font-semibold text-cocoa-800 mb-2">
                Your familiarity with active ingredients:
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {([
                  { id: 'beginner', label: 'Beginner', desc: 'New to acids & retinoids' },
                  { id: 'intermediate', label: 'Familiar', desc: 'Uses actives 2-3x/week' },
                  { id: 'experienced', label: 'Experienced', desc: 'Established tolerance' },
                ] as const).map((exp) => (
                  <button
                    key={exp.id}
                    type="button"
                    onClick={() => setExperience(exp.id)}
                    className={`p-3 rounded-2xl text-center border transition-all ${
                      experience === exp.id
                        ? 'bg-rose-50 border-rose-300 text-rose-950 font-medium'
                        : 'bg-white border-cream-200 text-cocoa-600 hover:bg-cream-50'
                    }`}
                  >
                    <div className="text-xs font-semibold">{exp.label}</div>
                    <div className="text-[10px] text-cocoa-400 mt-0.5">{exp.desc}</div>
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
              <ExcludedIngredientsDisclaimer />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              {commonAvoidableIngredients.map((item) => {
                const isSelected = excludedIngredients.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleExcluded(item.id)}
                    className={`p-3 rounded-2xl text-left border flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-rose-50 border-rose-300 text-rose-900 font-medium'
                        : 'bg-white border-cream-200 text-cocoa-700 hover:bg-cream-50'
                    }`}
                  >
                    <span className="text-xs font-medium">{item.label}</span>
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center border text-[10px] ${
                        isSelected ? 'bg-rose-500 border-rose-500 text-white' : 'border-cocoa-300'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 4: Profile Review & Health Advisories */}
        {currentStep === 4 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <span className="text-xs uppercase tracking-widest text-sage-600 font-semibold">
                Profile Confirmation
              </span>
              <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-cocoa-900 mt-1">
                Review your skin parameters
              </h2>
              <p className="text-xs sm:text-sm text-cocoa-500 mt-1">
                Review your profile before we formulate your customized morning and evening routine.
              </p>
            </div>

            <div className="p-4 rounded-3xl bg-cream-50 border border-cream-200 space-y-3">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-cream-200">
                <span className="text-cocoa-500">Skin Type</span>
                <span className="font-semibold text-cocoa-900 capitalize">{skinType}</span>
              </div>
              <div className="flex items-center justify-between text-xs pb-2 border-b border-cream-200">
                <span className="text-cocoa-500">Focus Areas</span>
                <span className="font-semibold text-cocoa-900">
                  {selectedConcerns.map((c) => c.replace('-', ' ')).join(', ')}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pb-2 border-b border-cream-200">
                <span className="text-cocoa-500">Sensitivity Preference</span>
                <span className="font-semibold text-cocoa-900">
                  {sensitive ? 'Gentle Planning Defaults' : 'Standard OTC Defaults'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-cocoa-500">Excluded Ingredients</span>
                <span className="font-semibold text-cocoa-900">
                  {excludedIngredients.length > 0
                    ? excludedIngredients.join(', ')
                    : 'None specified'}
                </span>
              </div>
            </div>

            {/* Pregnancy / Nursing Advisory Confirmation */}
            <div className="p-3.5 rounded-2xl bg-lavender-50/70 border border-lavender-200">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pregnancyOrNursing}
                  onChange={(e) => setPregnancyOrNursing(e.target.checked)}
                  className="w-4 h-4 rounded text-lavender-600 focus:ring-lavender-400 border-cream-300 mt-0.5"
                />
                <span className="text-xs text-lavender-900 leading-relaxed">
                  I am currently pregnant, planning a pregnancy, or breastfeeding (applies retinoid advisories across all views).
                </span>
              </label>
            </div>
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
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-sage-700 bg-sage-50 px-2.5 py-0.5 rounded-full border border-sage-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-sage-600" />
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
                    className="px-3 py-1 rounded-full text-xs font-medium bg-sage-100/70 text-sage-900 border border-sage-200/70 capitalize"
                  >
                    🎯 {c.replace('-', ' ')}
                  </span>
                ))}
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-lavender-100/70 text-lavender-900 border border-lavender-200/70">
                  {sensitive ? '🌿 Sensitive Planning Mode' : '⚡ Standard Active Cadence'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-cream-200/70 text-cocoa-800 border border-cream-300/70 capitalize">
                  {experience} Experience
                </span>
                {pregnancyOrNursing && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100/80 text-amber-900 border border-amber-200/80">
                    🤰 Retinoid-Safe Filter Active
                  </span>
                )}
              </div>

              {/* Ritual Features */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 text-left">
                <div className="p-3 rounded-2xl bg-white/70 border border-cream-200 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-cocoa-900 mb-0.5">
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>AM Defense</span>
                  </div>
                  <p className="text-[11px] text-cocoa-500 leading-snug">
                    Hydration, antioxidant protection & UV barrier
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-white/70 border border-cream-200 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-cocoa-900 mb-0.5">
                    <Moon className="w-3.5 h-3.5 text-lavender-600" />
                    <span>PM Recovery</span>
                  </div>
                  <p className="text-[11px] text-cocoa-500 leading-snug">
                    Targeted active treatment & lipid barrier renewal
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-white/70 border border-cream-200 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-cocoa-900 mb-0.5">
                    <Calendar className="w-3.5 h-3.5 text-rose-500" />
                    <span>Weekly Cadence</span>
                  </div>
                  <p className="text-[11px] text-cocoa-500 leading-snug">
                    Rest nights & alternating active cycling
                  </p>
                </div>
              </div>
            </div>

            {/* Google Sign-In Card */}
            <div className="p-5 rounded-3xl bg-rose-50/50 border border-rose-200/80 space-y-3.5 text-center">
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
    </div>
  );
};

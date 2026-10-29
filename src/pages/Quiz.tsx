import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { SkinType, SkinConcern } from '../types';
import {
  SensitiveToggleDisclaimer,
  ExcludedIngredientsDisclaimer,
} from '../components/safety/SafetyNotices';

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

export const Quiz: React.FC = () => {
  const navigate = useNavigate();
  const profile = useStore((state) => state.profile);
  const updateProfile = useStore((state) => state.updateProfile);

  const [currentStep, setCurrentStep] = useState(0);
  const [skinType, setSkinType] = useState<SkinType>(profile.skinType || 'combination');
  const [selectedConcerns, setSelectedConcerns] = useState<SkinConcern[]>(profile.concerns || ['acne', 'barrier']);
  const [sensitive, setSensitive] = useState<boolean>(profile.sensitive || false);
  const [experience, setExperience] = useState<'beginner' | 'intermediate' | 'experienced'>(
    profile.experienceLevel || 'beginner'
  );
  const [excludedIngredients, setExcludedIngredients] = useState<string[]>(
    profile.excludedIngredients || []
  );
  const [pregnancyOrNursing, setPregnancyOrNursing] = useState<boolean>(
    profile.pregnancyOrNursing || false
  );

  const commonAvoidableIngredients = [
    { id: 'retinol', label: 'Retinol' },
    { id: 'benzoyl-peroxide', label: 'Benzoyl Peroxide' },
    { id: 'salicylic-acid', label: 'Salicylic Acid (BHA)' },
    { id: 'glycolic-acid', label: 'Glycolic Acid (AHA)' },
    { id: 'colloidal-oatmeal', label: 'Colloidal Oatmeal (Oat allergy)' },
    { id: 'sulfur', label: 'Sulfur' },
  ];

  const totalSteps = 5;

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
    } else {
      // Save and complete
      updateProfile({
        skinType,
        concerns: selectedConcerns,
        sensitive,
        experienceLevel: experience,
        excludedIngredients,
        pregnancyOrNursing,
        isOnboarded: true,
      });
      navigate('/today');
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/welcome');
    }
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
          <span>Step {currentStep + 1} of {totalSteps}</span>
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
                {[
                  { id: 'beginner', label: 'Beginner', desc: 'New to acids & retinoids' },
                  { id: 'intermediate', label: 'Familiar', desc: 'Uses actives 2-3x/week' },
                  { id: 'experienced', label: 'Experienced', desc: 'Established tolerance' },
                ].map((exp) => (
                  <button
                    key={exp.id}
                    type="button"
                    onClick={() => setExperience(exp.id as any)}
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

        {/* Step 4: Safety & Review */}
        {currentStep === 4 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <span className="text-xs uppercase tracking-widest text-sage-600 font-semibold">
                Profile Summary
              </span>
              <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-cocoa-900 mt-1">
                Your personalized skin profile
              </h2>
              <p className="text-xs sm:text-sm text-cocoa-500 mt-1">
                Review your profile before we build your routines and weekly calendar.
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

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-cream-100">
          <button
            type="button"
            onClick={handleBack}
            className="btn-ghost text-xs"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="btn-primary text-xs px-6 py-2.5"
          >
            <span>{currentStep === totalSteps - 1 ? 'Complete Setup' : 'Continue'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

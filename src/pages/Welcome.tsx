import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Layers,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { BottleIllustration, BotanicalTwig } from '../components/skincare/SkincareIllustrations';

export const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const isOnboarded = useStore((state) => state.profile.isOnboarded);
  const loadSampleData = useStore((state) => state.loadSampleData);

  const handleStart = () => {
    if (isOnboarded) {
      navigate('/today');
    } else {
      navigate('/quiz');
    }
  };

  const handleDemo = () => {
    loadSampleData();
    navigate('/today');
  };

  return (
    <div className="relative overflow-hidden py-8 sm:py-16">
      {/* Editorial Decorative Background Elements */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-rose-200/25 blur-3xl rounded-full pointer-events-none -z-10" />
      <div className="absolute top-48 right-10 w-[400px] h-[300px] bg-sage-200/20 blur-3xl rounded-full pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto text-center px-4 space-y-8">
        {/* Subtle pill tag */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cream-100 border border-cream-200 text-cocoa-700 text-xs font-medium tracking-wide">
          <BotanicalTwig className="w-4 h-4 text-sage-600" />
          <span>Mindful Skincare Companion</span>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          <span className="text-cocoa-500">Portfolio Edition</span>
        </div>

        {/* Editorial Headline */}
        <div className="space-y-4">
          <h1 className="font-editorial text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-cocoa-900 leading-[1.1]">
            Build your personal <br className="hidden sm:inline" />
            <span className="italic font-normal text-rose-600">skincare ritual</span> with calm clarity.
          </h1>
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-cocoa-600 leading-relaxed font-light">
            An educational routine organiser that decodes ingredient compatibility, spaces potent actives safely across your week, and tracks product freshness.
          </p>
        </div>

        {/* Primary Call to Action */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={handleStart}
            className="btn-primary text-sm px-8 py-3.5 shadow-rose-glow group"
          >
            <span>Start My Skin Journey</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
          <button
            onClick={handleDemo}
            className="btn-outline text-xs px-5 py-3 text-cocoa-700"
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span>Explore with Sample Shelf</span>
          </button>
        </div>

        {/* Cohesive Botanical & Skincare Bottle Illustration Display */}
        <div className="pt-8 pb-4 flex items-center justify-center gap-4 sm:gap-8 opacity-95">
          <div className="flex flex-col items-center">
            <BottleIllustration shape="tube" color="#919D85" size="lg" />
            <span className="text-[11px] font-medium text-cocoa-500 mt-2">Gentle Cleanse</span>
          </div>
          <div className="flex flex-col items-center -translate-y-3">
            <BottleIllustration shape="dropper" color="#C496A1" size="xl" />
            <span className="text-[11px] font-medium text-rose-700 mt-2">Targeted Actives</span>
          </div>
          <div className="flex flex-col items-center">
            <BottleIllustration shape="jar" color="#8E88A3" size="lg" />
            <span className="text-[11px] font-medium text-cocoa-500 mt-2">Barrier Repair</span>
          </div>
        </div>

        {/* Core Value Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-8 text-left">
          <div className="card-editorial p-6 space-y-2 card-hover">
            <div className="w-9 h-9 rounded-2xl bg-sage-100 flex items-center justify-center text-sage-800">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-editorial text-lg font-semibold text-cocoa-900">
              Evidence-Based Compatibility
            </h3>
            <p className="text-xs text-cocoa-500 leading-relaxed">
              Transparent ingredient rules backed by professional dermatology references. Learn why combinations like retinol and acids require thoughtful timing.
            </p>
          </div>

          <div className="card-editorial p-6 space-y-2 card-hover">
            <div className="w-9 h-9 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-800">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-editorial text-lg font-semibold text-cocoa-900">
              Deterministic Weekly Planner
            </h3>
            <p className="text-xs text-cocoa-500 leading-relaxed">
              No generic guesswork. Our scheduling algorithm balances active nights, prevents consecutive retinoid use, and guarantees vital PM rest nights.
            </p>
          </div>

          <div className="card-editorial p-6 space-y-2 card-hover">
            <div className="w-9 h-9 rounded-2xl bg-lavender-100 flex items-center justify-center text-lavender-800">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-editorial text-lg font-semibold text-cocoa-900">
              Shelf & Expiry Journal
            </h3>
            <p className="text-xs text-cocoa-500 leading-relaxed">
              Track Period After Opening (PAO) for all your bottles and jars. Log daily AM/PM completions, monitor skin feel, and maintain mindful streaks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

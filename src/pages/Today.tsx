import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sun,
  Moon,
  CheckCircle2,
  Circle,
  Flame,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { format } from 'date-fns';
import { useStore } from '../store/useStore';
import { useRoutineSlots } from '../hooks/useRoutineSlots';
import { useStreak } from '../hooks/useStreak';
import { useWeeklyPlan } from '../hooks/useWeeklyPlan';
import { calculateProductExpiry } from '../lib/expiry';
import { BottleIllustration } from '../components/skincare/SkincareIllustrations';
import { IrritationGuidanceNotice } from '../components/safety/SafetyNotices';
import { CheckInRecord } from '../types';

export const Today: React.FC = () => {
  const profile = useStore((state) => state.profile);
  const products = useStore((state) => state.products);
  const checkIns = useStore((state) => state.checkIns);
  const recordRoutineCheckIn = useStore((state) => state.recordRoutineCheckIn);
  const recordSkinReaction = useStore((state) => state.recordSkinReaction);

  const { slots, todayDate } = useRoutineSlots();
  const { currentStreak, isTodayAmComplete, isTodayPmComplete } = useStreak(todayDate);
  const { plan } = useWeeklyPlan();

  const todayRecord = checkIns[todayDate] || { am: false, pm: false };
  const [selectedFeel, setSelectedFeel] = useState<CheckInRecord['skinFeel']>(
    todayRecord.skinFeel || undefined
  );
  const [reactionNotes, setReactionNotes] = useState(todayRecord.notes || '');

  // Products expiring soon or expired
  const expiringProducts = products
    .map((p) => ({ product: p, expiry: calculateProductExpiry(p, todayDate) }))
    .filter((item) => item.expiry.isExpiringSoon || item.expiry.isExpired);

  const handleToggleCheckIn = (routine: 'am' | 'pm') => {
    const nextState = routine === 'am' ? !isTodayAmComplete : !isTodayPmComplete;
    recordRoutineCheckIn(todayDate, routine, nextState);

    if (nextState) {
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#C496A1', '#919D85', '#8E88A3', '#EBE1C6'],
        });
      } catch {
        // Fallback gracefully
      }
    }
  };

  const handleFeelSelect = (feel: CheckInRecord['skinFeel']) => {
    setSelectedFeel(feel);
    recordSkinReaction(todayDate, feel, reactionNotes);
  };

  const handleNotesBlur = () => {
    if (selectedFeel) {
      recordSkinReaction(todayDate, selectedFeel, reactionNotes);
    }
  };

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header & Personal Profile Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-cream-200">
        <div>
          <span className="text-xs uppercase tracking-widest text-rose-600 font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Today's Skincare Journal</span>
            <span className="text-cocoa-300">•</span>
            <span className="text-cocoa-500 font-medium">
              {format(new Date(), 'EEEE, MMMM d')}
            </span>
          </span>
          <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-cocoa-900 mt-1">
            {greeting}, beautiful.
          </h1>
        </div>

        {/* Profile Attributes Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="badge-sage capitalize font-medium">
            {profile.skinType} skin
          </span>
          {profile.sensitive && (
            <span className="badge-rose font-medium">Sensitive Mode</span>
          )}
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-cream-100 border border-cream-300 text-xs font-semibold text-cocoa-700">
            <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>{currentStreak} Day Streak</span>
          </div>
        </div>
      </div>

      {/* Plan Status Notice (if warnings or decisions exist) */}
      {plan.status === 'needs-decision' && (
        <div className="p-4 rounded-3xl bg-rose-50 border border-rose-300 flex items-start gap-3 text-xs text-rose-900">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block mb-0.5">Plan requires your decision</span>
            <p>{plan.decisions[0]?.reason}</p>
            <Link to="/week" className="underline font-semibold mt-1 inline-block text-rose-800">
              Review Week Plan →
            </Link>
          </div>
        </div>
      )}

      {/* Today's Routines: AM and PM Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Morning Routine Card */}
        <div className="card-editorial p-6 sm:p-7 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-cream-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-cream-100 flex items-center justify-center text-cream-700">
                  <Sun className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-editorial text-xl font-semibold text-cocoa-900">
                    Morning Routine
                  </h3>
                  <span className="text-[11px] text-cocoa-400">Protect & Hydrate</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleToggleCheckIn('am')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isTodayAmComplete
                    ? 'bg-sage-600 text-white shadow-2xs'
                    : 'bg-cream-100 text-cocoa-700 hover:bg-cream-200'
                }`}
              >
                {isTodayAmComplete ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    <span>Completed</span>
                  </>
                ) : (
                  <>
                    <Circle className="w-4 h-4" />
                    <span>Mark Complete</span>
                  </>
                )}
              </button>
            </div>

            {/* Morning Steps */}
            <div className="space-y-3">
              {slots.AM.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white/70 border border-cream-100 hover:bg-white transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-cream-100 text-[11px] font-bold text-cocoa-500 flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-xs sm:text-sm text-cocoa-900">
                          {item.product ? item.product.name : `Missing ${item.slot}`}
                        </span>
                        <span className="badge-cream text-[10px] capitalize">
                          {item.slot}
                        </span>
                      </div>
                      <p className="text-[11px] text-cocoa-500 font-light mt-0.5 line-clamp-1">
                        {item.guidance}
                      </p>
                    </div>
                  </div>

                  {item.product && (
                    <BottleIllustration shape={item.product.bottle} color={item.product.color} size="sm" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <Link
            to="/routine"
            className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-800 font-medium pt-2"
          >
            <span>View full AM routine steps & guidance</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Evening Routine Card */}
        <div className="card-editorial p-6 sm:p-7 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-cream-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-lavender-100 flex items-center justify-center text-lavender-700">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-editorial text-xl font-semibold text-cocoa-900">
                    Evening Routine
                  </h3>
                  <span className="text-[11px] text-cocoa-400">Repair & Reset</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleToggleCheckIn('pm')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isTodayPmComplete
                    ? 'bg-lavender-700 text-white shadow-2xs'
                    : 'bg-cream-100 text-cocoa-700 hover:bg-cream-200'
                }`}
              >
                {isTodayPmComplete ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    <span>Completed</span>
                  </>
                ) : (
                  <>
                    <Circle className="w-4 h-4" />
                    <span>Mark Complete</span>
                  </>
                )}
              </button>
            </div>

            {/* Evening Steps */}
            <div className="space-y-3">
              {slots.PM.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white/70 border border-cream-100 hover:bg-white transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-cream-100 text-[11px] font-bold text-cocoa-500 flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-xs sm:text-sm text-cocoa-900">
                          {item.product ? item.product.name : `Missing ${item.slot}`}
                        </span>
                        <span className="badge-lavender text-[10px] capitalize">
                          {item.slot}
                        </span>
                      </div>
                      <p className="text-[11px] text-cocoa-500 font-light mt-0.5 line-clamp-1">
                        {item.guidance}
                      </p>
                    </div>
                  </div>

                  {item.product && (
                    <BottleIllustration shape={item.product.bottle} color={item.product.color} size="sm" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <Link
            to="/routine"
            className="inline-flex items-center gap-1.5 text-xs text-lavender-700 hover:text-lavender-900 font-medium pt-2"
          >
            <span>View full PM routine steps & guidance</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Daily Skin Check-In & Journaling Section */}
      <div className="card-editorial p-6 sm:p-7 space-y-4">
        <div>
          <h3 className="font-editorial text-xl font-semibold text-cocoa-900">
            How does your skin feel today?
          </h3>
          <p className="text-xs text-cocoa-500">
            Tracking your skin feel over time helps identify subtle irritation early.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {[
            { id: 'great', label: 'Radiant', emoji: '✨' },
            { id: 'good', label: 'Balanced', emoji: '🌿' },
            { id: 'neutral', label: 'Normal', emoji: '☁️' },
            { id: 'tight', label: 'Dry / Tight', emoji: '💧' },
            { id: 'irritated', label: 'Irritated', emoji: '⚠️' },
          ].map((feel) => (
            <button
              key={feel.id}
              type="button"
              onClick={() => handleFeelSelect(feel.id as any)}
              className={`p-3 rounded-2xl border text-center transition-all ${
                selectedFeel === feel.id
                  ? 'bg-rose-100/80 border-rose-400 text-rose-950 font-semibold shadow-2xs'
                  : 'bg-white/80 border-cream-200 text-cocoa-700 hover:bg-cream-50'
              }`}
            >
              <span className="text-lg block mb-0.5">{feel.emoji}</span>
              <span className="text-xs">{feel.label}</span>
            </button>
          ))}
        </div>

        {selectedFeel === 'irritated' && (
          <IrritationGuidanceNotice />
        )}

        <div>
          <textarea
            rows={2}
            value={reactionNotes}
            onChange={(e) => setReactionNotes(e.target.value)}
            onBlur={handleNotesBlur}
            placeholder="Optional daily skin notes (e.g. slight flaking around nose, loved the moisturizer feeling)..."
            className="w-full p-3 rounded-2xl border border-cream-200 bg-white/70 text-xs text-cocoa-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400 placeholder:text-cocoa-400 resize-none"
          />
        </div>
      </div>

      {/* Freshness & Quick Navigation Shelf */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Expiring Products Alert */}
        <div className="card-editorial p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-editorial text-base font-semibold text-cocoa-900">
              Freshness & Expiry
            </h4>
            <span className="badge-cream text-[10px]">PAO Monitor</span>
          </div>

          {expiringProducts.length === 0 ? (
            <p className="text-xs text-sage-800 bg-sage-50 p-3 rounded-xl border border-sage-200">
              All active shelf items are fresh within their Period After Opening.
            </p>
          ) : (
            <div className="space-y-2">
              {expiringProducts.slice(0, 2).map(({ product, expiry }) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-white border border-cream-200"
                >
                  <span className="font-medium text-cocoa-800 truncate mr-2">
                    {product.name}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      expiry.isExpired
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-cream-200 text-cocoa-800'
                    }`}
                  >
                    {expiry.status === 'expired' ? 'Expired' : `${expiry.daysRemaining}d left`}
                  </span>
                </div>
              ))}
            </div>
          )}

          <Link
            to="/shelf"
            className="text-xs text-cocoa-600 hover:text-cocoa-900 underline block pt-1"
          >
            Manage product shelf →
          </Link>
        </div>

        {/* Quick Active Checker */}
        <div className="card-editorial p-5 space-y-3">
          <h4 className="font-editorial text-base font-semibold text-cocoa-900">
            Ingredient Safety
          </h4>
          <p className="text-xs text-cocoa-500 leading-relaxed">
            Verify compatibility between all products currently resting on your shelf.
          </p>
          <Link
            to="/compatibility"
            className="btn-outline w-full text-xs text-center justify-center"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-sage-600" />
            <span>Open Compatibility Checker</span>
          </Link>
        </div>

        {/* Calendar Shortcut */}
        <div className="card-editorial p-5 space-y-3">
          <h4 className="font-editorial text-base font-semibold text-cocoa-900">
            Weekly Schedule
          </h4>
          <p className="text-xs text-cocoa-500 leading-relaxed">
            See how your actives are spaced across the 7 days of the week.
          </p>
          <Link
            to="/week"
            className="btn-primary w-full text-xs text-center justify-center"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Inspect 7-Day Plan</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

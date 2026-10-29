import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  AlertCircle,
  CheckCircle,
  Info,
  Sun,
  Moon,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { useWeeklyPlan } from '../hooks/useWeeklyPlan';
import { useStore } from '../store/useStore';
import { DAYS_OF_WEEK } from '../lib/buildWeeklyPlan';
import { Day } from '../types';
import { BottleIllustration } from '../components/skincare/SkincareIllustrations';
import { Modal } from '../components/ui/Modal';
import { DefaultsDisclosureNotice } from '../components/safety/SafetyNotices';

const DAY_LABELS: Record<Day, { short: string; full: string }> = {
  mon: { short: 'Mon', full: 'Monday' },
  tue: { short: 'Tue', full: 'Tuesday' },
  wed: { short: 'Wed', full: 'Wednesday' },
  thu: { short: 'Thu', full: 'Thursday' },
  fri: { short: 'Fri', full: 'Friday' },
  sat: { short: 'Sat', full: 'Saturday' },
  sun: { short: 'Sun', full: 'Sunday' },
};

export const Week: React.FC = () => {
  const { plan } = useWeeklyPlan();
  const products = useStore((state) => state.products);

  const [selectedDay, setSelectedDay] = useState<Day>('mon');
  const [inspectProductId, setInspectProductId] = useState<string | null>(null);

  const productMap = new Map(products.map((p) => [p.id, p]));

  const inspectedProduct = inspectProductId ? productMap.get(inspectProductId) : null;

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cream-200">
        <div>
          <span className="text-xs uppercase tracking-widest text-rose-600 font-semibold flex items-center gap-1.5">
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Deterministic 7-Day Schedule</span>
          </span>
          <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-cocoa-900 mt-1">
            Weekly Routine Calendar
          </h1>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <span
            className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold ${
              plan.status === 'ok'
                ? 'bg-sage-100 text-sage-900 border border-sage-300'
                : plan.status === 'ok-with-warnings'
                ? 'bg-cream-200 text-cocoa-900 border border-cream-400'
                : 'bg-rose-100 text-rose-900 border border-rose-300'
            }`}
          >
            {plan.status === 'ok' ? (
              <CheckCircle className="w-3.5 h-3.5 text-sage-600" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            )}
            <span className="capitalize">{plan.status.replace(/-/g, ' ')}</span>
          </span>
        </div>
      </div>

      {/* Defaults Planning Disclosure Banner */}
      <DefaultsDisclosureNotice />

      {/* Warnings & Decisions Notice Banner */}
      {plan.warnings.length > 0 && (
        <div className="p-4 rounded-3xl bg-cream-50 border border-cream-300 space-y-2">
          <span className="text-xs font-bold text-cocoa-800 uppercase tracking-wider flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-cocoa-600" />
            <span>Scheduling Diagnostics ({plan.warnings.length}):</span>
          </span>
          <div className="space-y-1.5">
            {plan.warnings.map((w, idx) => (
              <p key={idx} className="text-xs text-cocoa-700 leading-relaxed pl-5 relative">
                <span className="absolute left-1.5 top-1.5 w-1.5 h-1.5 rounded-full bg-rose-400" />
                {w.message}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Decisions Banner (if user must resolve something) */}
      {plan.decisions.length > 0 && (
        <div className="p-4 rounded-3xl bg-rose-50 border border-rose-300 space-y-2">
          <span className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>Action Required:</span>
          </span>
          {plan.decisions.map((d, idx) => (
            <div key={idx} className="text-xs text-rose-800 pl-5 space-y-1">
              <p className="font-semibold">{d.reason}</p>
              <div className="flex gap-2">
                {d.resolutionOptions.map((opt, oIdx) => (
                  <span key={oIdx} className="badge-cream text-[10px]">
                    {opt}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 7-Day Grid View (Desktop & Tablet) */}
      <div className="hidden md:block overflow-x-auto pb-4">
        <div className="min-w-[900px] border border-cream-200 rounded-3xl bg-card overflow-hidden shadow-soft">
          {/* Header row: Day Names */}
          <div className="grid grid-cols-7 border-b border-cream-200 bg-cream-50/70 text-center">
            {DAYS_OF_WEEK.map((d) => (
              <div key={d} className="p-3.5 font-editorial text-sm font-semibold text-cocoa-900 border-r border-cream-100 last:border-r-0">
                <span>{DAY_LABELS[d].full}</span>
              </div>
            ))}
          </div>

          {/* AM Row */}
          <div className="grid grid-cols-7 border-b border-cream-200/80">
            {DAYS_OF_WEEK.map((d) => {
              const actives = plan.grid.AM[d] || [];
              const every = plan.everyRoutine.AM || [];
              return (
                <div key={d} className="p-3 border-r border-cream-100 last:border-r-0 min-h-[140px] flex flex-col justify-between bg-white/40">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-700 mb-1">
                      <Sun className="w-3 h-3 text-rose-500" />
                      <span>Morning (AM)</span>
                    </div>

                    {actives.length === 0 ? (
                      <span className="text-[11px] text-cocoa-400 italic block py-2">
                        Gentle basic routine
                      </span>
                    ) : (
                      actives.map((pId) => {
                        const prod = productMap.get(pId);
                        if (!prod) return null;
                        return (
                          <button
                            key={pId}
                            type="button"
                            onClick={() => setInspectProductId(pId)}
                            className="w-full text-left p-2 rounded-xl bg-rose-50/80 border border-rose-200/80 hover:bg-rose-100/80 transition-all text-[11px] text-cocoa-900 block"
                          >
                            <span className="font-semibold block truncate">{prod.name}</span>
                            <span className="text-[10px] text-rose-700 capitalize">{prod.type}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                  <span className="text-[10px] text-cocoa-400 block pt-1">
                    +{every.length} basic step(s)
                  </span>
                </div>
              );
            })}
          </div>

          {/* PM Row */}
          <div className="grid grid-cols-7">
            {DAYS_OF_WEEK.map((d) => {
              const actives = plan.grid.PM[d] || [];
              const every = plan.everyRoutine.PM || [];
              const isRestNight = actives.length === 0;

              return (
                <div
                  key={d}
                  className={`p-3 border-r border-cream-100 last:border-r-0 min-h-[150px] flex flex-col justify-between transition-colors ${
                    isRestNight ? 'bg-sage-50/40' : 'bg-white/40'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-lavender-700 mb-1">
                      <div className="flex items-center gap-1">
                        <Moon className="w-3 h-3 text-lavender-600" />
                        <span>Evening (PM)</span>
                      </div>
                      {isRestNight && (
                        <span className="badge-sage text-[9px] py-0">Rest Night</span>
                      )}
                    </div>

                    {isRestNight ? (
                      <div className="py-4 text-center">
                        <span className="text-xs font-editorial text-sage-800 block">
                          Skin Recovery
                        </span>
                        <span className="text-[10px] text-sage-600">
                          Barrier hydration only
                        </span>
                      </div>
                    ) : (
                      actives.map((pId) => {
                        const prod = productMap.get(pId);
                        if (!prod) return null;
                        return (
                          <button
                            key={pId}
                            type="button"
                            onClick={() => setInspectProductId(pId)}
                            className="w-full text-left p-2 rounded-xl bg-lavender-50/90 border border-lavender-200 hover:bg-lavender-100 transition-all text-[11px] text-cocoa-900 block"
                          >
                            <span className="font-semibold block truncate">{prod.name}</span>
                            <span className="text-[10px] text-lavender-700 capitalize">{prod.type}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                  <span className="text-[10px] text-cocoa-400 block pt-1">
                    +{every.length} basic step(s)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile Day Selector & Single Day Inspector */}
      <div className="md:hidden space-y-4">
        {/* Day Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
          {DAYS_OF_WEEK.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setSelectedDay(d)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedDay === d
                  ? 'bg-rose-500 text-white shadow-2xs'
                  : 'bg-cream-100 text-cocoa-600'
              }`}
            >
              {DAY_LABELS[d].short}
            </button>
          ))}
        </div>

        {/* Selected Day View Card */}
        <div className="card-editorial p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-cream-200">
            <h3 className="font-editorial text-xl font-semibold text-cocoa-900">
              {DAY_LABELS[selectedDay].full}
            </h3>
            {plan.grid.PM[selectedDay].length === 0 && (
              <span className="badge-sage">Rest Night</span>
            )}
          </div>

          {/* Mobile AM */}
          <div className="p-3.5 rounded-2xl bg-cream-50/70 border border-cream-200 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700">
              <Sun className="w-3.5 h-3.5" />
              <span>Morning Actives:</span>
            </div>
            {plan.grid.AM[selectedDay].length === 0 ? (
              <p className="text-xs text-cocoa-400 italic">No scheduled active. Standard cleansing & SPF.</p>
            ) : (
              plan.grid.AM[selectedDay].map((pId) => {
                const prod = productMap.get(pId);
                return (
                  <div key={pId} className="p-2.5 rounded-xl bg-white border border-rose-200 text-xs">
                    <span className="font-semibold block text-cocoa-900">{prod?.name}</span>
                    <span className="text-[10px] text-cocoa-500 capitalize">{prod?.type}</span>
                  </div>
                );
              })
            )}
          </div>

          {/* Mobile PM */}
          <div className="p-3.5 rounded-2xl bg-cream-50/70 border border-cream-200 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-lavender-700">
              <Moon className="w-3.5 h-3.5" />
              <span>Evening Actives:</span>
            </div>
            {plan.grid.PM[selectedDay].length === 0 ? (
              <p className="text-xs text-sage-800 font-medium">
                Rest Night — allow your moisture barrier to recover.
              </p>
            ) : (
              plan.grid.PM[selectedDay].map((pId) => {
                const prod = productMap.get(pId);
                return (
                  <div key={pId} className="p-2.5 rounded-xl bg-white border border-lavender-200 text-xs">
                    <span className="font-semibold block text-cocoa-900">{prod?.name}</span>
                    <span className="text-[10px] text-cocoa-500 capitalize">{prod?.type}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Explanations & Algorithmic Rationale Drawer */}
      <div className="card-editorial p-6 sm:p-7 space-y-4">
        <div>
          <h3 className="font-editorial text-xl font-semibold text-cocoa-900">
            Scheduling Explanations
          </h3>
          <p className="text-xs text-cocoa-500">
            Why items were placed, separated by time of day, or alternated:
          </p>
        </div>

        {plan.explanations.length === 0 ? (
          <p className="text-xs text-cocoa-400 italic">
            Standard schedule without complex active separations.
          </p>
        ) : (
          <div className="space-y-2">
            {plan.explanations.map((exp, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-3 rounded-2xl bg-cream-50 border border-cream-200 text-xs text-cocoa-800"
              >
                <Sparkles className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                <span>{exp}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inspect Product Modal */}
      {inspectedProduct && (
        <Modal
          isOpen={Boolean(inspectedProduct)}
          onClose={() => setInspectProductId(null)}
          title={inspectedProduct.name}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-cream-50 border border-cream-200">
              <BottleIllustration shape={inspectedProduct.bottle} color={inspectedProduct.color} size="md" />
              <div>
                <span className="badge-sage capitalize text-xs">{inspectedProduct.type}</span>
                <p className="text-xs text-cocoa-500 mt-1">
                  Form: {inspectedProduct.productForm} • PAO: {inspectedProduct.monthsValid}M
                </p>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-cocoa-700 block mb-1">
                Ingredients:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {inspectedProduct.ingredients.map((ing) => (
                  <span key={ing} className="badge-cream text-xs">
                    {ing}
                  </span>
                ))}
              </div>
            </div>

            {inspectedProduct.directions && (
              <div className="p-3 rounded-2xl bg-cream-100 text-xs text-cocoa-800">
                <span className="font-semibold block mb-0.5">Directions:</span>
                <span>
                  Source: {inspectedProduct.directions.source} • Frequency: {inspectedProduct.directions.nightsPerWeek || 'Default'} nights/week
                </span>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

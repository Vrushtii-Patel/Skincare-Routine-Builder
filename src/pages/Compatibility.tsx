import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Info,
  ExternalLink,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { useConflicts } from '../hooks/useConflicts';
import { useStore } from '../store/useStore';
import { loadReferenceData } from '../lib/loadData';
import { findRuleForIngredientPair } from '../lib/matchRules';

export const Compatibility: React.FC = () => {
  const { conflicts } = useConflicts();
  const products = useStore((state) => state.products);
  const data = useMemo(() => loadReferenceData(), []);

  // Custom Pair Interactive Tester State
  const [testIngA, setTestIngA] = useState<string>('retinol');
  const [testIngB, setTestIngB] = useState<string>('benzoyl-peroxide');

  const customRule = useMemo(() => {
    return findRuleForIngredientPair(testIngA, testIngB, data);
  }, [testIngA, testIngB, data]);

  const sourceMap = useMemo(() => {
    return new Map(data.sources.map((s) => [s.id, s]));
  }, [data.sources]);

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-cream-200">
        <span className="text-xs uppercase tracking-widest text-sage-600 font-semibold flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Evidence-Based Skin Safety</span>
        </span>
        <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-cocoa-900 mt-1">
          Ingredient Compatibility
        </h1>
        <p className="text-xs sm:text-sm text-cocoa-500 mt-1">
          Explore potential irritation overlaps, timing recommendations, and clinical source citations for your skincare ingredients.
        </p>
      </div>

      {/* Shelf Conflicts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-editorial text-xl font-semibold text-cocoa-900">
            Shelf Audit ({conflicts.length} interaction{conflicts.length === 1 ? '' : 's'})
          </h2>
          <span className="text-xs text-cocoa-400">
            Scanning {products.length} product(s)
          </span>
        </div>

        {conflicts.length === 0 ? (
          <div className="card-editorial p-6 text-center space-y-2 bg-sage-50/50 border-sage-200">
            <div className="w-10 h-10 rounded-full bg-sage-100 flex items-center justify-center mx-auto text-sage-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm text-cocoa-900">
              No High Irritation Overlaps Found
            </h3>
            <p className="text-xs text-cocoa-500 max-w-md mx-auto leading-relaxed">
              None of the active combinations on your current shelf trigger standard irritation cautions. Always remember that tolerance depends on individual skin and product concentration.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {conflicts.map((conflict, idx) => {
              const prodA = products.find((p) => p.id === conflict.productAId);
              const prodB = products.find((p) => p.id === conflict.productBId);

              const isCaution = conflict.severity === 'caution';
              const isNotice = conflict.severity === 'notice';

              return (
                <div
                  key={idx}
                  className={`card-editorial p-5 sm:p-6 border transition-all ${
                    isCaution
                      ? 'bg-rose-50/70 border-rose-300'
                      : isNotice
                      ? 'bg-cream-50/90 border-cream-300'
                      : 'bg-card border-cream-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-cream-200/80">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full uppercase font-bold tracking-wider ${
                            isCaution
                              ? 'bg-rose-200 text-rose-900'
                              : isNotice
                              ? 'bg-cream-200 text-cocoa-800'
                              : 'bg-lavender-100 text-lavender-800'
                          }`}
                        >
                          {conflict.severity}
                        </span>
                        <span className="badge-cream text-[10px] capitalize">
                          {conflict.kind.replace('-', ' ')}
                        </span>
                        <span className="text-[10px] text-cocoa-400">
                          Evidence: {conflict.evidence}
                        </span>
                      </div>

                      <h3 className="font-editorial text-lg font-semibold text-cocoa-900">
                        {conflict.title}
                      </h3>

                      <p className="text-xs text-cocoa-600 mt-0.5">
                        Between <span className="font-semibold text-cocoa-900">{prodA?.name || conflict.aIngredientId}</span> and <span className="font-semibold text-cocoa-900">{prodB?.name || conflict.bIngredientId}</span>
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 space-y-2 text-xs">
                    <p className="text-cocoa-700 leading-relaxed">
                      {conflict.evidence === 'insufficient' && !conflict.explanation.startsWith('Conservative') && (
                        <span className="font-semibold text-cocoa-900">Conservative planning note: </span>
                      )}
                      {conflict.explanation}
                    </p>

                    {conflict.tip && (
                      <div className="p-3 rounded-2xl bg-white/80 border border-cream-200 text-cocoa-800 flex items-start gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                        <span><strong>Tip:</strong> {conflict.tip}</span>
                      </div>
                    )}

                    {/* Sources Citations */}
                    {conflict.sourceIds && conflict.sourceIds.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[11px] font-semibold text-cocoa-500 block mb-1">
                          Authoritative Reference(s):
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {conflict.sourceIds.map((sid) => {
                            const src = sourceMap.get(sid);
                            if (!src) return null;
                            return (
                              <a
                                key={sid}
                                href={src.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cream-100 hover:bg-cream-200 text-[11px] text-cocoa-700 transition-colors"
                              >
                                <BookOpen className="w-3 h-3 text-sage-600" />
                                <span>{src.organization}: {src.title}</span>
                                <ExternalLink className="w-2.5 h-2.5 text-cocoa-400 ml-0.5" />
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Interactive Ingredient Pair Tester */}
      <div className="card-editorial p-6 sm:p-7 space-y-5 bg-card">
        <div>
          <span className="text-xs uppercase tracking-widest text-rose-600 font-semibold">
            Interactive Tool
          </span>
          <h2 className="font-editorial text-2xl font-semibold text-cocoa-900 mt-1">
            Test Any Ingredient Pairing
          </h2>
          <p className="text-xs text-cocoa-500 mt-1">
            Curious about layering two specific ingredients? Select any two actives to see our verified compatibility rules.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-cocoa-700 mb-1">
              Ingredient A
            </label>
            <select
              value={testIngA}
              onChange={(e) => setTestIngA(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-cream-200 bg-white text-xs sm:text-sm text-cocoa-900 focus:outline-none focus:ring-2 focus:ring-rose-400"
            >
              {data.ingredients.map((ing) => (
                <option key={ing.id} value={ing.id}>
                  {ing.name} ({ing.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-cocoa-700 mb-1">
              Ingredient B
            </label>
            <select
              value={testIngB}
              onChange={(e) => setTestIngB(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-cream-200 bg-white text-xs sm:text-sm text-cocoa-900 focus:outline-none focus:ring-2 focus:ring-rose-400"
            >
              {data.ingredients.map((ing) => (
                <option key={ing.id} value={ing.id}>
                  {ing.name} ({ing.category})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Pairing Result Card */}
        <div className="p-5 rounded-3xl bg-cream-50 border border-cream-200 space-y-3">
          {customRule ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                    customRule.severity === 'caution'
                      ? 'bg-rose-200 text-rose-900'
                      : 'bg-cream-200 text-cocoa-800'
                  }`}
                >
                  {customRule.severity}
                </span>
                <span className="font-semibold text-sm text-cocoa-900">
                  {customRule.title}
                </span>
              </div>
              <p className="text-xs text-cocoa-700 leading-relaxed">
                {customRule.evidence === 'insufficient' && !customRule.explanation.startsWith('Conservative') && (
                  <span className="font-semibold text-cocoa-900">Conservative planning note: </span>
                )}
                {customRule.explanation}
              </p>
              {customRule.tip && (
                <div className="text-xs text-cocoa-800 font-medium bg-white/70 p-2.5 rounded-xl border border-cream-200">
                  Tip: {customRule.tip}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-cocoa-700">
              <Info className="w-4 h-4 text-sage-600 shrink-0" />
              <span>
                No specific compatibility warning applies between these two ingredients. (Note: Lack of a warning does not guarantee universal tolerance; perform a patch test for new products).
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

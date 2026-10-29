import React, { useState } from 'react';
import {
  Sun,
  Moon,
  CheckCircle2,
  Circle,
  Plus,
  Sparkles,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { useRoutineSlots } from '../hooks/useRoutineSlots';
import { BottleIllustration } from '../components/skincare/SkincareIllustrations';
import {
  SunscreenGuidanceNotice,
  ClinicianPrescriberNotice,
} from '../components/safety/SafetyNotices';
import { ProductFormModal } from '../components/shelf/ProductFormModal';
import { Product } from '../types';

export const Routine: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'AM' | 'PM'>('AM');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { slots, todayDate } = useRoutineSlots();
  const checkIns = useStore((state) => state.checkIns);
  const recordRoutineCheckIn = useStore((state) => state.recordRoutineCheckIn);
  const addProduct = useStore((state) => state.addProduct);

  const todayRecord = checkIns[todayDate] || { am: false, pm: false };
  const isCompleted = activeTab === 'AM' ? todayRecord.am : todayRecord.pm;

  const currentSlots = slots[activeTab];

  const handleToggleComplete = () => {
    const routineKey = activeTab === 'AM' ? 'am' : 'pm';
    recordRoutineCheckIn(todayDate, routineKey, !isCompleted);
  };

  const handleSaveProduct = (prod: Omit<Product, 'id'>) => {
    addProduct(prod);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      {/* Page Title & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cream-200">
        <div>
          <span className="text-xs uppercase tracking-widest text-rose-600 font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Daily Application Order</span>
          </span>
          <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-cocoa-900 mt-1">
            My Skincare Routine
          </h1>
        </div>

        {/* Routine Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-full bg-cream-100 border border-cream-200">
          <button
            type="button"
            onClick={() => setActiveTab('AM')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'AM'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-cocoa-600 hover:text-cocoa-900'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>Morning (AM)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PM')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'PM'
                ? 'bg-lavender-700 text-white shadow-sm'
                : 'text-cocoa-600 hover:text-cocoa-900'
            }`}
          >
            <Moon className="w-4 h-4" />
            <span>Evening (PM)</span>
          </button>
        </div>
      </div>

      {/* Routine Status & Action Bar */}
      <div className="flex items-center justify-between p-4 rounded-3xl bg-cream-50 border border-cream-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-cocoa-700 shadow-2xs">
            {activeTab === 'AM' ? <Sun className="w-4 h-4 text-rose-500" /> : <Moon className="w-4 h-4 text-lavender-600" />}
          </div>
          <div>
            <h3 className="font-semibold text-sm text-cocoa-900">
              {activeTab === 'AM' ? 'Morning Routine Steps' : 'Evening Routine Steps'}
            </h3>
            <span className="text-xs text-cocoa-500">
              {currentSlots.length} sequenced application step(s)
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleComplete}
          className={`btn-primary text-xs px-4 py-2 ${
            isCompleted ? 'bg-sage-600 hover:bg-sage-700' : ''
          }`}
        >
          {isCompleted ? (
            <>
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>Routine Completed</span>
            </>
          ) : (
            <>
              <Circle className="w-4 h-4" />
              <span>Mark Routine Done</span>
            </>
          )}
        </button>
      </div>

      {/* Contextual Guidance Notices */}
      {activeTab === 'AM' && <SunscreenGuidanceNotice />}

      {/* Step by Step Timeline */}
      <div className="space-y-4">
        {currentSlots.map((item, idx) => {
          const isGap = item.isGap;
          const product = item.product;

          return (
            <div
              key={idx}
              className={`p-5 rounded-3xl border transition-all ${
                isGap
                  ? 'bg-cream-50/60 border-dashed border-cream-300'
                  : 'bg-card border-cream-200 shadow-soft hover:border-rose-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  {/* Step Number Circle */}
                  <div className="w-8 h-8 rounded-full bg-cream-100 border border-cream-300 flex items-center justify-center font-bold text-xs text-cocoa-700 shrink-0 mt-0.5">
                    {idx + 1}
                  </div>

                  {/* Step Info */}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="badge-cream text-xs uppercase font-semibold">
                        {item.slot}
                      </span>
                      {product?.directions?.source === 'clinician' && (
                        <ClinicianPrescriberNotice />
                      )}
                    </div>

                    <h4 className="font-editorial text-lg font-semibold text-cocoa-900">
                      {product ? product.name : `Missing ${item.slot}`}
                    </h4>

                    <p className="text-xs text-cocoa-500 leading-relaxed font-light">
                      {item.guidance}
                    </p>

                    {product && product.ingredients.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1.5">
                        {product.ingredients.map((ing) => (
                          <span
                            key={ing}
                            className="inline-block px-2 py-0.5 rounded-md bg-cream-100 text-[10px] text-cocoa-600"
                          >
                            {ing}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Bottle Icon or Gap Add Action */}
                <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                  {product ? (
                    <BottleIllustration
                      shape={product.bottle}
                      color={product.color}
                      size="md"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(true)}
                      className="btn-outline text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add {item.slot} to Shelf</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Product Modal */}
      <ProductFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveProduct}
      />
    </div>
  );
};

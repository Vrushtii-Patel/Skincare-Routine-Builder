import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { IngredientPicker } from './IngredientPicker';
import { BottleIllustration } from '../skincare/SkincareIllustrations';
import { RetinoidPregnancyAdvisory, CombinationProductNotice } from '../safety/SafetyNotices';
import { Product, ProductType, ProductForm, BottleShape, DirectionSource, Day } from '../../types';
import { loadReferenceData } from '../../lib/loadData';
import { format } from 'date-fns';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Omit<Product, 'id'>) => void;
  initialProduct?: Product | null;
}

const PALETTE_COLORS = [
  '#C496A1', // Dusty Rose
  '#919D85', // Muted Sage
  '#8E88A3', // Lavender Purple
  '#EBE1C6', // Vintage Cream
  '#D5A4AF', // Soft Rose
  '#A6B89A', // Soft Sage
  '#BDCEB4', // Pale Green
  '#DDD6EB', // Soft Lavender
];

const DAYS: { key: Day; label: string }[] = [
  { key: 'mon', label: 'M' },
  { key: 'tue', label: 'T' },
  { key: 'wed', label: 'W' },
  { key: 'thu', label: 'T' },
  { key: 'fri', label: 'F' },
  { key: 'sat', label: 'S' },
  { key: 'sun', label: 'S' },
];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialProduct,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<ProductType>('serum');
  const [productForm, setProductForm] = useState<ProductForm>('leave-on');
  const [openedOn, setOpenedOn] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [monthsValid, setMonthsValid] = useState(12);
  const [bottle, setBottle] = useState<BottleShape>('dropper');
  const [color, setColor] = useState('#C496A1');
  const [isCombinationProduct, setIsCombinationProduct] = useState(false);
  const [ingredients, setIngredients] = useState<string[]>([]);

  // Directions state
  const [hasCustomDirections, setHasCustomDirections] = useState(false);
  const [directionSource, setDirectionSource] = useState<DirectionSource>('label');
  const [nightsPerWeek, setNightsPerWeek] = useState<number>(3);
  const [preferredTime, setPreferredTime] = useState<'AM' | 'PM'>('PM');
  const [fixedDays, setFixedDays] = useState<Day[]>([]);
  const [directedTogetherWith, setDirectedTogetherWith] = useState<string[]>([]);

  const [error, setError] = useState<string | null>(null);

  const refData = loadReferenceData();
  const ingredientMap = new Map(refData.ingredients.map((i) => [i.id, i]));

  useEffect(() => {
    if (initialProduct) {
      setName(initialProduct.name);
      setType(initialProduct.type);
      setProductForm(initialProduct.productForm);
      setOpenedOn(initialProduct.openedOn);
      setMonthsValid(initialProduct.monthsValid);
      setBottle(initialProduct.bottle);
      setColor(initialProduct.color);
      setIsCombinationProduct(initialProduct.isCombinationProduct);
      setIngredients(initialProduct.ingredients);

      if (initialProduct.directions) {
        setHasCustomDirections(true);
        setDirectionSource(initialProduct.directions.source);
        if (typeof initialProduct.directions.nightsPerWeek === 'number') {
          setNightsPerWeek(initialProduct.directions.nightsPerWeek);
        }
        if (initialProduct.directions.time) {
          setPreferredTime(initialProduct.directions.time);
        }
        if (initialProduct.directions.fixedDays) {
          setFixedDays(initialProduct.directions.fixedDays);
        }
        if (initialProduct.directions.directedTogetherWith) {
          setDirectedTogetherWith(initialProduct.directions.directedTogetherWith);
        }
      } else {
        setHasCustomDirections(false);
      }
    } else {
      // Defaults for new product
      setName('');
      setType('serum');
      setProductForm('leave-on');
      setOpenedOn(format(new Date(), 'yyyy-MM-dd'));
      setMonthsValid(12);
      setBottle('dropper');
      setColor('#C496A1');
      setIsCombinationProduct(false);
      setIngredients([]);
      setHasCustomDirections(false);
      setDirectionSource('label');
      setNightsPerWeek(3);
      setPreferredTime('PM');
      setFixedDays([]);
      setDirectedTogetherWith([]);
    }
    setError(null);
  }, [initialProduct, isOpen]);

  // Adjust bottle default based on product type
  const handleTypeChange = (newType: ProductType) => {
    setType(newType);
    if (newType === 'cleanser') {
      setBottle('pump');
      setProductForm('rinse-off');
    } else if (newType === 'moisturizer') {
      setBottle('jar');
      setProductForm('leave-on');
    } else if (newType === 'sunscreen') {
      setBottle('tube');
      setProductForm('leave-on');
    } else if (newType === 'serum') {
      setBottle('dropper');
      setProductForm('leave-on');
    }
  };

  const hasRetinoid = ingredients.some(
    (id) => ingredientMap.get(id)?.tags.includes('retinoid')
  );

  const toggleFixedDay = (day: Day) => {
    if (fixedDays.includes(day)) {
      setFixedDays(fixedDays.filter((d) => d !== day));
    } else {
      setFixedDays([...fixedDays, day]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a product name.');
      return;
    }

    // Validate openedOn is not in the future
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    if (openedOn > todayStr) {
      setError('Opening date cannot be in the future.');
      return;
    }

    const payload: Omit<Product, 'id'> = {
      name: name.trim(),
      type,
      ingredients,
      productForm,
      openedOn,
      monthsValid,
      bottle,
      color,
      isCombinationProduct,
      directions: hasCustomDirections
        ? {
            source: directionSource,
            nightsPerWeek: fixedDays.length > 0 ? fixedDays.length : nightsPerWeek,
            fixedDays: directionSource === 'clinician' && fixedDays.length > 0 ? fixedDays : undefined,
            time: preferredTime,
            directedTogetherWith:
              directionSource === 'clinician' && directedTogetherWith.length > 0
                ? directedTogetherWith
                : undefined,
          }
        : undefined,
    };

    onSave(payload);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialProduct ? 'Edit Skincare Product' : 'Add to Shelf'}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
            {error}
          </div>
        )}

        {/* Visual Preview Header */}
        <div className="flex items-center gap-4 p-4 rounded-3xl bg-cream-50 border border-cream-200">
          <BottleIllustration shape={bottle} color={color} size="md" />
          <div className="flex-1">
            <h4 className="font-editorial text-lg font-semibold text-cocoa-900 leading-tight">
              {name || 'Your Product'}
            </h4>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="badge-sage capitalize">{type}</span>
              <span className="badge-cream">{productForm}</span>
              <span className="text-xs text-cocoa-500">PAO: {monthsValid}M</span>
            </div>
          </div>
        </div>

        {/* Product Name & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-cocoa-700 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Skin Soothing Retinol Serum"
              className="w-full px-4 py-2.5 rounded-2xl border border-cream-200 bg-white/90 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400 text-xs sm:text-sm text-cocoa-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-cocoa-700 mb-1">
              Category
            </label>
            <select
              value={type}
              onChange={(e) => handleTypeChange(e.target.value as ProductType)}
              className="w-full px-4 py-2.5 rounded-2xl border border-cream-200 bg-white/90 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400 text-xs sm:text-sm text-cocoa-900"
            >
              <option value="cleanser">Cleanser</option>
              <option value="toner">Toner</option>
              <option value="serum">Serum</option>
              <option value="treatment">Treatment</option>
              <option value="exfoliant">Exfoliant</option>
              <option value="moisturizer">Moisturizer</option>
              <option value="sunscreen">Sunscreen</option>
            </select>
          </div>
        </div>

        {/* Form and Bottle Customization */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-cocoa-700 mb-1">
              Product Form
            </label>
            <div className="flex rounded-xl bg-cream-100 p-1">
              <button
                type="button"
                onClick={() => setProductForm('leave-on')}
                className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition-all ${
                  productForm === 'leave-on' ? 'bg-white text-cocoa-900 shadow-2xs' : 'text-cocoa-500'
                }`}
              >
                Leave-on
              </button>
              <button
                type="button"
                onClick={() => setProductForm('rinse-off')}
                className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition-all ${
                  productForm === 'rinse-off' ? 'bg-white text-cocoa-900 shadow-2xs' : 'text-cocoa-500'
                }`}
              >
                Rinse-off
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-cocoa-700 mb-1">
              Bottle Shape
            </label>
            <select
              value={bottle}
              onChange={(e) => setBottle(e.target.value as BottleShape)}
              className="w-full px-3 py-2 rounded-xl border border-cream-200 bg-white text-xs text-cocoa-900 focus:outline-none focus:ring-2 focus:ring-rose-400"
            >
              <option value="dropper">Dropper</option>
              <option value="pump">Pump</option>
              <option value="tube">Tube</option>
              <option value="jar">Jar</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-cocoa-700 mb-1">
              Bottle Color
            </label>
            <div className="flex items-center gap-1.5 pt-1">
              {PALETTE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-6 h-6 rounded-full border transition-transform ${
                    color === c ? 'scale-125 border-cocoa-900 shadow-sm' : 'border-white hover:scale-110'
                  }`}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Dates and PAO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-cocoa-700 mb-1">
              Date Opened
            </label>
            <input
              type="date"
              value={openedOn}
              max={format(new Date(), 'yyyy-MM-dd')}
              onChange={(e) => setOpenedOn(e.target.value)}
              className="w-full px-4 py-2 rounded-2xl border border-cream-200 bg-white text-xs sm:text-sm text-cocoa-900 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-cocoa-700 mb-1">
              Period After Opening (PAO)
            </label>
            <select
              value={monthsValid}
              onChange={(e) => setMonthsValid(Number(e.target.value))}
              className="w-full px-4 py-2 rounded-2xl border border-cream-200 bg-white text-xs sm:text-sm text-cocoa-900 focus:outline-none focus:ring-2 focus:ring-rose-400"
            >
              <option value={3}>3 Months</option>
              <option value={6}>6 Months</option>
              <option value={12}>12 Months (Standard)</option>
              <option value={18}>18 Months</option>
              <option value={24}>24 Months</option>
            </select>
          </div>
        </div>

        {/* Combination Product Toggle */}
        <div className="p-3.5 rounded-2xl bg-cream-50/80 border border-cream-200">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isCombinationProduct}
              onChange={(e) => setIsCombinationProduct(e.target.checked)}
              className="w-4 h-4 rounded text-rose-500 focus:ring-rose-400 border-cream-300"
            />
            <span className="text-xs font-medium text-cocoa-800">
              This is a combination product (single commercial formula combining multiple actives)
            </span>
          </label>
          {isCombinationProduct && (
            <div className="mt-2">
              <CombinationProductNotice />
            </div>
          )}
        </div>

        {/* Ingredients Picker */}
        <div>
          <label className="block text-xs font-semibold text-cocoa-700 mb-1.5">
            Ingredients in this Product
          </label>
          <IngredientPicker selectedIds={ingredients} onChange={setIngredients} />
        </div>

        {hasRetinoid && <RetinoidPregnancyAdvisory />}

        {/* Custom Directions & Clinician Scheduling Panel */}
        <div className="p-4 rounded-3xl bg-cream-50 border border-cream-200 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={hasCustomDirections}
              onChange={(e) => setHasCustomDirections(e.target.checked)}
              className="w-4 h-4 rounded text-rose-500 focus:ring-rose-400 border-cream-300"
            />
            <span className="text-xs font-semibold text-cocoa-900">
              I have specific instructions from a product label or clinician
            </span>
          </label>

          {hasCustomDirections && (
            <div className="pt-2 border-t border-cream-200/80 space-y-3">
              <div className="flex gap-4">
                <label className="inline-flex items-center gap-2 text-xs text-cocoa-800">
                  <input
                    type="radio"
                    name="directionSource"
                    value="label"
                    checked={directionSource === 'label'}
                    onChange={() => setDirectionSource('label')}
                    className="text-rose-500"
                  />
                  <span>Product Label</span>
                </label>
                <label className="inline-flex items-center gap-2 text-xs text-cocoa-800">
                  <input
                    type="radio"
                    name="directionSource"
                    value="clinician"
                    checked={directionSource === 'clinician'}
                    onChange={() => setDirectionSource('clinician')}
                    className="text-rose-500"
                  />
                  <span>Prescribing Clinician</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-cocoa-600 mb-1">
                    Frequency (nights per week)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={7}
                    value={nightsPerWeek}
                    onChange={(e) => setNightsPerWeek(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border border-cream-200 bg-white text-xs text-cocoa-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-cocoa-600 mb-1">
                    Application Time
                  </label>
                  <select
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value as 'AM' | 'PM')}
                    className="w-full px-3 py-1.5 rounded-xl border border-cream-200 bg-white text-xs text-cocoa-900"
                  >
                    <option value="PM">Evening (PM)</option>
                    <option value="AM">Morning (AM)</option>
                  </select>
                </div>
              </div>

              {directionSource === 'clinician' && (
                <div>
                  <label className="block text-[11px] font-medium text-cocoa-600 mb-1.5">
                    Fixed Clinician Days (hard placement):
                  </label>
                  <div className="flex gap-1">
                    {DAYS.map(({ key, label }) => {
                      const isSelected = fixedDays.includes(key);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => toggleFixedDay(key)}
                          className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${
                            isSelected
                              ? 'bg-sage-600 text-white shadow-xs'
                              : 'bg-white border border-cream-200 text-cocoa-600 hover:bg-cream-100'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-cream-100">
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost text-xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary text-xs"
          >
            {initialProduct ? 'Save Changes' : 'Add to Shelf'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

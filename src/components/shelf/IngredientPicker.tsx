import React, { useState, useMemo } from 'react';
import { Search, X, Check, Sparkles } from 'lucide-react';
import { loadReferenceData } from '../../lib/loadData';
import { Ingredient } from '../../types';

interface IngredientPickerProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export const IngredientPicker: React.FC<IngredientPickerProps> = ({
  selectedIds,
  onChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const data = useMemo(() => loadReferenceData(), []);
  const allIngredients = data.ingredients;

  const quickFilters = [
    { id: 'all', label: 'All' },
    { id: 'retinoid', label: 'Retinoids' },
    { id: 'exfoliating-acid', label: 'Acids (AHA/BHA)' },
    { id: 'antibacterial', label: 'BPO / Antibacterial' },
    { id: 'hydrator', label: 'Hydrators' },
    { id: 'antioxidant', label: 'Antioxidants' },
    { id: 'soothing', label: 'Soothing' },
  ];

  const filteredIngredients = useMemo(() => {
    return allIngredients.filter((ing) => {
      const matchesSearch =
        ing.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ing.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      if (activeCategory === 'all') return true;
      if (activeCategory === 'retinoid') return ing.category === 'retinoid' || ing.tags.includes('retinoid');
      if (activeCategory === 'exfoliating-acid') return ing.category === 'exfoliating-acid' || ing.tags.includes('exfoliant');
      if (activeCategory === 'antibacterial') return ing.category === 'antibacterial' || ing.id === 'benzoyl-peroxide';
      if (activeCategory === 'hydrator') return ing.category === 'hydrator' || ing.tags.includes('hydrator');
      if (activeCategory === 'antioxidant') return ing.category === 'antioxidant';
      if (activeCategory === 'soothing') return ing.category === 'soothing';
      return true;
    });
  }, [allIngredients, searchTerm, activeCategory]);

  const toggleIngredient = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const selectedIngredients = useMemo(() => {
    return selectedIds
      .map((id) => allIngredients.find((ing) => ing.id === id))
      .filter((ing): ing is Ingredient => Boolean(ing));
  }, [selectedIds, allIngredients]);

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cocoa-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search actives (e.g. Retinol, BPO, Salicylic Acid, Ceramides)..."
          className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-full border border-cream-200 bg-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400 transition-all text-cocoa-900 placeholder:text-cocoa-400"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-cocoa-400 hover:text-cocoa-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick Filter Categories */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        {quickFilters.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1 rounded-full whitespace-nowrap transition-all ${
              activeCategory === cat.id
                ? 'bg-rose-500 text-white font-medium'
                : 'bg-cream-100 text-cocoa-600 hover:bg-cream-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Selected Ingredients Chips */}
      {selectedIngredients.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2.5 rounded-2xl bg-cream-50 border border-cream-200">
          <span className="text-[11px] font-semibold text-cocoa-500 w-full mb-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-rose-500" />
            Selected Ingredients ({selectedIngredients.length}):
          </span>
          {selectedIngredients.map((ing) => (
            <span
              key={ing.id}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-900 border border-rose-200 shadow-2xs"
            >
              <span>{ing.name}</span>
              <button
                type="button"
                onClick={() => toggleIngredient(ing.id)}
                className="hover:text-rose-950 p-0.5 rounded-full"
                aria-label={`Remove ${ing.name}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Ingredient Suggestions Grid */}
      <div className="max-h-48 overflow-y-auto space-y-1 border border-cream-100 rounded-2xl p-2 bg-white/60">
        {filteredIngredients.length === 0 ? (
          <p className="text-xs text-cocoa-400 p-3 text-center">
            No ingredients match your search.
          </p>
        ) : (
          filteredIngredients.map((ing) => {
            const isSelected = selectedIds.includes(ing.id);
            const isRetinoid = ing.category === 'retinoid' || ing.tags.includes('retinoid');
            const isBPO = ing.id === 'benzoyl-peroxide';

            return (
              <button
                key={ing.id}
                type="button"
                onClick={() => toggleIngredient(ing.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors ${
                  isSelected
                    ? 'bg-rose-50 border border-rose-200 text-rose-900 font-medium'
                    : 'hover:bg-cream-100 text-cocoa-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center border text-[10px] ${
                      isSelected
                        ? 'bg-rose-500 border-rose-500 text-white'
                        : 'border-cocoa-300'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span>{ing.name}</span>
                  {isRetinoid && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-rose-100 text-rose-700">
                      Retinoid
                    </span>
                  )}
                  {isBPO && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-sage-100 text-sage-800">
                      BPO
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-cocoa-400 capitalize">
                  {ing.category.replace('-', ' ')}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};


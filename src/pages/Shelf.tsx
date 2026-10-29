import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { calculateProductExpiry } from '../lib/expiry';
import { BottleIllustration } from '../components/skincare/SkincareIllustrations';
import { ProductFormModal } from '../components/shelf/ProductFormModal';
import { Modal } from '../components/ui/Modal';
import {
  PatchTestGuidanceNotice,
  RetinoidPregnancyAdvisory,
} from '../components/safety/SafetyNotices';
import { Product } from '../../src/types';
import { format, differenceInCalendarDays, parseISO } from 'date-fns';

export const Shelf: React.FC = () => {
  const products = useStore((state) => state.products);
  const addProduct = useStore((state) => state.addProduct);
  const updateProduct = useStore((state) => state.updateProduct);
  const deleteProduct = useStore((state) => state.deleteProduct);
  const toggleArchiveProduct = useStore((state) => state.toggleArchiveProduct);
  const loadSampleData = useStore((state) => state.loadSampleData);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedExpiryFilter, setSelectedExpiryFilter] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'All Items' },
    { id: 'cleanser', label: 'Cleansers' },
    { id: 'toner', label: 'Toners' },
    { id: 'serum', label: 'Serums' },
    { id: 'treatment', label: 'Treatments' },
    { id: 'exfoliant', label: 'Exfoliants' },
    { id: 'moisturizer', label: 'Moisturizers' },
    { id: 'sunscreen', label: 'Sunscreens' },
  ];

  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const matchesSearch =
        prod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prod.ingredients.some((ing) => ing.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      if (selectedCategory !== 'all' && prod.type !== selectedCategory) {
        return false;
      }

      const expiry = calculateProductExpiry(prod, todayStr);
      if (selectedExpiryFilter === 'fresh' && expiry.status !== 'fresh') return false;
      if (selectedExpiryFilter === 'expiring-soon' && !expiry.isExpiringSoon) return false;
      if (selectedExpiryFilter === 'expired' && !expiry.isExpired) return false;

      return true;
    });
  }, [products, searchTerm, selectedCategory, selectedExpiryFilter, todayStr]);

  const handleEdit = (prod: Product) => {
    setEditingProduct(prod);
    setIsModalOpen(true);
  };

  const handleSaveProduct = (prodData: Omit<Product, 'id'>) => {
    if (editingProduct) {
      updateProduct(editingProduct.id, prodData);
      setEditingProduct(null);
    } else {
      addProduct(prodData);
    }
  };

  const handleDeleteConfirm = () => {
    if (deletingProductId) {
      deleteProduct(deletingProductId);
      setDeletingProductId(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cream-200">
        <div>
          <span className="text-xs uppercase tracking-widest text-rose-600 font-semibold flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>Product Collection & Shelf Life</span>
          </span>
          <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-cocoa-900 mt-1">
            Skincare Shelf
          </h1>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingProduct(null);
            setIsModalOpen(true);
          }}
          className="btn-primary text-xs self-start sm:self-center shadow-rose-glow"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cocoa-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search shelf by product name or ingredient..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-full border border-cream-200 bg-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400 text-cocoa-900 placeholder:text-cocoa-400"
            />
          </div>

          {/* Expiry filter status */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-semibold text-cocoa-500 mr-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Status:
            </span>
            {['all', 'fresh', 'expiring-soon', 'expired'].map((filterKey) => (
              <button
                key={filterKey}
                type="button"
                onClick={() => setSelectedExpiryFilter(filterKey)}
                className={`px-3 py-1 rounded-full whitespace-nowrap capitalize transition-all ${
                  selectedExpiryFilter === filterKey
                    ? 'bg-cocoa-900 text-white font-medium shadow-2xs'
                    : 'bg-cream-100 text-cocoa-600 hover:bg-cream-200'
                }`}
              >
                {filterKey.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-rose-500 text-white font-medium shadow-2xs'
                  : 'bg-cream-100 text-cocoa-600 hover:bg-cream-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product Shelf Grid or Empty State */}
      {filteredProducts.length === 0 ? (
        <div className="card-editorial p-10 sm:p-14 text-center space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-cream-100 flex items-center justify-center mx-auto text-cocoa-400">
            <BottleIllustration shape="dropper" color="#C496A1" size="lg" />
          </div>
          <div>
            <h3 className="font-editorial text-xl font-semibold text-cocoa-900">
              Your shelf is empty
            </h3>
            <p className="text-xs text-cocoa-500 mt-1 leading-relaxed">
              Add the skincare products you currently use to begin building your personalised routine and weekly calendar.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setEditingProduct(null);
                setIsModalOpen(true);
              }}
              className="btn-primary text-xs w-full sm:w-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add First Product</span>
            </button>
            <button
              type="button"
              onClick={loadSampleData}
              className="btn-outline text-xs w-full sm:w-auto text-cocoa-700"
            >
              <Sparkles className="w-3.5 h-3.5 text-rose-500" />
              <span>Load Sample Shelf</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((prod) => {
            const expiry = calculateProductExpiry(prod, todayStr);
            const isRecentlyOpened =
              prod.openedOn &&
              differenceInCalendarDays(parseISO(todayStr), parseISO(prod.openedOn)) <= 14;

            const isRetinoid = prod.ingredients.some(
              (id) => id === 'retinol' || id === 'adapalene' || id === 'tretinoin' || id === 'tazarotene'
            );

            return (
              <div
                key={prod.id}
                className={`card-editorial p-5 flex flex-col justify-between transition-all relative ${
                  prod.isArchived ? 'opacity-60 bg-cream-50' : 'card-hover'
                }`}
              >
                <div className="space-y-4">
                  {/* Top Bar: Bottle & Badges */}
                  <div className="flex items-start justify-between">
                    <BottleIllustration shape={prod.bottle} color={prod.color} size="md" />

                    <div className="flex flex-col items-end gap-1.5">
                      {/* Expiry Badge */}
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold border ${
                          expiry.isExpired
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : expiry.isExpiringSoon
                            ? 'bg-cream-200 text-cocoa-900 border-cream-400'
                            : 'bg-sage-100 text-sage-900 border-sage-300'
                        }`}
                      >
                        {expiry.status === 'expired'
                          ? 'Expired'
                          : expiry.status === 'expiring-soon'
                          ? `${expiry.daysRemaining}d left`
                          : 'Fresh'}
                      </span>

                      <span className="badge-cream text-[10px] capitalize">
                        {prod.type}
                      </span>
                    </div>
                  </div>

                  {/* Name and Details */}
                  <div>
                    <h3 className="font-editorial text-lg font-semibold text-cocoa-900 leading-snug line-clamp-2">
                      {prod.name}
                    </h3>

                    <div className="flex items-center gap-2 text-[11px] text-cocoa-500 mt-1">
                      <span>Opened: {prod.openedOn || 'Not logged'}</span>
                      <span>•</span>
                      <span>PAO: {prod.monthsValid}M</span>
                    </div>
                  </div>

                  {/* Ingredients Chips */}
                  {prod.ingredients.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {prod.ingredients.map((ing) => (
                        <span
                          key={ing}
                          className="px-2 py-0.5 rounded-md bg-cream-100 text-[10px] font-medium text-cocoa-700"
                        >
                          {ing}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Contextual Patch Test / Retinoid Notes */}
                  {isRecentlyOpened && <PatchTestGuidanceNotice />}
                  {isRetinoid && <RetinoidPregnancyAdvisory />}
                </div>

                {/* Card Actions Footer */}
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-cream-100 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(prod)}
                      className="p-1.5 rounded-full hover:bg-cream-100 text-cocoa-600 hover:text-cocoa-900 transition-colors"
                      aria-label="Edit product"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingProductId(prod.id)}
                      className="p-1.5 rounded-full hover:bg-rose-50 text-cocoa-400 hover:text-rose-600 transition-colors"
                      aria-label="Delete product"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleArchiveProduct(prod.id)}
                    className="text-[11px] text-cocoa-500 hover:text-cocoa-800 underline"
                  >
                    {prod.isArchived ? 'Unarchive' : 'Archive'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Product Add / Edit Modal */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProduct}
        initialProduct={editingProduct}
      />

      {/* Delete Confirmation Dialog */}
      <Modal
        isOpen={Boolean(deletingProductId)}
        onClose={() => setDeletingProductId(null)}
        title="Remove Product"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-cocoa-600 leading-relaxed">
            Are you sure you want to remove this product from your shelf? This will also update any scheduled routines containing it.
          </p>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDeletingProductId(null)}
              className="btn-ghost text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              className="btn-primary text-xs bg-rose-600 hover:bg-rose-700"
            >
              Yes, Remove
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

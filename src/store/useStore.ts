/**
 * Zustand Application State Store
 * Implements versioned local-first persistence with migration support.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Product, Profile, CheckInRecord } from '../types';

export const CURRENT_SCHEMA_VERSION = 1;

interface AuthUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
}

interface AppState {
  version: number;
  user: AuthUser | null;
  profile: Profile;
  products: Product[];
  checkIns: Record<string, CheckInRecord>;

  // Actions
  setUser: (user: AuthUser | null) => void;
  updateProfile: (profile: Partial<Profile>) => void;
  resetOnboarding: () => void;

  addProduct: (product: Omit<Product, 'id'>) => string;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  toggleArchiveProduct: (id: string) => void;

  recordRoutineCheckIn: (date: string, routine: 'am' | 'pm', completed?: boolean) => void;
  recordSkinReaction: (date: string, feel: CheckInRecord['skinFeel'], notes?: string) => void;

  exportData: () => string;
  importData: (jsonString: string) => { success: boolean; message: string };
  clearAllData: () => void;
  loadSampleData: () => void;
}

const DEFAULT_PROFILE: Profile = {
  skinType: 'combination',
  concerns: ['acne', 'barrier'],
  sensitive: false,
  excludedIngredients: [],
  experienceLevel: 'beginner',
  pregnancyOrNursing: false,
  isOnboarded: false,
};

export const SAMPLE_PRODUCTS: Product[] = [
  {
    id: 'prod-cleanser-1',
    name: 'Gentle Hydrating Cleanser',
    type: 'cleanser',
    ingredients: ['glycerin', 'ceramides', 'panthenol'],
    productForm: 'rinse-off',
    openedOn: '2026-09-01',
    monthsValid: 12,
    bottle: 'pump',
    color: '#919D85',
    isCombinationProduct: false,
  },
  {
    id: 'prod-toner-1',
    name: 'Glycolic Resurfacing Toner',
    type: 'toner',
    ingredients: ['glycolic-acid', 'allantoin'],
    productForm: 'leave-on',
    openedOn: '2026-09-15',
    monthsValid: 6,
    bottle: 'tube',
    color: '#C496A1',
    isCombinationProduct: false,
  },
  {
    id: 'prod-serum-retinol',
    name: 'Pure Retinol 0.2% Night Serum',
    type: 'serum',
    ingredients: ['retinol', 'squalane'],
    productForm: 'leave-on',
    openedOn: '2026-10-01',
    monthsValid: 6,
    bottle: 'dropper',
    color: '#8E88A3',
    isCombinationProduct: false,
    directions: {
      source: 'default',
      nightsPerWeek: 3,
      time: 'PM',
    },
  },
  {
    id: 'prod-serum-niacinamide',
    name: 'Niacinamide 5% Balancing Serum',
    type: 'serum',
    ingredients: ['niacinamide', 'hyaluronic-acid', 'panthenol'],
    productForm: 'leave-on',
    openedOn: '2026-08-20',
    monthsValid: 12,
    bottle: 'dropper',
    color: '#EBE1C6',
    isCombinationProduct: false,
  },
  {
    id: 'prod-cream-1',
    name: 'Ceramide Moisture Barrier Cream',
    type: 'moisturizer',
    ingredients: ['ceramides', 'hyaluronic-acid', 'glycerin', 'centella'],
    productForm: 'leave-on',
    openedOn: '2026-08-10',
    monthsValid: 12,
    bottle: 'jar',
    color: '#919D85',
    isCombinationProduct: false,
  },
  {
    id: 'prod-spf-1',
    name: 'Daily Dew Sunscreen Broad Spectrum SPF 50',
    type: 'sunscreen',
    ingredients: ['sunscreen-filters', 'centella', 'allantoin'],
    productForm: 'leave-on',
    openedOn: '2026-09-10',
    monthsValid: 12,
    bottle: 'tube',
    color: '#EBE1C6',
    isCombinationProduct: false,
  },
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      version: CURRENT_SCHEMA_VERSION,
      user: null,
      profile: DEFAULT_PROFILE,
      products: [],
      checkIns: {},

      setUser: (user) => set({ user }),

      updateProfile: (updates) =>
        set((state) => ({
          profile: { ...state.profile, ...updates },
        })),

      resetOnboarding: () =>
        set((state) => ({
          profile: { ...state.profile, isOnboarded: false },
        })),

      addProduct: (productData) => {
        const id = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const newProduct: Product = { ...productData, id };
        set((state) => ({
          products: [...state.products, newProduct],
        }));
        return id;
      },

      updateProduct: (id, updates) =>
        set((state) => ({
          products: state.products.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),

      deleteProduct: (id) =>
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        })),

      toggleArchiveProduct: (id) =>
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, isArchived: !p.isArchived } : p
          ),
        })),

      recordRoutineCheckIn: (date, routine, completed) =>
        set((state) => {
          const current = state.checkIns[date] || { am: false, pm: false };
          const nextVal = completed !== undefined ? completed : !current[routine];
          return {
            checkIns: {
              ...state.checkIns,
              [date]: {
                ...current,
                [routine]: nextVal,
                updatedAt: new Date().toISOString(),
              },
            },
          };
        }),

      recordSkinReaction: (date, feel, notes) =>
        set((state) => {
          const current = state.checkIns[date] || { am: false, pm: false };
          return {
            checkIns: {
              ...state.checkIns,
              [date]: {
                ...current,
                skinFeel: feel,
                notes: notes ?? current.notes,
                updatedAt: new Date().toISOString(),
              },
            },
          };
        }),

      exportData: () => {
        const { version, profile, products, checkIns } = get();
        const exportPayload = {
          app: 'Skincare Routine Builder',
          version,
          exportedAt: new Date().toISOString(),
          data: {
            profile,
            products,
            checkIns,
          },
        };
        return JSON.stringify(exportPayload, null, 2);
      },

      importData: (jsonString: string) => {
        try {
          const parsed = JSON.parse(jsonString);
          if (!parsed || typeof parsed !== 'object') {
            return { success: false, message: 'Invalid JSON file.' };
          }
          const imported = parsed.data || parsed;
          if (!imported.profile && !imported.products) {
            return {
              success: false,
              message: 'JSON missing required profile or products structure.',
            };
          }

          set((state) => ({
            profile: imported.profile ? { ...state.profile, ...imported.profile } : state.profile,
            products: Array.isArray(imported.products) ? imported.products : state.products,
            checkIns: imported.checkIns && typeof imported.checkIns === 'object'
              ? { ...state.checkIns, ...imported.checkIns }
              : state.checkIns,
          }));

          return { success: true, message: 'Data imported successfully.' };
        } catch (err: any) {
          return { success: false, message: `Failed to import data: ${err.message}` };
        }
      },

      clearAllData: () =>
        set({
          profile: DEFAULT_PROFILE,
          products: [],
          checkIns: {},
        }),

      loadSampleData: () =>
        set({
          profile: {
            skinType: 'combination',
            concerns: ['acne', 'barrier', 'dullness'],
            sensitive: false,
            excludedIngredients: [],
            experienceLevel: 'intermediate',
            pregnancyOrNursing: false,
            isOnboarded: true,
          },
          products: SAMPLE_PRODUCTS,
          checkIns: {
            '2026-10-27': { am: true, pm: true, skinFeel: 'great' },
            '2026-10-28': { am: true, pm: true, skinFeel: 'good' },
            '2026-10-29': { am: true, pm: false, skinFeel: 'neutral' },
          },
        }),
    }),
    {
      name: 'skincare-routine-builder-storage',
      version: CURRENT_SCHEMA_VERSION,
      storage: createJSONStorage(() => localStorage),
      // Don't persist `user`: it is set from Firebase auth on every load
      partialize: (state) => ({
        version: state.version,
        profile: state.profile,
        products: state.products,
        checkIns: state.checkIns,
      }),
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Schema 0 -> 1 migration if needed
          return {
            ...persistedState,
            version: CURRENT_SCHEMA_VERSION,
          };
        }
        return persistedState as AppState;
      },
    }
  )
);
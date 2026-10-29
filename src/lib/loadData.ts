/**
 * Skincare Data Loader
 * Loads and validates static reference JSON files once at startup.
 */

import ingredientsJson from '../data/ingredients.json';
import conflictsJson from '../data/conflicts.json';
import frequenciesJson from '../data/frequencies.json';
import sourcesJson from '../data/sources.json';
import { ReferenceData } from '../types';
import { validateReferenceData, DataValidationError } from './validateData';

let cachedData: ReferenceData | null = null;

export function loadReferenceData(): ReferenceData {
  if (cachedData) {
    return cachedData;
  }

  const rawData: ReferenceData = {
    ingredients: (ingredientsJson as any).ingredients,
    tags: (ingredientsJson as any).tags,
    rules: (conflictsJson as any).rules,
    reviewedNoRule: (conflictsJson as any).reviewedNoRule,
    frequencies: (frequenciesJson as any).ingredients,
    scheduling: (frequenciesJson as any).scheduling,
    sources: (sourcesJson as any).sources,
  };

  const validationErrors = validateReferenceData(rawData);
  if (validationErrors.length > 0) {
    throw new DataValidationError(validationErrors);
  }

  cachedData = rawData;
  return cachedData;
}


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
    ingredients: (ingredientsJson as unknown as { ingredients: ReferenceData['ingredients'] }).ingredients,
    tags: (ingredientsJson as unknown as { tags: ReferenceData['tags'] }).tags,
    rules: (conflictsJson as unknown as { rules: ReferenceData['rules'] }).rules,
    reviewedNoRule: (conflictsJson as unknown as { reviewedNoRule: ReferenceData['reviewedNoRule'] }).reviewedNoRule,
    frequencies: (frequenciesJson as unknown as { ingredients: ReferenceData['frequencies'] }).ingredients,
    scheduling: (frequenciesJson as unknown as { scheduling: ReferenceData['scheduling'] }).scheduling,
    sources: (sourcesJson as unknown as { sources: ReferenceData['sources'] }).sources,
  };

  const validationErrors = validateReferenceData(rawData);
  if (validationErrors.length > 0) {
    throw new DataValidationError(validationErrors);
  }

  cachedData = rawData;
  return cachedData;
}


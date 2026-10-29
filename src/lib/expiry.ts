/**
 * Expiry and Period After Opening (PAO) Calculator
 * Pure TypeScript functions dealing with YYYY-MM-DD local strings.
 */

import { addMonths, differenceInCalendarDays, parseISO, isValid } from 'date-fns';
import { Product } from '../types';

export type ExpiryStatus = 'fresh' | 'expiring-soon' | 'expired' | 'unknown';

export interface ExpiryCalculation {
  status: ExpiryStatus;
  daysRemaining: number | null;
  calculatedExpiryDate: string | null;
  isExpired: boolean;
  isExpiringSoon: boolean;
  message: string;
}

/**
 * Calculates expiry information for a product relative to a given 'today' (YYYY-MM-DD).
 */
export function calculateProductExpiry(
  product: Product,
  todayString: string
): ExpiryCalculation {
  if (!product.openedOn) {
    return {
      status: 'unknown',
      daysRemaining: null,
      calculatedExpiryDate: null,
      isExpired: false,
      isExpiringSoon: false,
      message: 'Opening date not recorded.',
    };
  }

  // Validate openedOn format YYYY-MM-DD
  const openedDate = parseISO(product.openedOn);
  const todayDate = parseISO(todayString);

  if (!isValid(openedDate) || !isValid(todayDate)) {
    return {
      status: 'unknown',
      daysRemaining: null,
      calculatedExpiryDate: null,
      isExpired: false,
      isExpiringSoon: false,
      message: 'Invalid date format.',
    };
  }

  // Check if openedOn is in the future
  if (differenceInCalendarDays(openedDate, todayDate) > 0) {
    return {
      status: 'unknown',
      daysRemaining: null,
      calculatedExpiryDate: null,
      isExpired: false,
      isExpiringSoon: false,
      message: 'Opening date cannot be in the future.',
    };
  }

  const months = product.monthsValid || 12;
  const expiryDate = addMonths(openedDate, months);
  const expiryDateString = expiryDate.toISOString().split('T')[0];

  const daysRemaining = differenceInCalendarDays(expiryDate, todayDate);

  if (daysRemaining < 0) {
    return {
      status: 'expired',
      daysRemaining,
      calculatedExpiryDate: expiryDateString,
      isExpired: true,
      isExpiringSoon: false,
      message: `Expired ${Math.abs(daysRemaining)} day(s) ago. PAO: ${months}M.`,
    };
  }

  if (daysRemaining <= 30) {
    return {
      status: 'expiring-soon',
      daysRemaining,
      calculatedExpiryDate: expiryDateString,
      isExpired: false,
      isExpiringSoon: true,
      message: `Expiring soon: ${daysRemaining} day(s) remaining.`,
    };
  }

  return {
    status: 'fresh',
    daysRemaining,
    calculatedExpiryDate: expiryDateString,
    isExpired: false,
    isExpiringSoon: false,
    message: `Fresh: ${daysRemaining} day(s) remaining.`,
  };
}


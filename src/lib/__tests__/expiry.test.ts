import { describe, it, expect } from 'vitest';
import { calculateProductExpiry } from '../expiry';
import { Product } from '../../types';

describe('Expiry and PAO Calculator', () => {
  const baseProduct: Product = {
    id: 'test-serum',
    name: 'Hydrating Serum',
    type: 'serum',
    ingredients: ['hyaluronic-acid'],
    productForm: 'leave-on',
    openedOn: '2026-06-01',
    monthsValid: 6, // Expires 2026-12-01
    bottle: 'dropper',
    color: '#C496A1',
    isCombinationProduct: false,
  };

  it('calculates fresh product status with correct remaining days', () => {
    // Check on 2026-08-01 (2 months after opening, 4 months left)
    const result = calculateProductExpiry(baseProduct, '2026-08-01');
    expect(result.status).toBe('fresh');
    expect(result.isExpired).toBe(false);
    expect(result.isExpiringSoon).toBe(false);
    expect(result.daysRemaining).toBe(122);
  });

  it('calculates expiring-soon status when <= 30 days remain', () => {
    // 2026-11-15 is 16 days before 2026-12-01
    const result = calculateProductExpiry(baseProduct, '2026-11-15');
    expect(result.status).toBe('expiring-soon');
    expect(result.isExpiringSoon).toBe(true);
    expect(result.isExpired).toBe(false);
    expect(result.daysRemaining).toBe(16);
  });

  it('calculates expired status when date passes expiry', () => {
    // Check on 2026-12-05 (4 days expired)
    const result = calculateProductExpiry(baseProduct, '2026-12-05');
    expect(result.status).toBe('expired');
    expect(result.isExpired).toBe(true);
    expect(result.daysRemaining).toBe(-4);
  });

  it('rejects future opening date with clear message', () => {
    const futureProduct: Product = {
      ...baseProduct,
      openedOn: '2026-12-01',
    };
    const result = calculateProductExpiry(futureProduct, '2026-10-01');
    expect(result.status).toBe('unknown');
    expect(result.message).toContain('Opening date cannot be in the future');
  });

  it('handles missing openedOn date as unknown', () => {
    const unOpened: Product = {
      ...baseProduct,
      openedOn: '',
    };
    const result = calculateProductExpiry(unOpened, '2026-10-01');
    expect(result.status).toBe('unknown');
    expect(result.daysRemaining).toBeNull();
  });
});


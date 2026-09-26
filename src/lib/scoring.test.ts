import { describe, expect, it } from 'vitest';
import {
  DEFAULT_WEIGHTS,
  UNKNOWN_SCORE,
  deliveryScore,
  distanceScore,
  hoursScore,
  productScore,
  rankCafes,
  ratingScore,
} from './scoring';
import { toCafe } from './places';
import type { Cafe, Filters } from './types';

const origin = { lat: -36.8485, lng: 174.7633 };
const now = new Date('2026-09-26T09:00:00Z');
const inMinutes = (m: number) => new Date(now.getTime() + m * 60_000).toISOString();

function cafe(overrides: Partial<Cafe> = {}): Cafe {
  return {
    id: 'x',
    name: 'Test',
    address: '',
    location: origin,
    rating: 4.5,
    ratingCount: 200,
    openNow: true,
    nextCloseTime: inMinutes(240),
    delivery: true,
    products: { coffee: true },
    ...overrides,
  };
}

const filters: Filters = {
  openNowOnly: false,
  deliveryOnly: false,
  radiusMeters: 5000,
  wantedProducts: [],
};

describe('ratingScore', () => {
  it('trusts many reviews more than few', () => {
    expect(ratingScore(5, 1000)).toBeGreaterThan(ratingScore(5, 3));
  });
  it('returns the unknown score with no reviews', () => {
    expect(ratingScore(undefined, undefined)).toBe(UNKNOWN_SCORE);
    expect(ratingScore(4.8, 0)).toBe(UNKNOWN_SCORE);
  });
  it('stays within 0–1', () => {
    expect(ratingScore(1, 5000)).toBe(0);
    expect(ratingScore(5, 1_000_000)).toBeCloseTo(1, 2);
  });
});

describe('distanceScore', () => {
  it('halves every 750 m', () => {
    expect(distanceScore(0)).toBe(1);
    expect(distanceScore(750)).toBeCloseTo(0.5);
    expect(distanceScore(1500)).toBeCloseTo(0.25);
  });
});

describe('hoursScore', () => {
  it('is 0 when closed', () => {
    expect(hoursScore(cafe({ openNow: false }), now)).toBe(0);
  });
  it('scales down when closing soon', () => {
    expect(hoursScore(cafe({ nextCloseTime: inMinutes(45) }), now)).toBeCloseTo(0.5);
    expect(hoursScore(cafe({ nextCloseTime: inMinutes(300) }), now)).toBe(1);
  });
  it('treats open with no close time as 24 hours', () => {
    expect(hoursScore(cafe({ nextCloseTime: undefined }), now)).toBe(1);
  });
  it('returns the unknown score with no hours', () => {
    expect(hoursScore(cafe({ openNow: undefined }), now)).toBe(UNKNOWN_SCORE);
  });
});

describe('productScore', () => {
  const c = cafe({ products: { coffee: true, brunch: false } });
  it('is 1 when nothing is wanted', () => {
    expect(productScore(c, [])).toBe(1);
  });
  it('averages yes (1), no (0) and unknown (0.5)', () => {
    expect(productScore(c, ['coffee', 'brunch', 'dessert'])).toBeCloseTo(0.5);
  });
});

describe('deliveryScore', () => {
  it('maps true/false/unknown', () => {
    expect(deliveryScore(cafe({ delivery: true }))).toBe(1);
    expect(deliveryScore(cafe({ delivery: false }))).toBe(0);
    expect(deliveryScore(cafe({ delivery: undefined }))).toBe(UNKNOWN_SCORE);
  });
});

describe('rankCafes', () => {
  const near = cafe({ id: 'near', location: { lat: origin.lat + 0.001, lng: origin.lng } });
  const far = cafe({ id: 'far', location: { lat: origin.lat + 0.02, lng: origin.lng } });
  const closed = cafe({ id: 'closed', openNow: false });
  const noDelivery = cafe({ id: 'nodel', delivery: false });

  it('ranks a nearer cafe above an otherwise equal further cafe', () => {
    const ids = rankCafes([far, near], origin, DEFAULT_WEIGHTS, filters, now).map((r) => r.cafe.id);
    expect(ids).toEqual(['near', 'far']);
  });

  it('applies the radius, open-now and delivery filters', () => {
    const all = [near, far, closed, noDelivery];
    const r = (f: Partial<Filters>) =>
      rankCafes(all, origin, DEFAULT_WEIGHTS, { ...filters, ...f }, now).map((x) => x.cafe.id);
    expect(r({ radiusMeters: 1000 })).not.toContain('far');
    expect(r({ openNowOnly: true })).not.toContain('closed');
    expect(r({ deliveryOnly: true })).not.toContain('nodel');
  });

  it('lets weights change the order', () => {
    const topRated = cafe({ id: 'top', rating: 4.9, ratingCount: 900, location: far.location });
    const meh = cafe({ id: 'meh', rating: 3.6, ratingCount: 900, location: near.location });
    const ratingOnly = { rating: 1, distance: 0, products: 0, hours: 0, delivery: 0 };
    const distanceOnly = { rating: 0, distance: 1, products: 0, hours: 0, delivery: 0 };
    expect(rankCafes([meh, topRated], origin, ratingOnly, filters, now)[0].cafe.id).toBe('top');
    expect(rankCafes([meh, topRated], origin, distanceOnly, filters, now)[0].cafe.id).toBe('meh');
  });

  it('returns 0 scores when all weights are 0', () => {
    const zero = { rating: 0, distance: 0, products: 0, hours: 0, delivery: 0 };
    expect(rankCafes([near], origin, zero, filters, now)[0].score).toBe(0);
  });
});

describe('toCafe', () => {
  it('normalises a Places API response', () => {
    const c = toCafe({
      id: 'abc',
      displayName: { text: 'Cafe A' },
      location: { latitude: 1, longitude: 2 },
      types: ['coffee_shop', 'bakery'],
      currentOpeningHours: { openNow: true, nextCloseTime: '2026-09-26T17:00:00Z' },
      priceLevel: 'PRICE_LEVEL_MODERATE',
      delivery: true,
    });
    expect(c.name).toBe('Cafe A');
    expect(c.location).toEqual({ lat: 1, lng: 2 });
    expect(c.products.coffee).toBe(true);
    expect(c.products.bakery).toBe(true);
    expect(c.products.brunch).toBeUndefined();
    expect(c.priceLevel).toBe(2);
    expect(c.openNow).toBe(true);
  });
});

import { haversineMeters } from './geo';
import type { Cafe, Filters, LatLng, RankedCafe, ScoreBreakdown, Weights } from './types';

export const DEFAULT_WEIGHTS: Weights = {
  rating: 3,
  distance: 3,
  products: 1,
  hours: 2,
  delivery: 1,
};

/** Score used when Google has no data for a signal. */
export const UNKNOWN_SCORE = 0.5;

/** Bayesian prior: a cafe with few reviews is pulled towards this rating. */
const PRIOR_RATING = 4.0;
const PRIOR_WEIGHT = 25;

/** Distance at which the closeness score halves. About a 9 minute walk. */
const DISTANCE_HALF_LIFE_M = 750;

/** A cafe that stays open this long or longer gets a full hours score. */
const COMFORTABLE_OPEN_MINUTES = 90;

export function ratingScore(rating?: number, count?: number): number {
  if (rating === undefined || !count) return UNKNOWN_SCORE;
  const adjusted = (count * rating + PRIOR_WEIGHT * PRIOR_RATING) / (count + PRIOR_WEIGHT);
  // Almost all cafes sit between 3 and 5 stars, so spread that band over 0–1.
  return clamp01((adjusted - 3) / 2);
}

export function distanceScore(meters: number): number {
  return Math.pow(0.5, meters / DISTANCE_HALF_LIFE_M);
}

export function productScore(cafe: Cafe, wanted: Filters['wantedProducts']): number {
  if (wanted.length === 0) return 1;
  const total = wanted.reduce((sum, p) => {
    const has = cafe.products[p];
    return sum + (has === undefined ? UNKNOWN_SCORE : has ? 1 : 0);
  }, 0);
  return total / wanted.length;
}

export function hoursScore(cafe: Cafe, now: Date): number {
  if (cafe.openNow === undefined) return UNKNOWN_SCORE;
  if (!cafe.openNow) return 0;
  if (!cafe.nextCloseTime) return 1; // open 24 hours
  const minutesLeft = (Date.parse(cafe.nextCloseTime) - now.getTime()) / 60_000;
  return clamp01(minutesLeft / COMFORTABLE_OPEN_MINUTES);
}

export function deliveryScore(cafe: Cafe): number {
  if (cafe.delivery === undefined) return UNKNOWN_SCORE;
  return cafe.delivery ? 1 : 0;
}

export function rankCafes(
  cafes: Cafe[],
  origin: LatLng,
  weights: Weights,
  filters: Filters,
  now: Date = new Date(),
): RankedCafe[] {
  const weightSum =
    weights.rating + weights.distance + weights.products + weights.hours + weights.delivery;

  return cafes
    .map((cafe) => {
      const distanceMeters = haversineMeters(origin, cafe.location);
      const breakdown: ScoreBreakdown = {
        rating: ratingScore(cafe.rating, cafe.ratingCount),
        distance: distanceScore(distanceMeters),
        products: productScore(cafe, filters.wantedProducts),
        hours: hoursScore(cafe, now),
        delivery: deliveryScore(cafe),
      };
      const weighted =
        weightSum === 0
          ? 0
          : (weights.rating * breakdown.rating +
              weights.distance * breakdown.distance +
              weights.products * breakdown.products +
              weights.hours * breakdown.hours +
              weights.delivery * breakdown.delivery) /
            weightSum;
      return { cafe, distanceMeters, breakdown, score: Math.round(weighted * 100) };
    })
    .filter((r) => r.distanceMeters <= filters.radiusMeters)
    .filter((r) => !filters.openNowOnly || r.cafe.openNow === true)
    .filter((r) => !filters.deliveryOnly || r.cafe.delivery === true)
    .sort((a, b) => b.score - a.score || a.distanceMeters - b.distanceMeters);
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

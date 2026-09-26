import type { Cafe, LatLng } from './types';

const ENDPOINT = 'https://places.googleapis.com/v1/places:searchNearby';

/** Google allows at most 20 results per Nearby Search request. */
const MAX_RESULTS = 20;

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.rating',
  'places.userRatingCount',
  'places.currentOpeningHours',
  'places.businessStatus',
  'places.delivery',
  'places.takeout',
  'places.dineIn',
  'places.servesCoffee',
  'places.servesBreakfast',
  'places.servesBrunch',
  'places.servesLunch',
  'places.servesDessert',
  'places.servesVegetarianFood',
  'places.types',
  'places.priceLevel',
  'places.googleMapsUri',
].join(',');

const PRICE_LEVELS: Record<string, number> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

/** Subset of the Places API (New) Place resource that we request. */
export interface PlaceResponse {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  currentOpeningHours?: { openNow?: boolean; nextCloseTime?: string; nextOpenTime?: string };
  businessStatus?: string;
  delivery?: boolean;
  takeout?: boolean;
  dineIn?: boolean;
  servesCoffee?: boolean;
  servesBreakfast?: boolean;
  servesBrunch?: boolean;
  servesLunch?: boolean;
  servesDessert?: boolean;
  servesVegetarianFood?: boolean;
  types?: string[];
  priceLevel?: string;
  googleMapsUri?: string;
}

/**
 * Fetches cafes around a point. Makes two requests (closest first and most
 * popular first) and merges them, so that a well-rated cafe slightly further
 * away is not cut off by the 20-result limit.
 */
export async function fetchNearbyCafes(
  apiKey: string,
  center: LatLng,
  radiusMeters: number,
  signal?: AbortSignal,
): Promise<Cafe[]> {
  const [byDistance, byPopularity] = await Promise.all([
    searchNearby(apiKey, center, radiusMeters, 'DISTANCE', signal),
    searchNearby(apiKey, center, radiusMeters, 'POPULARITY', signal),
  ]);

  const byId = new Map<string, PlaceResponse>();
  for (const place of [...byDistance, ...byPopularity]) byId.set(place.id, place);

  return [...byId.values()]
    .filter((p) => p.location && (!p.businessStatus || p.businessStatus === 'OPERATIONAL'))
    .map(toCafe);
}

async function searchNearby(
  apiKey: string,
  center: LatLng,
  radiusMeters: number,
  rankPreference: 'DISTANCE' | 'POPULARITY',
  signal?: AbortSignal,
): Promise<PlaceResponse[]> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify({
      includedTypes: ['cafe', 'coffee_shop'],
      maxResultCount: MAX_RESULTS,
      rankPreference,
      locationRestriction: {
        circle: {
          center: { latitude: center.lat, longitude: center.lng },
          // Google caps the radius at 50 km.
          radius: Math.min(radiusMeters, 50_000),
        },
      },
    }),
  });

  if (!res.ok) {
    let message = `Google Places request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error?.message) message += `: ${body.error.message}`;
    } catch {
      // Keep the status-only message.
    }
    throw new Error(message);
  }

  const data = (await res.json()) as { places?: PlaceResponse[] };
  return data.places ?? [];
}

export function toCafe(p: PlaceResponse): Cafe {
  const types = p.types ?? [];
  const isCoffeePlace = types.includes('coffee_shop') || types.includes('cafe');
  return {
    id: p.id,
    name: p.displayName?.text ?? 'Unnamed cafe',
    address: p.formattedAddress ?? '',
    location: { lat: p.location!.latitude, lng: p.location!.longitude },
    rating: p.rating,
    ratingCount: p.userRatingCount,
    openNow: p.currentOpeningHours?.openNow,
    nextCloseTime: p.currentOpeningHours?.nextCloseTime,
    nextOpenTime: p.currentOpeningHours?.nextOpenTime,
    delivery: p.delivery,
    takeout: p.takeout,
    dineIn: p.dineIn,
    products: {
      // A coffee shop serves coffee even when Google leaves servesCoffee empty.
      coffee: p.servesCoffee ?? (isCoffeePlace ? true : undefined),
      breakfast: p.servesBreakfast,
      brunch: p.servesBrunch,
      lunch: p.servesLunch,
      dessert: p.servesDessert,
      vegetarian: p.servesVegetarianFood,
      bakery: types.includes('bakery') ? true : undefined,
    },
    priceLevel: p.priceLevel ? PRICE_LEVELS[p.priceLevel] : undefined,
    mapsUrl: p.googleMapsUri,
  };
}

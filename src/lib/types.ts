export interface LatLng {
  lat: number;
  lng: number;
}

/** Products we can detect from Google Places data. */
export type Product =
  | 'coffee'
  | 'breakfast'
  | 'brunch'
  | 'lunch'
  | 'dessert'
  | 'vegetarian'
  | 'bakery';

export const PRODUCTS: { id: Product; label: string }[] = [
  { id: 'coffee', label: 'Coffee' },
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'brunch', label: 'Brunch' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dessert', label: 'Dessert' },
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'bakery', label: 'Bakery' },
];

/** A cafe, normalised from the Google Places API (New) response. */
export interface Cafe {
  id: string;
  name: string;
  address: string;
  location: LatLng;
  rating?: number;
  ratingCount?: number;
  /** undefined when Google has no hours for the place. */
  openNow?: boolean;
  /** ISO time the cafe next closes (when open). */
  nextCloseTime?: string;
  /** ISO time the cafe next opens (when closed). */
  nextOpenTime?: string;
  delivery?: boolean;
  takeout?: boolean;
  dineIn?: boolean;
  /** Per-product availability. A missing key means Google does not know. */
  products: Partial<Record<Product, boolean>>;
  priceLevel?: number;
  mapsUrl?: string;
}

export interface Weights {
  rating: number;
  distance: number;
  products: number;
  hours: number;
  delivery: number;
}

export interface Filters {
  openNowOnly: boolean;
  deliveryOnly: boolean;
  radiusMeters: number;
  wantedProducts: Product[];
}

export interface ScoreBreakdown {
  rating: number;
  distance: number;
  products: number;
  hours: number;
  delivery: number;
}

export interface RankedCafe {
  cafe: Cafe;
  distanceMeters: number;
  /** 0–100 */
  score: number;
  breakdown: ScoreBreakdown;
}

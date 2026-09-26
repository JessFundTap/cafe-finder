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
  | 'bakery'
  | 'oatMilk'
  | 'specialty'
  | 'filter'
  | 'coldBrew';

export const PRODUCTS: { id: Product; label: string }[] = [
  { id: 'coffee', label: 'Coffee' },
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'brunch', label: 'Brunch' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dessert', label: 'Dessert' },
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'bakery', label: 'Bakery' },
  { id: 'oatMilk', label: 'Oat milk' },
  { id: 'specialty', label: 'Specialty beans' },
  { id: 'filter', label: 'Filter / pour over' },
  { id: 'coldBrew', label: 'Cold brew' },
];

/** Products that only come from review text, so "not found" means unknown, not "no". */
export const REVIEW_PRODUCTS: Product[] = ['oatMilk', 'specialty', 'filter', 'coldBrew'];

export interface Review {
  text: string;
  rating?: number;
  author?: string;
  authorUrl?: string;
  /** For example "2 weeks ago". */
  when?: string;
}

/** What the written reviews say about the coffee. */
export interface CoffeeInsight {
  /** 0–1. undefined when no review talks about the coffee. */
  score?: number;
  /** Number of review sentences that talk about the coffee. */
  mentions: number;
  positive: number;
  negative: number;
  reviewCount: number;
  /** Drinks that reviewers name, most mentioned first. */
  drinks: string[];
  /** Coffee-related products found in the text. */
  products: Product[];
  /** Negative words used about the coffee, for example "bitter" or "lukewarm". */
  warnings: string[];
  quote?: { text: string; author?: string; authorUrl?: string; positive: boolean };
}

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
  coffee?: CoffeeInsight;
}

export interface Weights {
  coffee: number;
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
  coffee: number;
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

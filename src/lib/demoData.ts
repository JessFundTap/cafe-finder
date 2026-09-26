import { analyzeCoffee } from './reviews';
import type { Cafe, LatLng, Review } from './types';

const NAMES = [
  'Flat White Society', 'The Daily Grind', 'Bean There', 'Crema Corner', 'Little Roastery',
  'Pour Over Lab', 'Espresso Yourself', 'Milk & Honey', 'Brew Brothers', 'Morning Ritual',
  'Common Grounds', 'The Steam Room', 'Kōwhai Coffee', 'Northside Beans', 'Third Wave',
  'Golden Cup', 'Cortado Club', 'Harbour Coffee Co.', 'Latte Da', 'Drip & Co.',
];

const AUTHORS = ['Aroha T.', 'Sam K.', 'Priya N.', 'Liam W.', 'Mere H.', 'Tom B.', 'Jess L.', 'Ana R.'];

/** Sample review sentences, from very good coffee to poor coffee. */
const REVIEW_BANK: string[][] = [
  [
    'Best flat white in the city, silky and perfectly balanced.',
    'They roast their own beans and you can taste it. The single origin pour over was incredible.',
    'Great oat milk options and the baristas really know their stuff.',
    'Smooth espresso with lovely crema. Worth the walk.',
  ],
  [
    'Consistently good coffee and friendly staff.',
    'My long black was rich and tasty. Cold brew is great on a hot day.',
    'Nice cabinet food, coffee is solid.',
    'Oat flat white was lovely.',
  ],
  [
    'Coffee is average, nothing special.',
    'Nice spot to sit but the latte was a bit weak.',
    'Good pastries. Coffee was fine.',
    'Friendly staff, decent cappuccino.',
  ],
  [
    'Coffee was bitter and lukewarm.',
    'The flat white tasted burnt, not great.',
    'Food is good but I would skip the coffee.',
    'Service was slow and my espresso was watery.',
  ],
];

/** Small deterministic PRNG so demo results stay the same between reloads. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Sample cafes around a point, for use when no API key is set. */
export function demoCafes(center: LatLng, now: Date = new Date()): Cafe[] {
  const rand = mulberry32(42);
  const maybe = (pTrue: number, pUnknown = 0.15) => {
    const r = rand();
    if (r < pUnknown) return undefined;
    return r < pUnknown + pTrue * (1 - pUnknown);
  };

  return NAMES.map((name, i) => {
    const bearing = rand() * 2 * Math.PI;
    const distance = 80 + rand() * 1800;
    const dLat = (distance * Math.cos(bearing)) / 111_320;
    const dLng = (distance * Math.sin(bearing)) / (111_320 * Math.cos((center.lat * Math.PI) / 180));
    const open = rand() > 0.2;
    const minutes = Math.round(15 + rand() * 480);
    const at = new Date(now.getTime() + minutes * 60_000).toISOString();

    const quality = Math.floor(rand() * REVIEW_BANK.length);
    const bank = REVIEW_BANK[quality];
    const reviews: Review[] = bank
      .filter(() => rand() > 0.25)
      .map((text, j) => ({
        text,
        rating: 5 - quality + (rand() > 0.7 ? -1 : 0),
        author: AUTHORS[(i + j) % AUTHORS.length],
      }));
    const coffee = analyzeCoffee(reviews);

    return {
      id: `demo-${i}`,
      name,
      address: `${10 + i * 7} Sample Street`,
      location: { lat: center.lat + dLat, lng: center.lng + dLng },
      rating: Math.round((4.9 - quality * 0.35 - rand() * 0.3) * 10) / 10,
      ratingCount: Math.round(5 + rand() * 900),
      openNow: open,
      nextCloseTime: open ? at : undefined,
      nextOpenTime: open ? undefined : at,
      delivery: maybe(0.45),
      takeout: maybe(0.9),
      dineIn: maybe(0.85),
      products: {
        coffee: true,
        breakfast: maybe(0.6),
        brunch: maybe(0.4),
        lunch: maybe(0.55),
        dessert: maybe(0.5),
        vegetarian: maybe(0.6),
        bakery: rand() > 0.75 ? true : undefined,
        ...Object.fromEntries(coffee.products.map((p) => [p, true])),
      },
      priceLevel: 1 + Math.floor(rand() * 3),
      coffee,
    };
  });
}

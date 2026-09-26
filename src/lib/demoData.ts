import type { Cafe, LatLng } from './types';

const NAMES = [
  'Flat White Society', 'The Daily Grind', 'Bean There', 'Crema Corner', 'Little Roastery',
  'Pour Over Lab', 'Espresso Yourself', 'Milk & Honey', 'Brew Brothers', 'Morning Ritual',
  'Common Grounds', 'The Steam Room', 'Kōwhai Coffee', 'Northside Beans', 'Third Wave',
  'Golden Cup', 'Cortado Club', 'Harbour Coffee Co.', 'Latte Da', 'Drip & Co.',
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
    const distance = 80 + rand() * 2500;
    const dLat = (distance * Math.cos(bearing)) / 111_320;
    const dLng = (distance * Math.sin(bearing)) / (111_320 * Math.cos((center.lat * Math.PI) / 180));
    const open = rand() > 0.2;
    const minutes = Math.round(15 + rand() * 480);
    const at = new Date(now.getTime() + minutes * 60_000).toISOString();

    return {
      id: `demo-${i}`,
      name,
      address: `${10 + i * 7} Sample Street`,
      location: { lat: center.lat + dLat, lng: center.lng + dLng },
      rating: Math.round((3.6 + rand() * 1.4) * 10) / 10,
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
      },
      priceLevel: 1 + Math.floor(rand() * 3),
    };
  });
}

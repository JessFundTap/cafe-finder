import type { CoffeeInsight, Product, Review } from './types';

/**
 * Reads review text for what people say about the coffee. This is a keyword
 * method, not a language model: it finds sentences about coffee, counts
 * positive and negative words in them, and handles simple negation
 * ("not great"). Google returns at most 5 reviews per place, so treat the
 * result as a hint.
 */

const DRINKS: [string, RegExp][] = [
  ['Flat white', /\bflat ?whites?\b/],
  ['Espresso', /\bespressos?\b/],
  ['Long black', /\blong blacks?\b/],
  ['Latte', /\blattes?\b/],
  ['Cappuccino', /\bcappuccinos?\b|\bcappas?\b/],
  ['Cortado', /\bcortados?\b/],
  ['Piccolo', /\bpiccolos?\b/],
  ['Macchiato', /\bmacchiatos?\b/],
  ['Mocha', /\bmochas?\b/],
  ['Americano', /\bamericanos?\b/],
  ['Iced coffee', /\biced (coffee|latte|long black)s?\b/],
  ['Cold brew', /\bcold ?brew\b/],
  ['Filter', /\b(pour ?over|filter coffee|batch brew|v60|aeropress|chemex)\b/],
];

const COFFEE_WORDS =
  /\b(coffees?|espressos?|flat ?whites?|long blacks?|lattes?|cappuccinos?|cappas?|cortados?|piccolos?|macchiatos?|mochas?|americanos?|cold ?brew|pour ?over|filter|brews?|beans?|roast(s|ed|ery|er)?|barista?s?|crema|shots?)\b/;

const PRODUCT_PATTERNS: [Product, RegExp][] = [
  ['oatMilk', /\boat ?(milk)?\b|\boatly\b/],
  ['specialty', /\b(specialty|speciality|single origin|third wave|roast(s|ed)? (their|its) own|own roast|in-house roast|roastery|micro ?roast)/],
  ['filter', /\b(pour ?over|filter coffee|batch brew|v60|aeropress|chemex)\b/],
  ['coldBrew', /\bcold ?brew\b/],
];

const POSITIVE = new Set([
  'amazing', 'awesome', 'balanced', 'beautiful', 'best', 'brilliant', 'consistent', 'creamy',
  'delicious', 'divine', 'excellent', 'exceptional', 'fantastic', 'flavourful', 'flavorful',
  'fresh', 'good', 'gorgeous', 'great', 'incredible', 'love', 'loved', 'lovely', 'nice',
  'outstanding', 'perfect', 'perfectly', 'phenomenal', 'recommend', 'rich', 'silky', 'smooth',
  'spot-on', 'strong', 'superb', 'tasty', 'top', 'wonderful', 'yum', 'yummy',
]);

const NEGATIVE = new Set([
  'acidic', 'average', 'awful', 'bad', 'bitter', 'bland', 'burnt', 'burned', 'cold',
  'disappointing', 'disappointed', 'flat', 'horrible', 'inconsistent', 'lukewarm', 'meh',
  'mediocre', 'overpriced', 'overextracted', 'poor', 'sour', 'stale', 'terrible', 'thin',
  'undrinkable', 'watery', 'weak', 'worst',
]);

/** Negative words worth showing as a warning on the card. */
const WARNING_WORDS = new Set([
  'bitter', 'burnt', 'burned', 'lukewarm', 'watery', 'weak', 'sour', 'stale', 'inconsistent',
  'overpriced', 'cold',
]);

const NEGATORS = new Set(['not', 'no', 'never', "isn't", "wasn't", "aren't", "weren't", "didn't", "don't", 'hardly']);

/** Mentions needed before the score is fully trusted. Fewer mentions pull it towards neutral. */
const FULL_CONFIDENCE_MENTIONS = 4;

export function analyzeCoffee(reviews: Review[]): CoffeeInsight {
  const drinkCounts = new Map<string, number>();
  const products = new Set<Product>();
  const warnings = new Set<string>();
  let mentions = 0;
  let positive = 0;
  let negative = 0;
  let bestQuote: { sentence: string; review: Review; net: number } | undefined;

  for (const review of reviews) {
    const lower = review.text.toLowerCase();
    for (const [product, re] of PRODUCT_PATTERNS) if (re.test(lower)) products.add(product);
    for (const [drink, re] of DRINKS) if (re.test(lower)) drinkCounts.set(drink, (drinkCounts.get(drink) ?? 0) + 1);

    for (const sentence of splitSentences(review.text)) {
      const s = sentence.toLowerCase();
      // "flat white" alone is not negative, so skip "flat" when it is part of the drink name.
      if (!COFFEE_WORDS.test(s)) continue;
      mentions++;

      const words = s.replace(/flat ?whites?/g, 'flatwhite').replace(/cold ?brew/g, 'coldbrew').match(/[a-z'-]+/g) ?? [];
      let pos = 0;
      let neg = 0;
      words.forEach((w, i) => {
        const isPos = POSITIVE.has(w);
        const isNeg = NEGATIVE.has(w);
        if (!isPos && !isNeg) return;
        const negated = words.slice(Math.max(0, i - 3), i).some((p) => NEGATORS.has(p));
        if (isPos !== negated) pos++;
        else {
          neg++;
          if (!negated && WARNING_WORDS.has(w)) warnings.add(w === 'burned' ? 'burnt' : w);
        }
      });
      positive += pos;
      negative += neg;

      const net = pos - neg;
      if (net !== 0 && sentence.length <= 180 && (!bestQuote || Math.abs(net) > Math.abs(bestQuote.net) || (net > 0 && bestQuote.net < 0))) {
        bestQuote = { sentence, review, net };
      }
    }
  }

  let score: number | undefined;
  if (mentions > 0) {
    const total = positive + negative;
    const raw = total === 0 ? 0.5 : positive / total;
    const confidence = Math.min(1, mentions / FULL_CONFIDENCE_MENTIONS);
    score = 0.5 + (raw - 0.5) * confidence;
  }

  return {
    score,
    mentions,
    positive,
    negative,
    reviewCount: reviews.length,
    drinks: [...drinkCounts.entries()].sort((a, b) => b[1] - a[1]).map(([d]) => d),
    products: [...products],
    warnings: [...warnings],
    quote: bestQuote && {
      text: bestQuote.sentence.trim(),
      author: bestQuote.review.author,
      authorUrl: bestQuote.review.authorUrl,
      positive: bestQuote.net > 0,
    },
  };
}

function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

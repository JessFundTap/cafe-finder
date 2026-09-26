import { describe, expect, it } from 'vitest';
import { analyzeCoffee } from './reviews';

const r = (...texts: string[]) => texts.map((text) => ({ text, author: 'A' }));

describe('analyzeCoffee', () => {
  it('returns no score when nobody talks about coffee', () => {
    const c = analyzeCoffee(r('Lovely staff and great scones.'));
    expect(c.mentions).toBe(0);
    expect(c.score).toBeUndefined();
  });

  it('scores praise above complaints', () => {
    const good = analyzeCoffee(r('Best coffee ever.', 'Smooth espresso.', 'Great latte.', 'Perfect flat white.'));
    const bad = analyzeCoffee(r('Coffee was bitter.', 'Burnt espresso.', 'Weak latte.', 'Watery flat white.'));
    expect(good.score!).toBeGreaterThan(0.9);
    expect(bad.score!).toBeLessThan(0.1);
  });

  it('handles negation', () => {
    const c = analyzeCoffee(r('The coffee was not great.'));
    expect(c.negative).toBe(1);
    expect(c.positive).toBe(0);
  });

  it('does not treat "flat white" or "cold brew" as negative', () => {
    const c = analyzeCoffee(r('I had a flat white and a cold brew.'));
    expect(c.negative).toBe(0);
    expect(c.drinks).toEqual(expect.arrayContaining(['Flat white', 'Cold brew']));
  });

  it('pulls a single mention towards neutral', () => {
    const one = analyzeCoffee(r('Great coffee.'));
    const four = analyzeCoffee(r('Great coffee.', 'Great coffee.', 'Great coffee.', 'Great coffee.'));
    expect(one.score!).toBeLessThan(four.score!);
    expect(one.score!).toBeGreaterThan(0.5);
  });

  it('finds coffee products and warnings', () => {
    const c = analyzeCoffee(
      r('They roast their own beans. Oat milk available.', 'V60 pour over was fine but the latte was lukewarm.'),
    );
    expect(c.products).toEqual(expect.arrayContaining(['specialty', 'oatMilk', 'filter']));
    expect(c.warnings).toContain('lukewarm');
  });

  it('prefers a positive quote', () => {
    const c = analyzeCoffee([
      { text: 'The espresso was bitter.', author: 'X' },
      { text: 'Their flat white is superb.', author: 'Y' },
    ]);
    expect(c.quote?.author).toBe('Y');
    expect(c.quote?.positive).toBe(true);
  });
});

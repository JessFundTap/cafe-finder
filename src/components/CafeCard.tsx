import { forwardRef } from 'react';
import { AlertCircle, Bike, Coffee, Navigation, ShoppingBag, Star } from 'lucide-react';
import { formatDistance, walkMinutes } from '../lib/geo';
import { PRODUCTS, REVIEW_PRODUCTS, type RankedCafe, type ScoreBreakdown } from '../lib/types';

interface Props {
  ranked: RankedCafe;
  position: number;
  now: Date;
  selected: boolean;
  onSelect: () => void;
}

const BREAKDOWN_LABELS: Record<keyof ScoreBreakdown, string> = {
  coffee: 'Coffee',
  rating: 'Rating',
  distance: 'Near',
  products: 'Menu',
  hours: 'Hours',
  delivery: 'Delivery',
};

export const CafeCard = forwardRef<HTMLElement, Props>(function CafeCard(
  { ranked, position, now, selected, onSelect },
  ref,
) {
  const { cafe, distanceMeters, score, breakdown } = ranked;
  const coffee = cafe.coffee;
  const best = position === 1;
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${cafe.location.lat},${cafe.location.lng}${
    cafe.mapsUrl ? `&destination_place_id=${cafe.id}` : ''
  }`;
  const coffeeProducts = PRODUCTS.filter((p) => REVIEW_PRODUCTS.includes(p.id) && cafe.products[p.id]);
  const menuProducts = PRODUCTS.filter((p) => !REVIEW_PRODUCTS.includes(p.id) && p.id !== 'coffee' && cafe.products[p.id]);

  return (
    <article
      ref={ref}
      onClick={onSelect}
      className={`cursor-pointer rounded-2xl border bg-white p-4 transition-shadow ${
        selected ? 'border-crema shadow-lg shadow-crema/10' : 'border-line hover:shadow-md'
      }`}
    >
      {best && (
        <p className="mb-2 font-display text-xs font-semibold uppercase tracking-wider text-crema">
          Best coffee near you now
        </p>
      )}

      <div className="flex items-start gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-base font-bold tabular-nums ${
            best ? 'bg-espresso text-white' : 'bg-crema-light text-roast'
          }`}
        >
          {position}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="truncate font-display text-lg font-semibold leading-tight">{cafe.name}</h3>
            <span className="shrink-0 text-sm tabular-nums text-muted">
              <b className="font-semibold text-espresso">{score}</b>/100
            </span>
          </div>

          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted">
            {cafe.rating !== undefined && (
              <span className="flex items-center gap-0.5 text-espresso">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {cafe.rating.toFixed(1)}
                <span className="text-muted">({cafe.ratingCount ?? 0})</span>
              </span>
            )}
            <span>
              {formatDistance(distanceMeters)} · {walkMinutes(distanceMeters)} min walk
            </span>
            <HoursText ranked={ranked} now={now} />
          </p>

          <CoffeeLine ranked={ranked} />

          {coffee?.quote && (
            <blockquote className="mt-2 border-l-2 border-crema-light pl-3 text-sm text-roast">
              “{coffee.quote.text}”
              {coffee.quote.author && (
                <footer className="mt-0.5 text-xs text-muted">
                  {coffee.quote.authorUrl ? (
                    <a
                      href={coffee.quote.authorUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="hover:underline"
                    >
                      {coffee.quote.author}
                    </a>
                  ) : (
                    coffee.quote.author
                  )}{' '}
                  on Google
                </footer>
              )}
            </blockquote>
          )}

          {(coffeeProducts.length > 0 || menuProducts.length > 0 || cafe.delivery || cafe.takeout) && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {coffeeProducts.map((p) => (
                <Tag key={p.id} tone="coffee">
                  {p.label}
                </Tag>
              ))}
              {cafe.delivery && (
                <Tag tone="good">
                  <Bike className="h-3 w-3" /> Delivers
                </Tag>
              )}
              {cafe.takeout && (
                <Tag>
                  <ShoppingBag className="h-3 w-3" /> Takeaway
                </Tag>
              )}
              {menuProducts.map((p) => (
                <Tag key={p.id}>{p.label}</Tag>
              ))}
            </div>
          )}

          {selected && (
            <dl className="mt-3 grid grid-cols-3 gap-x-3 gap-y-2 sm:grid-cols-6">
              {(Object.keys(BREAKDOWN_LABELS) as (keyof ScoreBreakdown)[]).map((k) => (
                <div key={k}>
                  <dt className="truncate text-[11px] text-muted">{BREAKDOWN_LABELS[k]}</dt>
                  <dd className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-line">
                    <div className="h-full rounded-full bg-crema" style={{ width: `${Math.round(breakdown[k] * 100)}%` }} />
                  </dd>
                </div>
              ))}
            </dl>
          )}

          <div className="mt-3 flex items-center gap-2">
            <a
              href={directions}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex h-8 items-center gap-1.5 rounded-full bg-espresso px-3.5 text-sm font-medium text-white hover:bg-roast"
            >
              <Navigation className="h-3.5 w-3.5" /> Directions
            </a>
            {cafe.mapsUrl && (
              <a
                href={cafe.mapsUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex h-8 items-center rounded-full px-3 text-sm font-medium text-roast hover:bg-crema-light"
              >
                Open in Google Maps
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
});

function CoffeeLine({ ranked }: { ranked: RankedCafe }) {
  const coffee = ranked.cafe.coffee;
  if (!coffee || coffee.score === undefined) {
    return (
      <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
        <Coffee className="h-3.5 w-3.5" /> No reviews mention the coffee yet
      </p>
    );
  }
  const out10 = (coffee.score * 10).toFixed(1);
  const tone = coffee.score >= 0.7 ? 'text-sage' : coffee.score >= 0.45 ? 'text-roast' : 'text-brick';
  const detail = [
    `${coffee.mentions} ${coffee.mentions === 1 ? 'mention' : 'mentions'} in ${coffee.reviewCount} reviews`,
    ...coffee.drinks.slice(0, 2),
  ].join(' · ');
  return (
    <div className="mt-2 text-sm">
      <p className={`flex items-center gap-1.5 font-semibold ${tone}`}>
        <Coffee className="h-3.5 w-3.5 shrink-0" /> Coffee {out10}/10
        {coffee.warnings.length > 0 && (
          <span className="flex items-center gap-1 font-normal text-brick">
            <AlertCircle className="h-3.5 w-3.5" /> {coffee.warnings.slice(0, 2).join(', ')}
          </span>
        )}
      </p>
      <p className="pl-5 text-xs text-muted">{detail}</p>
    </div>
  );
}

function HoursText({ ranked, now }: { ranked: RankedCafe; now: Date }) {
  const { cafe } = ranked;
  if (cafe.openNow === undefined) return <span>Hours unknown</span>;
  if (!cafe.openNow) {
    return (
      <span className="text-brick">
        Closed{cafe.nextOpenTime && ` · opens ${formatTime(cafe.nextOpenTime)}`}
      </span>
    );
  }
  if (!cafe.nextCloseTime) return <span className="text-sage">Open 24 hours</span>;
  const minutesLeft = Math.round((Date.parse(cafe.nextCloseTime) - now.getTime()) / 60_000);
  if (minutesLeft <= 45) return <span className="font-medium text-amber-700">Closes in {minutesLeft} min</span>;
  return <span className="text-sage">Open until {formatTime(cafe.nextCloseTime)}</span>;
}

function Tag({ tone, children }: { tone?: 'coffee' | 'good'; children: React.ReactNode }) {
  const cls =
    tone === 'coffee'
      ? 'bg-crema-light text-roast'
      : tone === 'good'
        ? 'bg-emerald-50 text-sage'
        : 'bg-foam text-muted border border-line';
  return <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{children}</span>;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

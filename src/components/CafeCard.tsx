import { Bike, Clock, MapPin, Navigation, ShoppingBag, Star } from 'lucide-react';
import { formatDistance, walkMinutes } from '../lib/geo';
import { PRODUCTS, type RankedCafe, type ScoreBreakdown } from '../lib/types';

interface Props {
  ranked: RankedCafe;
  position: number;
  now: Date;
}

const BREAKDOWN_LABELS: Record<keyof ScoreBreakdown, string> = {
  rating: 'Rating',
  distance: 'Near',
  products: 'Menu',
  hours: 'Hours',
  delivery: 'Delivery',
};

export function CafeCard({ ranked, position, now }: Props) {
  const { cafe, distanceMeters, score, breakdown } = ranked;
  const best = position === 1;
  const directions =
    cafe.mapsUrl ??
    `https://www.google.com/maps/dir/?api=1&destination=${cafe.location.lat},${cafe.location.lng}`;

  return (
    <article
      className={`rounded-xl bg-white p-4 shadow-sm ${best ? 'ring-2 ring-roast-500' : ''}`}
    >
      {best && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-roast-500">
          Best coffee now
        </p>
      )}
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-roast-900 text-white">
          <span className="text-lg font-bold leading-none">{score}</span>
          <span className="text-[10px] text-roast-100">/100</span>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold">
            {position}. {cafe.name}
          </h3>
          <p className="flex items-center gap-1 truncate text-xs text-roast-700">
            <MapPin className="h-3 w-3 shrink-0" />
            {formatDistance(distanceMeters)} · {walkMinutes(distanceMeters)} min walk
            {cafe.address && ` · ${cafe.address}`}
          </p>

          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
            {cafe.rating !== undefined && (
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {cafe.rating.toFixed(1)}
                <span className="text-roast-500">({cafe.ratingCount ?? 0})</span>
              </span>
            )}
            <HoursBadge ranked={ranked} now={now} />
            {cafe.delivery && (
              <span className="flex items-center gap-1 text-emerald-700">
                <Bike className="h-3 w-3" /> Delivers
              </span>
            )}
            {cafe.takeout && (
              <span className="flex items-center gap-1 text-roast-700">
                <ShoppingBag className="h-3 w-3" /> Takeaway
              </span>
            )}
            {cafe.priceLevel !== undefined && cafe.priceLevel > 0 && (
              <span className="text-roast-700">{'$'.repeat(cafe.priceLevel)}</span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-1">
            {PRODUCTS.filter((p) => cafe.products[p.id]).map((p) => (
              <span key={p.id} className="rounded bg-roast-50 px-1.5 py-0.5 text-[11px] text-roast-700">
                {p.label}
              </span>
            ))}
          </div>

          <dl className="mt-3 grid grid-cols-5 gap-2">
            {(Object.keys(BREAKDOWN_LABELS) as (keyof ScoreBreakdown)[]).map((k) => (
              <div key={k}>
                <dt className="truncate text-[10px] text-roast-500">{BREAKDOWN_LABELS[k]}</dt>
                <dd className="h-1.5 overflow-hidden rounded bg-roast-100">
                  <div
                    className="h-full rounded bg-roast-500"
                    style={{ width: `${Math.round(breakdown[k] * 100)}%` }}
                  />
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <a
          href={directions}
          target="_blank"
          rel="noreferrer"
          className="flex shrink-0 items-center gap-1 rounded-full border border-roast-500 px-3 py-1.5 text-xs font-medium text-roast-700 hover:bg-roast-50"
        >
          <Navigation className="h-3 w-3" /> Go
        </a>
      </div>
    </article>
  );
}

function HoursBadge({ ranked, now }: { ranked: RankedCafe; now: Date }) {
  const { cafe } = ranked;
  if (cafe.openNow === undefined) return <span className="text-roast-500">Hours unknown</span>;

  if (!cafe.openNow) {
    return (
      <span className="flex items-center gap-1 text-red-700">
        <Clock className="h-3 w-3" /> Closed
        {cafe.nextOpenTime && ` · opens ${formatTime(cafe.nextOpenTime)}`}
      </span>
    );
  }

  const minutesLeft = cafe.nextCloseTime
    ? Math.round((Date.parse(cafe.nextCloseTime) - now.getTime()) / 60_000)
    : undefined;
  const closingSoon = minutesLeft !== undefined && minutesLeft <= 45;

  return (
    <span className={`flex items-center gap-1 ${closingSoon ? 'text-amber-700' : 'text-emerald-700'}`}>
      <Clock className="h-3 w-3" />
      {minutesLeft === undefined
        ? 'Open 24 hours'
        : closingSoon
          ? `Closes in ${minutesLeft} min`
          : `Open until ${formatTime(cafe.nextCloseTime!)}`}
    </span>
  );
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

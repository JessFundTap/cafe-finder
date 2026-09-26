import { createRef, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Coffee, Loader2, LocateFixed } from 'lucide-react';
import { CafeCard } from './components/CafeCard';
import { FilterBar } from './components/FilterBar';
import { MapView } from './components/MapView';
import { demoCafes } from './lib/demoData';
import { getBrowserLocation } from './lib/geo';
import { fetchNearbyCafes } from './lib/places';
import { DEFAULT_WEIGHTS, rankCafes } from './lib/scoring';
import type { Cafe, Filters, LatLng, Weights } from './lib/types';

const API_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) || undefined;

/** Used when the browser does not share a location. Auckland CBD. */
const FALLBACK_LOCATION: LatLng = { lat: -36.8485, lng: 174.7633 };

const DEFAULT_FILTERS: Filters = {
  openNowOnly: true,
  deliveryOnly: false,
  radiusMeters: 2000,
  wantedProducts: [],
};

export default function App() {
  const [location, setLocation] = useState<LatLng | null>(null);
  const [locationNote, setLocationNote] = useState<string | null>(null);
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weights, setWeights] = useState<Weights>(DEFAULT_WEIGHTS);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [now, setNow] = useState(() => new Date());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const cardRefs = useRef(new Map<string, React.RefObject<HTMLElement>>());

  // Opening-hours scores depend on the time, so refresh them each minute.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const locate = () => {
    setLocationNote(null);
    getBrowserLocation()
      .then(setLocation)
      .catch((e: Error) => {
        setLocationNote(`${e.message} Showing Auckland CBD.`);
        setLocation(FALLBACK_LOCATION);
      });
  };

  useEffect(locate, []);

  // Fetch when the location or search radius changes. Ranking is done locally.
  useEffect(() => {
    if (!location) return;
    if (!API_KEY) {
      setCafes(demoCafes(location));
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetchNearbyCafes(API_KEY, location, filters.radiusMeters, controller.signal)
      .then(setCafes)
      .catch((e: Error) => {
        if (e.name !== 'AbortError') setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [location, filters.radiusMeters]);

  const ranked = useMemo(
    () => (location ? rankCafes(cafes, location, weights, filters, now) : []),
    [cafes, location, weights, filters, now],
  );

  const refFor = (id: string) => {
    let ref = cardRefs.current.get(id);
    if (!ref) {
      ref = createRef<HTMLElement>();
      cardRefs.current.set(id, ref);
    }
    return ref;
  };

  const selectFromMap = (id: string) => {
    setSelectedId(id);
    refFor(id).current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  return (
    <div className="flex min-h-dvh flex-col lg:h-dvh">
      <header className="flex shrink-0 items-center justify-between gap-3 bg-espresso px-4 py-3 text-white">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-crema">
            <Coffee className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate font-display text-lg font-bold leading-tight">Best Coffee Near Me</h1>
            <p className="hidden truncate text-xs text-white/60 sm:block">Ranked by coffee reviews, rating, distance and hours</p>
          </div>
        </div>
        <button
          onClick={locate}
          className="flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-3 text-sm font-medium hover:bg-white/20"
        >
          <LocateFixed className="h-3.5 w-3.5" /> Locate me
        </button>
      </header>

      {!API_KEY && (
        <p className="shrink-0 bg-crema-light px-4 py-1.5 text-center text-xs text-roast">
          Demo mode with sample cafes. Set <code>VITE_GOOGLE_MAPS_API_KEY</code> to use live Google data.
        </p>
      )}

      <div className="flex flex-1 flex-col lg:min-h-0 lg:flex-row-reverse">
        <div className="h-[38vh] shrink-0 lg:h-auto lg:flex-1">
          {location ? (
            <MapView
              apiKey={API_KEY}
              origin={location}
              ranked={ranked}
              selectedId={selectedId}
              onSelect={selectFromMap}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-[#efe9e1] text-sm text-muted">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Getting your location…
            </div>
          )}
        </div>

        <section className="flex flex-1 flex-col border-line lg:min-h-0 lg:w-[440px] lg:flex-none lg:border-r">
          <FilterBar
            weights={weights}
            filters={filters}
            onWeightsChange={setWeights}
            onFiltersChange={setFilters}
            onReset={() => {
              setWeights(DEFAULT_WEIGHTS);
              setFilters(DEFAULT_FILTERS);
            }}
          />

          <div className="flex-1 space-y-3 px-4 py-4 lg:min-h-0 lg:overflow-y-auto">
            {locationNote && <p className="text-sm text-muted">{locationNote}</p>}
            {error && (
              <p className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-brick">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
              </p>
            )}
            {location && loading && (
              <p className="flex items-center gap-2 text-sm text-muted">
                <Loader2 className="h-4 w-4 animate-spin" /> Finding cafes and reading reviews…
              </p>
            )}
            {location && !loading && !error && ranked.length === 0 && (
              <p className="rounded-2xl border border-line bg-white p-6 text-center text-sm text-muted">
                No cafes match. Make the radius bigger or turn off a filter.
              </p>
            )}
            {!loading && ranked.length > 0 && (
              <p className="text-xs text-muted">
                {ranked.length} {ranked.length === 1 ? 'cafe' : 'cafes'} · tap a card or a pin for details
              </p>
            )}
            {ranked.map((r, i) => (
              <CafeCard
                key={r.cafe.id}
                ref={refFor(r.cafe.id)}
                ranked={r}
                position={i + 1}
                now={now}
                selected={r.cafe.id === selectedId}
                onSelect={() => setSelectedId(r.cafe.id)}
              />
            ))}
            {ranked.length > 0 && (
              <p className="pb-2 pt-1 text-center text-[11px] text-muted">
                Coffee scores come from up to 5 Google reviews per cafe. Treat them as a guide.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

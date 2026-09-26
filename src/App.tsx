import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Coffee, Loader2, LocateFixed, SlidersHorizontal } from 'lucide-react';
import { CafeCard } from './components/CafeCard';
import { Controls } from './components/Controls';
import { demoCafes } from './lib/demoData';
import { getBrowserLocation } from './lib/geo';
import { fetchNearbyCafes } from './lib/places';
import { DEFAULT_WEIGHTS, rankCafes } from './lib/scoring';
import type { Cafe, Filters, LatLng, Weights } from './lib/types';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

/** Used when the browser does not share a location. Auckland CBD. */
const FALLBACK_LOCATION: LatLng = { lat: -36.8485, lng: 174.7633 };

const DEFAULT_FILTERS: Filters = {
  openNowOnly: true,
  deliveryOnly: false,
  radiusMeters: 2000,
  wantedProducts: ['coffee'],
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
  const [showControls, setShowControls] = useState(false);

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

  return (
    <div className="min-h-screen text-roast-900">
      <header className="bg-roast-900 text-roast-50">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-2">
            <Coffee className="h-7 w-7" />
            <div>
              <h1 className="text-xl font-bold leading-tight">Best Coffee Near Me</h1>
              <p className="text-xs text-roast-100">
                Ranked by rating, distance, menu, opening hours and delivery
              </p>
            </div>
          </div>
          <button
            onClick={locate}
            className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-roast-500 px-3 py-1.5 text-sm font-medium hover:bg-roast-700"
          >
            <LocateFixed className="h-4 w-4" /> Locate me
          </button>
        </div>
      </header>

      {!API_KEY && (
        <div className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-900">
          Demo mode: sample cafes. Set <code>VITE_GOOGLE_MAPS_API_KEY</code> to use live Google
          Maps data.
        </div>
      )}

      <main className="mx-auto grid max-w-5xl grid-cols-1 gap-4 px-4 py-4 md:grid-cols-[280px_1fr] md:gap-6 md:py-6">
        <button
          onClick={() => setShowControls((v) => !v)}
          aria-expanded={showControls}
          className="flex items-center justify-center gap-2 rounded-lg bg-white py-2 text-sm font-medium shadow-sm md:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {showControls ? 'Hide options' : 'Adjust ranking'}
        </button>
        <Controls
          className={showControls ? '' : 'hidden md:block'}
          weights={weights}
          filters={filters}
          onWeightsChange={setWeights}
          onFiltersChange={setFilters}
          onReset={() => {
            setWeights(DEFAULT_WEIGHTS);
            setFilters(DEFAULT_FILTERS);
          }}
        />

        <section className="min-w-0 space-y-3">
          {locationNote && <p className="text-sm text-roast-700">{locationNote}</p>}
          {error && (
            <p className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800">
              <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
            </p>
          )}
          {(!location || loading) && (
            <p className="flex items-center gap-2 text-sm text-roast-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              {location ? 'Finding cafes…' : 'Getting your location…'}
            </p>
          )}
          {location && !loading && !error && ranked.length === 0 && (
            <p className="rounded-lg bg-white p-6 text-center text-sm text-roast-700 shadow-sm">
              No cafes match. Increase the radius or turn off a filter.
            </p>
          )}
          {ranked.map((r, i) => (
            <CafeCard key={r.cafe.id} ranked={r} position={i + 1} now={now} />
          ))}
        </section>
      </main>
    </div>
  );
}

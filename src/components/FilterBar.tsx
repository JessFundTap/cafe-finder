import { useState } from 'react';
import { Bike, Clock, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { PRODUCTS, type Filters, type Product, type Weights } from '../lib/types';

interface Props {
  weights: Weights;
  filters: Filters;
  onWeightsChange: (w: Weights) => void;
  onFiltersChange: (f: Filters) => void;
  onReset: () => void;
}

const WEIGHT_LABELS: Record<keyof Weights, string> = {
  coffee: 'Coffee reviews',
  rating: 'Overall rating',
  distance: 'Closeness',
  products: 'Has what I want',
  hours: 'Open for longer',
  delivery: 'Delivery',
};

const RADII = [500, 1000, 2000, 5000, 10000];

export function FilterBar({ weights, filters, onWeightsChange, onFiltersChange, onReset }: Props) {
  const [showRanking, setShowRanking] = useState(false);
  const set = (patch: Partial<Filters>) => onFiltersChange({ ...filters, ...patch });
  const toggleProduct = (p: Product) =>
    set({
      wantedProducts: filters.wantedProducts.includes(p)
        ? filters.wantedProducts.filter((x) => x !== p)
        : [...filters.wantedProducts, p],
    });

  return (
    <div className="sticky top-0 z-10 space-y-2 border-b border-line bg-foam/95 px-4 py-3 backdrop-blur lg:static">
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        <Chip on={filters.openNowOnly} onClick={() => set({ openNowOnly: !filters.openNowOnly })}>
          <Clock className="h-3.5 w-3.5" /> Open now
        </Chip>
        <Chip on={filters.deliveryOnly} onClick={() => set({ deliveryOnly: !filters.deliveryOnly })}>
          <Bike className="h-3.5 w-3.5" /> Delivers
        </Chip>
        <select
          id="radius"
          aria-label="Search radius"
          value={filters.radiusMeters}
          onChange={(e) => set({ radiusMeters: Number(e.target.value) })}
          className="h-8 rounded-full border border-line bg-white px-2 text-sm font-medium sm:px-3"
        >
          {RADII.map((r) => (
            <option key={r} value={r}>
              {r < 1000 ? `${r} m` : `${r / 1000} km`}
            </option>
          ))}
        </select>
        <button
          onClick={() => setShowRanking((v) => !v)}
          aria-expanded={showRanking}
          className={`ml-auto flex h-8 items-center gap-1.5 rounded-full px-2.5 text-sm sm:px-3 font-medium ${
            showRanking ? 'bg-espresso text-white' : 'text-roast hover:bg-crema-light'
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" /> <span className="max-[400px]:sr-only">Ranking</span>
        </button>
      </div>

      <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-0.5 scrollbar-none">
        {PRODUCTS.map((p) => (
          <Chip key={p.id} small on={filters.wantedProducts.includes(p.id)} onClick={() => toggleProduct(p.id)}>
            {p.label}
          </Chip>
        ))}
      </div>

      {showRanking && (
        <div className="rounded-xl border border-line bg-white p-3">
          <p className="mb-2 text-xs text-muted">How much each thing counts towards the score.</p>
          <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
            {(Object.keys(WEIGHT_LABELS) as (keyof Weights)[]).map((k) => (
              <label key={k} htmlFor={`w-${k}`} className="block text-sm">
                <span className="flex justify-between">
                  {WEIGHT_LABELS[k]}
                  <span className="tabular-nums text-muted">{weights[k]}</span>
                </span>
                <input
                  id={`w-${k}`}
                  type="range"
                  min={0}
                  max={5}
                  step={1}
                  value={weights[k]}
                  onChange={(e) => onWeightsChange({ ...weights, [k]: Number(e.target.value) })}
                  className="w-full accent-crema"
                />
              </label>
            ))}
          </div>
          <button onClick={onReset} className="mt-2 flex items-center gap-1 text-xs text-muted hover:text-espresso">
            <RotateCcw className="h-3 w-3" /> Reset to defaults
          </button>
        </div>
      )}
    </div>
  );
}

function Chip({
  on,
  small,
  onClick,
  children,
}: {
  on: boolean;
  small?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border font-medium transition-colors ${
        small ? 'h-7 px-2.5 text-xs' : 'h-8 px-2.5 text-sm sm:px-3'
      } ${on ? 'border-espresso bg-espresso text-white' : 'border-line bg-white text-roast hover:border-crema'}`}
    >
      {children}
    </button>
  );
}

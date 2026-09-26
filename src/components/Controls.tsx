import { RotateCcw } from 'lucide-react';
import { PRODUCTS, type Filters, type Product, type Weights } from '../lib/types';
import { formatDistance } from '../lib/geo';

interface Props {
  weights: Weights;
  filters: Filters;
  onWeightsChange: (w: Weights) => void;
  onFiltersChange: (f: Filters) => void;
  onReset: () => void;
  className?: string;
}

const WEIGHT_LABELS: Record<keyof Weights, string> = {
  rating: 'Rating',
  distance: 'Closeness',
  products: 'Menu match',
  hours: 'Open for longer',
  delivery: 'Delivery',
};

const RADII = [500, 1000, 2000, 5000, 10000];

export function Controls({
  weights,
  filters,
  onWeightsChange,
  onFiltersChange,
  onReset,
  className = '',
}: Props) {
  const toggleProduct = (p: Product) => {
    const wanted = filters.wantedProducts.includes(p)
      ? filters.wantedProducts.filter((x) => x !== p)
      : [...filters.wantedProducts, p];
    onFiltersChange({ ...filters, wantedProducts: wanted });
  };

  return (
    <aside
      className={`min-w-0 space-y-5 self-start rounded-xl bg-white p-4 shadow-sm md:sticky md:top-4 ${className}`}
    >
      <div>
        <h2 className="mb-2 text-sm font-semibold">I want</h2>
        <div className="flex flex-wrap gap-1.5">
          {PRODUCTS.map((p) => {
            const on = filters.wantedProducts.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => toggleProduct(p.id)}
                aria-pressed={on}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                  on
                    ? 'border-roast-700 bg-roast-700 text-white'
                    : 'border-roast-100 bg-roast-50 text-roast-700 hover:border-roast-500'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Filters</h2>
        <Toggle
          label="Open now only"
          checked={filters.openNowOnly}
          onChange={(v) => onFiltersChange({ ...filters, openNowOnly: v })}
        />
        <Toggle
          label="Delivers only"
          checked={filters.deliveryOnly}
          onChange={(v) => onFiltersChange({ ...filters, deliveryOnly: v })}
        />
        <label className="flex items-center justify-between text-sm">
          Within
          <select
            value={filters.radiusMeters}
            onChange={(e) => onFiltersChange({ ...filters, radiusMeters: Number(e.target.value) })}
            className="rounded border border-roast-100 bg-roast-50 px-2 py-1 text-sm"
          >
            {RADII.map((r) => (
              <option key={r} value={r}>
                {formatDistance(r)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">What matters most</h2>
        {(Object.keys(WEIGHT_LABELS) as (keyof Weights)[]).map((k) => (
          <label key={k} className="block text-sm">
            <span className="flex justify-between">
              {WEIGHT_LABELS[k]}
              <span className="tabular-nums text-roast-500">{weights[k]}</span>
            </span>
            <input
              type="range"
              min={0}
              max={5}
              step={1}
              value={weights[k]}
              onChange={(e) => onWeightsChange({ ...weights, [k]: Number(e.target.value) })}
              className="w-full accent-roast-700"
            />
          </label>
        ))}
      </div>

      <button
        onClick={onReset}
        className="flex items-center gap-1 text-xs text-roast-500 hover:text-roast-900"
      >
        <RotateCcw className="h-3 w-3" /> Reset
      </button>
    </aside>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between text-sm">
      {label}
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-roast-700"
      />
    </label>
  );
}

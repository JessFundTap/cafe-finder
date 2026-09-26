import { useEffect } from 'react';
import { AdvancedMarker, APIProvider, Map, useMap } from '@vis.gl/react-google-maps';
import type { LatLng, RankedCafe } from '../lib/types';
import { Pin, UserDot } from './Pin';

interface Props {
  apiKey?: string;
  origin: LatLng;
  ranked: RankedCafe[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

// A Map ID is needed for Advanced Markers. DEMO_MAP_ID is Google's ID for testing.
const MAP_ID = (import.meta.env.VITE_GOOGLE_MAP_ID as string | undefined) || 'DEMO_MAP_ID';

/** How many of the top results the map zooms to fit. */
const FIT_TOP = 8;

export function MapView(props: Props) {
  if (!props.apiKey) return <DemoMap {...props} />;
  return (
    <APIProvider apiKey={props.apiKey}>
      <Map
        mapId={MAP_ID}
        defaultCenter={props.origin}
        defaultZoom={15}
        gestureHandling="greedy"
        disableDefaultUI
        zoomControl
        clickableIcons={false}
        className="h-full w-full"
      >
        <AdvancedMarker position={props.origin} zIndex={1}>
          <UserDot />
        </AdvancedMarker>
        {props.ranked.map((r, i) => {
          const selected = r.cafe.id === props.selectedId;
          return (
            <AdvancedMarker
              key={r.cafe.id}
              position={r.cafe.location}
              title={r.cafe.name}
              zIndex={selected ? 1000 : 500 - i}
              onClick={() => props.onSelect(r.cafe.id)}
            >
              <Pin rank={i + 1} score={r.score} selected={selected} closed={r.cafe.openNow === false} />
            </AdvancedMarker>
          );
        })}
        <Camera {...props} />
      </Map>
    </APIProvider>
  );
}

/** Fits the map to the user and top results, and pans to the selected cafe. */
function Camera({ origin, ranked, selectedId }: Props) {
  const map = useMap();
  const topIds = ranked.slice(0, FIT_TOP).map((r) => r.cafe.id).join();

  useEffect(() => {
    if (!map) return;
    const bounds = new google.maps.LatLngBounds(origin);
    ranked.slice(0, FIT_TOP).forEach((r) => bounds.extend(r.cafe.location));
    map.fitBounds(bounds, 48);
    // Refit only when the set of top cafes or the origin changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, origin, topIds]);

  useEffect(() => {
    if (!map || !selectedId) return;
    const r = ranked.find((x) => x.cafe.id === selectedId);
    if (r) map.panTo(r.cafe.location);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, selectedId]);

  return null;
}

/** Stand-in map for demo mode. Places pins by position; no streets. */
function DemoMap({ origin, ranked, selectedId, onSelect }: Props) {
  const points = [origin, ...ranked.map((r) => r.cafe.location)];
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const pad = 0.08;
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const spanLat = maxLat - minLat || 0.01;
  const spanLng = maxLng - minLng || 0.01;
  const pos = (p: LatLng) => ({
    left: `${(pad + ((p.lng - minLng) / spanLng) * (1 - 2 * pad)) * 100}%`,
    top: `${(pad + ((maxLat - p.lat) / spanLat) * (1 - 2 * pad)) * 100}%`,
  });

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-[#efe9e1]"
      style={{
        backgroundImage:
          'linear-gradient(#e3dbd0 1px, transparent 1px), linear-gradient(90deg, #e3dbd0 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }}
    >
      <span className="absolute bottom-3 left-3 z-[1001] rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-muted shadow-sm">
        Demo map · sample cafes
      </span>
      <div className="absolute -translate-x-1/2 -translate-y-1/2" style={pos(origin)}>
        <UserDot />
      </div>
      {ranked.map((r, i) => {
        const selected = r.cafe.id === selectedId;
        return (
          <button
            key={r.cafe.id}
            onClick={() => onSelect(r.cafe.id)}
            aria-label={`${i + 1}. ${r.cafe.name}`}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ ...pos(r.cafe.location), zIndex: selected ? 1000 : 500 - i }}
          >
            <Pin rank={i + 1} score={r.score} selected={selected} closed={r.cafe.openNow === false} />
          </button>
        );
      })}
    </div>
  );
}

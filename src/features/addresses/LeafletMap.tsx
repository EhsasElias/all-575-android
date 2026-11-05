import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui';
import type { MapPin, PinMapProps } from './mapTypes';
import styles from './LeafletMap.module.css';

const RIYADH: MapPin = { lat: 24.7136, lng: 46.6753 };
const OVERVIEW_ZOOM = 11;
const PIN_ZOOM = 16;
const MAX_ZOOM = 19;
const COORDINATE_DECIMALS = 6;

const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
// Public map-display keys must be restricted to the project's web origins.
// Never put backend/private service credentials into VITE_ variables.
const GEOAPIFY_MAP_KEY = import.meta.env.VITE_GEOAPIFY_MAP_KEY?.trim() ?? '';
const GEOAPIFY_TILE_URL = GEOAPIFY_MAP_KEY
  ? `https://maps.geoapify.com/v1/tile/osm-carto/{z}/{x}/{y}.png?apiKey=${encodeURIComponent(GEOAPIFY_MAP_KEY)}`
  : null;
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

const pinBodyClass = styles.pinBody ?? '';
const pinDotClass = styles.pinDot ?? '';

// An inline SVG instead of Leaflet's default marker image, whose file path breaks once the app is bundled.
const PIN_ICON = L.divIcon({
  className: styles.pinIcon ?? '',
  iconSize: [36, 44],
  iconAnchor: [18, 44],
  html: `<svg viewBox="0 0 36 44" width="36" height="44" aria-hidden="true" focusable="false"><path class="${pinBodyClass}" d="M18 42C18 42 32 28 32 17.5C32 9.5 25.7 3 18 3C10.3 3 4 9.5 4 17.5C4 28 18 42 18 42Z"/><circle class="${pinDotClass}" cx="18" cy="17.5" r="6"/></svg>`,
});

function toPin(point: L.LatLng): MapPin {
  const { lat, lng } = point.wrap();
  const round = (value: number) => Number(value.toFixed(COORDINATE_DECIMALS));
  return { lat: round(lat), lng: round(lng) };
}

/**
 * The only module that knows about Leaflet. It draws OpenStreetMap tiles with one draggable pin, and reports
 * where the pin ends up. The map stays left-to-right in Arabic: Leaflet's own controls are built for that.
 */
export function LeafletMap({ pin, labels, onPinChange }: PinMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const startRef = useRef({ pin, labels });
  const onPinChangeRef = useRef(onPinChange);
  const [tileFailure, setTileFailure] = useState(false);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const { i18n } = useTranslation();

  useEffect(() => {
    onPinChangeRef.current = onPinChange;
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const { pin: start, labels: startLabels } = startRef.current;

    const map = L.map(container, {
      center: start ?? RIYADH,
      zoom: start ? PIN_ZOOM : OVERVIEW_ZOOM,
      maxZoom: MAX_ZOOM,
      zoomControl: false,
      attributionControl: false,
    });
    L.control
      .zoom({ zoomInTitle: startLabels.zoomIn, zoomOutTitle: startLabels.zoomOut })
      .addTo(map);
    const attribution = L.control
      .attribution({ prefix: false })
      .addAttribution(ATTRIBUTION)
      .addTo(map);
    if (GEOAPIFY_TILE_URL) {
      attribution.addAttribution(
        'Powered by <a href="https://www.geoapify.com/" target="_blank" rel="noopener noreferrer">Geoapify</a>',
      );
    }
    // Try the configured map-tile service first. If it is unreachable, use
    // OpenStreetMap tiles and show an error instead of an empty grey map when
    // neither service can load. Requests are only for visible map tiles.
    const primaryUrl = GEOAPIFY_TILE_URL ?? OSM_TILE_URL;
    let usingFallback = false;
    let failures = 0;
    const layer = L.tileLayer(primaryUrl, { maxZoom: MAX_ZOOM }).addTo(map);
    tileLayerRef.current = layer;
    const onTileError = () => {
      failures += 1;
      if (failures < 3) return;
      if (GEOAPIFY_TILE_URL && !usingFallback) {
        usingFallback = true;
        failures = 0;
        layer.setUrl(OSM_TILE_URL);
        return;
      }
      setTileFailure(true);
    };
    layer.on('tileerror', onTileError);
    layer.on('tileload', () => {
      failures = 0;
      setTileFailure(false);
    });
    map.on('click', (event: L.LeafletMouseEvent) => {
      onPinChangeRef.current(toPin(event.latlng));
    });
    mapRef.current = map;

    return () => {
      layer.off();
      tileLayerRef.current = null;
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Keep the marker where the form says the pin is (typed, found by GPS, or loaded from a saved address).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (pin === null) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }
    const point = L.latLng(pin.lat, pin.lng);
    if (markerRef.current) {
      markerRef.current.setLatLng(point);
    } else {
      const marker = L.marker(point, {
        icon: PIN_ICON,
        draggable: true,
        keyboard: true,
        title: startRef.current.labels.pin,
      }).addTo(map);
      marker.on('dragend', () => {
        onPinChangeRef.current(toPin(marker.getLatLng()));
      });
      markerRef.current = marker;
    }
    if (!map.getBounds().contains(point)) map.setView(point, Math.max(map.getZoom(), PIN_ZOOM));
  }, [pin]);

  const placeAtCenter = () => {
    const center = mapRef.current?.getCenter();
    if (center) onPinChange(toPin(center));
  };

  return (
    <div className={styles.root}>
      <div dir="ltr" className={styles.frame}>
        <div ref={containerRef} className={styles.map} role="region" aria-label={labels.map} />
      </div>
      {tileFailure && (
        <div role="alert" className={styles.tileFailure}>
          <p>
            {i18n.language.startsWith('ar')
              ? 'تعذر تحميل صور الخريطة. يمكن متابعة إدخال العنوان يدويًا أو فتح الموقع في خرائط Google.'
              : i18n.language.startsWith('fr')
                ? 'Les images de la carte sont indisponibles. Saisissez l’adresse ou ouvrez Google Maps.'
                : 'Map imagery is unavailable. Enter the address manually or open Google Maps.'}
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              setTileFailure(false);
              tileLayerRef.current?.redraw();
            }}
          >
            {i18n.language.startsWith('ar')
              ? 'إعادة تحميل الخريطة'
              : i18n.language.startsWith('fr')
                ? 'Recharger la carte'
                : 'Reload map'}
          </Button>
        </div>
      )}
      <Button variant="secondary" onClick={placeAtCenter}>
        {labels.placeAtCenter}
      </Button>
    </div>
  );
}

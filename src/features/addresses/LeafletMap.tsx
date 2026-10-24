import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import { Button } from '@/shared/ui';
import type { MapPin, PinMapProps } from './mapTypes';
import styles from './LeafletMap.module.css';

const RIYADH: MapPin = { lat: 24.7136, lng: 46.6753 };
const OVERVIEW_ZOOM = 11;
const PIN_ZOOM = 16;
const MAX_ZOOM = 19;
const COORDINATE_DECIMALS = 6;

const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
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
    L.control.attribution({ prefix: false }).addAttribution(ATTRIBUTION).addTo(map);
    L.tileLayer(TILE_URL, { maxZoom: MAX_ZOOM }).addTo(map);
    map.on('click', (event: L.LeafletMouseEvent) => {
      onPinChangeRef.current(toPin(event.latlng));
    });
    mapRef.current = map;

    return () => {
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
      <Button variant="secondary" onClick={placeAtCenter}>
        {labels.placeAtCenter}
      </Button>
    </div>
  );
}

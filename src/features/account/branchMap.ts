import type { MapPin } from '@/features/addresses/mapTypes';
import type { SellerServiceZone } from './sellerStoreProfileApi';

const EARTH_RADIUS_METERS = 6_371_000;

/** Client-side guidance only. The API rechecks service-zone membership on submission. */
export function branchWithinZone(pin: MapPin, zone: SellerServiceZone): boolean {
  if (!Number.isFinite(pin.lat) || !Number.isFinite(pin.lng) ||
    Math.abs(pin.lat) > 90 || Math.abs(pin.lng) > 180) return false;
  const rad = Math.PI / 180;
  const dLat = (pin.lat - zone.center_lat) * rad;
  const dLng = (pin.lng - zone.center_lng) * rad;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(zone.center_lat * rad) * Math.cos(pin.lat * rad) * Math.sin(dLng / 2) ** 2;
  const distance = 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(a)));
  return distance <= zone.radius_meters;
}

export function mapLocationUrl(pin: MapPin): string {
  return 'https://www.google.com/maps/search/?api=1&query=' +
    encodeURIComponent(pin.lat + ',' + pin.lng);
}

import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/shared/session';
import { fetchAddresses, resolveZone } from '../api/catalogApi';
import { catalogKeys } from '../api/queryKeys';
import { saveDeliveryZone, useSavedDeliveryZone, type DeliveryZone } from './deliveryZone';

export type DeliveryZoneSource = 'address' | 'saved' | 'none';

export type DeliveryZoneState = {
  zone: DeliveryZone | null;
  /** The zone id to send as `zone_id`, or null when the customer has not chosen an area. */
  zoneId: number | null;
  source: DeliveryZoneSource;
};

const FIVE_MINUTES_MS = 5 * 60 * 1000;

/**
 * The zone of the signed-in customer's default address. Any failure means "no address zone": browsing
 * must never depend on it.
 */
async function loadAddressZone(signal: AbortSignal): Promise<DeliveryZone | null> {
  try {
    const addresses = await fetchAddresses(signal);
    const address = addresses.find((candidate) => candidate.is_default);
    if (!address?.serviceable || address.service_zone_id === null) return null;

    const resolution = await resolveZone({ lat: address.lat, lng: address.lng }, signal);
    if (resolution.zone?.id !== address.service_zone_id) return null;

    const zone = { id: resolution.zone.id, name: resolution.zone.name };
    // Remembered so the next launch starts with the right area before this request finishes.
    saveDeliveryZone(zone);
    return zone;
  } catch {
    return null;
  }
}

/**
 * Where the customer shops for: the zone of their default address when signed in, otherwise the area they
 * chose on this device. Until a request settles the saved choice applies, so nothing waits for the network.
 */
export function useDeliveryZone(): DeliveryZoneState {
  const { status } = useSession();
  const saved = useSavedDeliveryZone();
  const { data: addressZone } = useQuery({
    queryKey: catalogKeys.addressZone,
    queryFn: ({ signal }) => loadAddressZone(signal),
    enabled: status === 'signed-in',
    staleTime: FIVE_MINUTES_MS,
  });

  if (addressZone) return { zone: addressZone, zoneId: addressZone.id, source: 'address' };
  if (saved) return { zone: saved, zoneId: saved.id, source: 'saved' };
  return { zone: null, zoneId: null, source: 'none' };
}

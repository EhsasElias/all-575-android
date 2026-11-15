import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/shared/session';
import { fetchAddresses, resolveZone } from '../api/catalogApi';
import { catalogKeys } from '../api/queryKeys';
import { useSavedDeliveryZone, type DeliveryZone } from './deliveryZone';

export type DeliveryZoneSource = 'address' | 'saved' | 'none';

export type DeliveryZoneState = {
  zone: DeliveryZone | null;
  /** The zone id to send as `zone_id`, or null when the customer has not chosen an area. */
  zoneId: number | null;
  source: DeliveryZoneSource;
  /** The selected default address location, rather than an internal zone label. */
  displayName?: string;
};

const FIVE_MINUTES_MS = 5 * 60 * 1000;

/**
 * The zone of the signed-in customer's default address. Any failure means "no address zone": browsing
 * must never depend on it.
 */
async function loadAddressZone(signal: AbortSignal): Promise<{ zone: DeliveryZone; displayName: string } | null> {
  try {
    const addresses = await fetchAddresses(signal);
    const address = addresses.find((candidate) => candidate.is_default);
    if (!address?.serviceable || address.service_zone_id === null) return null;

    const resolution = await resolveZone({ lat: address.lat, lng: address.lng }, signal);
    if (resolution.zone?.id !== address.service_zone_id) return null;

    const zone = { id: resolution.zone.id, name: resolution.zone.name };
    // Signed-in addresses override device choices; never persist a customer's address zone as a guest choice.
    const displayName = [address.city, address.district].filter(Boolean).join(', ');
    return { zone, displayName };
  } catch {
    return null;
  }
}

/**
 * Where the customer shops for: the zone of their default address when signed in, otherwise the area they
 * chose on this device. Until a request settles the saved choice applies, so nothing waits for the network.
 */
export function useDeliveryZone(): DeliveryZoneState {
  const { status, user } = useSession();
  const saved = useSavedDeliveryZone();
  const { data: addressZone } = useQuery({
    queryKey: [...catalogKeys.addressZone, user?.id ?? null],
    queryFn: ({ signal }) => loadAddressZone(signal),
    enabled: status === 'signed-in',
    staleTime: FIVE_MINUTES_MS,
  });

  // An authenticated customer must never shop using a stale area from a previous guest/account.
  if (status !== 'guest') {
    if (status === 'signed-in' && addressZone) return {
      zone: addressZone.zone, zoneId: addressZone.zone.id, source: 'address', displayName: addressZone.displayName,
    };
    return { zone: null, zoneId: null, source: 'none' };
  }
  if (saved) return { zone: saved, zoneId: saved.id, source: 'saved' };
  return { zone: null, zoneId: null, source: 'none' };
}

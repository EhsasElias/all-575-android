import { skipToken, useQuery } from '@tanstack/react-query';
import { resolveZone } from './api';
import type { MapPin } from './mapTypes';
import { addressKeys } from './queryKeys';

const FIVE_MINUTES_MS = 5 * 60 * 1000;

/** Whether we deliver to the spot the pin is on, so the customer knows before saving. */
export function usePinZone(pin: MapPin | null) {
  return useQuery({
    queryKey: addressKeys.zone(pin),
    queryFn: pin === null ? skipToken : ({ signal }) => resolveZone(pin, signal),
    staleTime: FIVE_MINUTES_MS,
    retry: false,
  });
}

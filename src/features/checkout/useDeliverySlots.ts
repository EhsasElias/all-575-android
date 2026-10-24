import { skipToken, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { listSlots, type Slot } from './api';
import { checkoutKeys } from './queryKeys';

const FIFTEEN_SECONDS_MS = 15_000;

/** The delivery times for the chosen address, and the one the customer picked (if it is still open). */
export function useDeliverySlots(addressId: number | null) {
  const query = useQuery({
    queryKey: checkoutKeys.slots(addressId),
    queryFn: addressId === null ? skipToken : ({ signal }) => listSlots(addressId, signal),
    staleTime: FIFTEEN_SECONDS_MS,
  });
  // Remembered with its address: a time offered for one address means nothing for another.
  const [choice, setChoice] = useState<{ addressId: number; slotId: number } | null>(null);

  const chosen: Slot | undefined =
    choice !== null && choice.addressId === addressId
      ? query.data?.find((slot) => slot.id === choice.slotId && slot.available)
      : undefined;

  return {
    query,
    slots: query.data ?? [],
    chosenSlot: chosen ?? null,
    choose: (slotId: number) => {
      if (addressId !== null) setChoice({ addressId, slotId });
    },
    clearChoice: () => {
      setChoice(null);
    },
    refresh: () => void query.refetch(),
  };
}

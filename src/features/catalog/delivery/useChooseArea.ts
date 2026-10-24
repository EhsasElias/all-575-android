import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { resolveZone } from '../api/catalogApi';
import { getCurrentPosition, type PositionFailure } from './currentPosition';
import { saveDeliveryZone, type DeliveryZone } from './deliveryZone';

export type AreaOutcome =
  | { kind: 'chosen'; zone: DeliveryZone }
  | { kind: 'not-serviceable' }
  | { kind: 'location-failed'; reason: PositionFailure }
  | { kind: 'request-failed' };

export type AreaPhase = 'idle' | 'locating' | 'checking';

type FoundArea = Exclude<AreaOutcome, { kind: 'request-failed' }>;

/** Asks the device where it is, asks the server which zone that is, and remembers the answer. */
async function chooseFromCurrentLocation(onPhase: (phase: AreaPhase) => void): Promise<FoundArea> {
  onPhase('locating');
  const position = await getCurrentPosition();
  if (!position.ok) return { kind: 'location-failed', reason: position.reason };

  onPhase('checking');
  const { serviceable, zone } = await resolveZone({ lat: position.lat, lng: position.lng });
  if (!serviceable || zone === null) return { kind: 'not-serviceable' };

  const chosen = { id: zone.id, name: zone.name };
  saveDeliveryZone(chosen);
  return { kind: 'chosen', zone: chosen };
}

/** The "use my current location" flow of the delivery sheet. Nothing happens until `choose` is called from a tap. */
export function useChooseArea(onChosen: (zone: DeliveryZone) => void) {
  const [phase, setPhase] = useState<AreaPhase>('idle');
  const mutation = useMutation({
    mutationFn: () => chooseFromCurrentLocation(setPhase),
    onSuccess: (outcome) => {
      if (outcome.kind === 'chosen') onChosen(outcome.zone);
    },
    onSettled: () => {
      setPhase('idle');
    },
  });

  const outcome: AreaOutcome | null = mutation.isError
    ? { kind: 'request-failed' }
    : (mutation.data ?? null);

  return {
    phase,
    outcome,
    choose: () => {
      mutation.mutate();
    },
    forgetOutcome: mutation.reset,
  };
}

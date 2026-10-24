import type { Address } from './api';

/**
 * Which address the customer is delivering to: the one they chose, otherwise their default, otherwise the first
 * we can deliver to. An address we do not deliver to is never selected.
 */
export function pickAddress(
  addresses: readonly Address[],
  chosenId: number | null,
): Address | null {
  const serviceable = addresses.filter((address) => address.serviceable);
  return (
    serviceable.find((address) => address.id === chosenId) ??
    serviceable.find((address) => address.is_default) ??
    serviceable[0] ??
    null
  );
}

export function addressName(address: Address): string {
  return address.label ?? address.recipient_name;
}

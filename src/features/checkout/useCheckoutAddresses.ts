import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { listAddresses, type Address } from './api';
import { pickAddress } from './addressChoice';
import { checkoutKeys } from './queryKeys';

const NO_ADDRESSES: readonly Address[] = [];

/** The saved addresses, always fresh when the screen opens (the customer may just have added or fixed one). */
export function useCheckoutAddresses() {
  const query = useQuery({
    queryKey: checkoutKeys.addresses,
    queryFn: ({ signal }) => listAddresses(signal),
    staleTime: 0,
    refetchOnMount: 'always',
  });
  const [chosenId, setChosenId] = useState<number | null>(null);
  const addresses = query.data ?? NO_ADDRESSES;

  return {
    query,
    addresses,
    selected: pickAddress(addresses, chosenId),
    choose: setChosenId,
  };
}

import { useState } from 'react';
import type { Variant } from '../api/types';

/** The first variant that can be bought; when none can, the first one, so the page still has something to show. */
export function defaultVariant(variants: readonly Variant[]): Variant | null {
  return variants.find((variant) => variant.availability !== 'out_of_stock') ?? variants[0] ?? null;
}

/** The customer's choice, falling back to the default until they pick (or when the picked one disappears). */
export function useSelectedVariant(variants: readonly Variant[]) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected =
    variants.find((variant) => variant.id === selectedId) ?? defaultVariant(variants);

  return { selected, select: setSelectedId };
}

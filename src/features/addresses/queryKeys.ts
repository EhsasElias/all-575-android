import type { MapPin } from './mapTypes';

export const addressKeys = {
  all: ['addresses'] as const,
  list: ['addresses', 'list'] as const,
  detail: (id: number) => ['addresses', 'detail', id] as const,
  // Rounded to about 10 m so a nudge of the pin does not ask the server twice for the same place.
  zone: (pin: MapPin | null) =>
    pin === null
      ? (['addresses', 'zone', 'none'] as const)
      : (['addresses', 'zone', pin.lat.toFixed(4), pin.lng.toFixed(4)] as const),
};

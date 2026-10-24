import type { Position, PositionOptions } from '@capacitor/geolocation';
import { vi } from 'vitest';

/** Stands in for `Geolocation.getCurrentPosition` of the Capacitor plugin. */
export const getPosition = vi.fn<(options?: PositionOptions) => Promise<Position>>();

/** A position fix the way the plugin reports it. */
export function fixAt(latitude: number, longitude: number): Position {
  return {
    timestamp: 1,
    coords: {
      latitude,
      longitude,
      accuracy: 20,
      altitude: null,
      altitudeAccuracy: null,
      speed: null,
      heading: null,
      magneticHeading: null,
      trueHeading: null,
      headingAccuracy: null,
      course: null,
    },
  };
}

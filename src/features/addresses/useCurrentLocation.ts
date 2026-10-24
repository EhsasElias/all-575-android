import { useCallback, useState } from 'react';
import type { MapPin } from './mapTypes';

export type LocationFailure = 'denied' | 'unavailable';

export type CurrentLocation =
  | { status: 'idle' }
  | { status: 'locating' }
  | { status: 'found' }
  | { status: 'failed'; reason: LocationFailure };

const LOCATE_TIMEOUT_MS = 10_000;

// Browsers answer with a numeric code (GeolocationPositionError), the native plugin with a string code.
const WEB_PERMISSION_DENIED = 1;
const NATIVE_DENIED = new Set(['OS-PLUG-GLOC-0003', 'OS-PLUG-GLOC-0008', 'OS-PLUG-GLOC-0009']);

export function failureOf(error: unknown): LocationFailure {
  if (typeof error !== 'object' || error === null || !('code' in error)) return 'unavailable';
  const { code } = error;
  const denied =
    code === WEB_PERMISSION_DENIED || (typeof code === 'string' && NATIVE_DENIED.has(code));
  return denied ? 'denied' : 'unavailable';
}

/**
 * Asks for the device position only when `locate` is called (a tap), never in the background.
 * Nothing is stored or sent: the position only becomes the map pin.
 */
export function useCurrentLocation(onFound: (pin: MapPin) => void) {
  const [location, setLocation] = useState<CurrentLocation>({ status: 'idle' });

  const locate = useCallback(async () => {
    setLocation({ status: 'locating' });
    try {
      // Loaded on the tap: most visits never ask for the position.
      const { Geolocation } = await import('@capacitor/geolocation');
      const { coords } = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: LOCATE_TIMEOUT_MS,
      });
      onFound({ lat: coords.latitude, lng: coords.longitude });
      setLocation({ status: 'found' });
    } catch (error) {
      setLocation({ status: 'failed', reason: failureOf(error) });
    }
  }, [onFound]);

  return { location, locate };
}

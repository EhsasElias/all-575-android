export type PositionFailure = 'denied' | 'unavailable' | 'timeout';

export type PositionResult =
  { ok: true; lat: number; lng: number } | { ok: false; reason: PositionFailure };

const LOCATION_TIMEOUT_MS = 10_000;
// A position a minute old is plenty to tell which delivery zone someone is in.
const MAX_POSITION_AGE_MS = 60_000;

// Browsers answer with a numeric code (GeolocationPositionError), the native plugin with a string code.
const WEB_PERMISSION_DENIED = 1;
const WEB_TIMEOUT = 3;
const NATIVE_DENIED = new Set(['OS-PLUG-GLOC-0003', 'OS-PLUG-GLOC-0008', 'OS-PLUG-GLOC-0009']);
const NATIVE_TIMEOUT = 'OS-PLUG-GLOC-0010';

function readCode(error: unknown): unknown {
  return typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined;
}

export function classifyPositionError(error: unknown): PositionFailure {
  const code = readCode(error);
  if (code === WEB_PERMISSION_DENIED) return 'denied';
  if (code === WEB_TIMEOUT) return 'timeout';
  if (typeof code === 'string') {
    if (NATIVE_DENIED.has(code)) return 'denied';
    if (code === NATIVE_TIMEOUT) return 'timeout';
  }
  return 'unavailable';
}

/**
 * Asks the device where it is. Call this only from a tap: it can show the system permission prompt, and the
 * app never watches the location in the background.
 */
export async function getCurrentPosition(): Promise<PositionResult> {
  try {
    // Loaded on the tap, not at startup: most visits never ask for the location, and the home screen loads faster.
    const { Geolocation } = await import('@capacitor/geolocation');
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: false,
      timeout: LOCATION_TIMEOUT_MS,
      maximumAge: MAX_POSITION_AGE_MS,
    });
    return { ok: true, lat: position.coords.latitude, lng: position.coords.longitude };
  } catch (error) {
    return { ok: false, reason: classifyPositionError(error) };
  }
}

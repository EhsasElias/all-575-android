import type { PinMapProps } from './mapTypes';
import { JEDDAH_PIN, RIYADH_PIN } from './testData';

/**
 * Stands in for the Leaflet map in tests (jsdom cannot draw one): two buttons place the pin, one outside
 * and one inside our delivery area, and the current pin is printed so a test can read it.
 */
export function FakePinMap({ pin, labels, onPinChange }: PinMapProps) {
  return (
    <div role="region" aria-label={labels.map}>
      <button
        type="button"
        onClick={() => {
          onPinChange(RIYADH_PIN);
        }}
      >
        Tap the map in Riyadh
      </button>
      <button
        type="button"
        onClick={() => {
          onPinChange(JEDDAH_PIN);
        }}
      >
        Tap the map in Jeddah
      </button>
      <p data-testid="pin">{pin ? `${pin.lat},${pin.lng}` : 'none'}</p>
    </div>
  );
}

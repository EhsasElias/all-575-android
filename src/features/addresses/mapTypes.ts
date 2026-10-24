/** A point on the map. Plain numbers, so the map component can be swapped (or faked in tests). */
export type MapPin = { lat: number; lng: number };

export type PinMapLabels = {
  /** The accessible name of the map region. */
  map: string;
  /** The accessible name of the draggable pin. */
  pin: string;
  zoomIn: string;
  zoomOut: string;
  /** A button that puts the pin at the middle of what the map shows: the keyboard and one-hand way to place it. */
  placeAtCenter: string;
};

export type PinMapProps = {
  pin: MapPin | null;
  labels: PinMapLabels;
  onPinChange: (pin: MapPin) => void;
};

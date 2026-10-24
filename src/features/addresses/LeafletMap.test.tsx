import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LeafletMap } from './LeafletMap';
import type { MapPin, PinMapLabels } from './mapTypes';
import { RIYADH_PIN } from './testData';

const labels: PinMapLabels = {
  map: 'Delivery map',
  pin: 'Delivery pin',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  placeAtCenter: 'Place the pin at the middle of the map',
};

// jsdom has no layout, so this only proves that the map starts, draws its controls and cleans up;
// dragging and tapping are checked by hand in a browser.
describe('LeafletMap (starts in jsdom)', () => {
  it('draws the OpenStreetMap credit, labelled zoom buttons and the pin', () => {
    const { container } = render(
      <LeafletMap pin={RIYADH_PIN} labels={labels} onPinChange={vi.fn()} />,
    );

    expect(screen.getByRole('region', { name: 'Delivery map' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeInTheDocument();
    expect(screen.getByText('OpenStreetMap')).toHaveAttribute(
      'href',
      'https://www.openstreetmap.org/copyright',
    );
    expect(screen.getByText('OpenStreetMap')).toHaveAttribute('rel', 'noopener noreferrer');
    const marker = container.querySelector('.leaflet-marker-icon');
    expect(marker).toHaveAttribute('title', 'Delivery pin');
    expect(marker?.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('has no pin until one is given, and removes the map when it goes away', () => {
    const { container, unmount } = render(
      <LeafletMap pin={null} labels={labels} onPinChange={vi.fn()} />,
    );
    expect(container.querySelector('.leaflet-marker-icon')).toBeNull();

    unmount();
    expect(container.querySelector('.leaflet-container')).toBeNull();
  });

  it('moves the pin when the form gives it a new place', () => {
    const { container, rerender } = render(
      <LeafletMap pin={null} labels={labels} onPinChange={vi.fn()} />,
    );

    rerender(<LeafletMap pin={RIYADH_PIN} labels={labels} onPinChange={vi.fn()} />);

    expect(container.querySelectorAll('.leaflet-marker-icon')).toHaveLength(1);
  });

  it('offers a button that places the pin at the middle of the map', async () => {
    const onPinChange = vi.fn<(pin: MapPin) => void>();
    render(<LeafletMap pin={RIYADH_PIN} labels={labels} onPinChange={onPinChange} />);

    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Place the pin at the middle of the map' }));

    expect(onPinChange).toHaveBeenCalledOnce();
    const pin = onPinChange.mock.calls[0]?.[0];
    expect(Number.isFinite(pin?.lat)).toBe(true);
    expect(Number.isFinite(pin?.lng)).toBe(true);
  });
});

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderAddresses } from './addressTestHarness';

vi.mock('./LeafletMap', async () => {
  const { FakePinMap } = await import('./testMap');
  return { LeafletMap: FakePinMap };
});
const getCurrentPosition = vi.hoisted(() => vi.fn());
vi.mock('@capacitor/geolocation', () => ({ Geolocation: { getCurrentPosition } }));

const position = (latitude: number, longitude: number) => ({
  timestamp: 0,
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
});

describe('The map pin', () => {
  it('asks for the device position only when the button is tapped, then places the pin there', async () => {
    const user = userEvent.setup();
    getCurrentPosition.mockResolvedValue(position(24.7, 46.7));
    await renderAddresses();
    await screen.findByRole('heading', { level: 1, name: 'New address' });
    expect(getCurrentPosition).not.toHaveBeenCalled();
    expect(await screen.findByTestId('pin')).toHaveTextContent('none');

    await user.click(screen.getByRole('button', { name: 'Use my current location' }));

    expect(getCurrentPosition).toHaveBeenCalledOnce();
    expect(await screen.findByText(/We put the pin on your current location/)).toBeVisible();
    expect(screen.getByTestId('pin')).toHaveTextContent('24.7,46.7');
    expect(await screen.findByText('We deliver to this area.')).toBeVisible();
  });

  it('explains what to do when the permission is denied, and the map still works', async () => {
    const user = userEvent.setup();
    getCurrentPosition.mockRejectedValue({
      code: 1,
      message: 'User denied Geolocation',
    });
    await renderAddresses();
    await screen.findByRole('heading', { level: 1, name: 'New address' });

    await user.click(screen.getByRole('button', { name: 'Use my current location' }));

    expect(await screen.findByText(/We did not get permission to use your location/)).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Tap the map in Riyadh' }));
    expect(screen.getByTestId('pin')).toHaveTextContent('24.7136,46.6753');
  });

  it('recognises the Android plugin refusal as a denial too', async () => {
    const user = userEvent.setup();
    getCurrentPosition.mockRejectedValue({
      code: 'OS-PLUG-GLOC-0003',
      message: 'Location permission request was denied.',
    });
    await renderAddresses();
    await screen.findByRole('heading', { level: 1, name: 'New address' });

    await user.click(screen.getByRole('button', { name: 'Use my current location' }));

    expect(await screen.findByText(/We did not get permission/)).toBeVisible();
  });

  it('says so when the position is unavailable', async () => {
    const user = userEvent.setup();
    getCurrentPosition.mockRejectedValue(new Error('Location services are not enabled'));
    await renderAddresses();
    await screen.findByRole('heading', { level: 1, name: 'New address' });

    await user.click(screen.getByRole('button', { name: 'Use my current location' }));

    expect(await screen.findByText(/We could not find your location right now/)).toBeVisible();
  });

  it('tells the customer whether we deliver to the spot they pinned, before they save', async () => {
    const user = userEvent.setup();
    await renderAddresses();
    await screen.findByRole('heading', { level: 1, name: 'New address' });

    await user.click(screen.getByRole('button', { name: 'Tap the map in Jeddah' }));
    expect(
      await screen.findByText(
        'We do not deliver to this area yet. You can still save the address.',
      ),
    ).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Tap the map in Riyadh' }));
    expect(await screen.findByText('We deliver to this area.')).toBeVisible();
  });

  it('explains the location button in Arabic', async () => {
    await renderAddresses({ language: 'ar' });

    expect(await screen.findByRole('button', { name: 'استخدم موقعي الحالي' })).toBeVisible();
    expect(screen.getByRole('region', { name: 'خريطة لتحديد موقع التوصيل' })).toBeVisible();
    expect(screen.getByText('لم تضع الدبوس بعد.')).toBeVisible();
  });
});

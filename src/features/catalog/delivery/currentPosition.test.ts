import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fixAt, getPosition } from '../testGeolocation';
import { classifyPositionError, getCurrentPosition } from './currentPosition';

vi.mock('@capacitor/geolocation', async () => ({
  Geolocation: { getCurrentPosition: (await import('../testGeolocation')).getPosition },
}));

describe('classifyPositionError', () => {
  it.each([
    ['a browser permission refusal', { code: 1 }, 'denied'],
    ['a browser timeout', { code: 3 }, 'timeout'],
    ['a browser that cannot tell', { code: 2 }, 'unavailable'],
    ['the plugin permission refusal', { code: 'OS-PLUG-GLOC-0003' }, 'denied'],
    ['a restricted app on iOS', { code: 'OS-PLUG-GLOC-0008' }, 'denied'],
    ['a refusal to turn location on', { code: 'OS-PLUG-GLOC-0009' }, 'denied'],
    ['the plugin timeout', { code: 'OS-PLUG-GLOC-0010' }, 'timeout'],
    ['location services switched off', { code: 'OS-PLUG-GLOC-0007' }, 'unavailable'],
    ['an unknown plugin code', { code: 'OS-PLUG-GLOC-0099' }, 'unavailable'],
    ['an error without a code', new Error('boom'), 'unavailable'],
    ['something that is not an error', 'nope', 'unavailable'],
  ])('maps %s', (_label, error, expected) => {
    expect(classifyPositionError(error)).toBe(expected);
  });
});

describe('getCurrentPosition', () => {
  beforeEach(() => {
    getPosition.mockReset();
  });

  it('returns the coordinates and asks for a coarse, short-lived fix', async () => {
    getPosition.mockResolvedValue(fixAt(24.71, 46.67));

    await expect(getCurrentPosition()).resolves.toEqual({ ok: true, lat: 24.71, lng: 46.67 });
    expect(getPosition).toHaveBeenCalledWith(
      expect.objectContaining({ enableHighAccuracy: false, timeout: 10_000 }),
    );
  });

  it('turns a failure into a reason instead of throwing', async () => {
    getPosition.mockRejectedValue({ code: 1 });

    await expect(getCurrentPosition()).resolves.toEqual({ ok: false, reason: 'denied' });
  });
});

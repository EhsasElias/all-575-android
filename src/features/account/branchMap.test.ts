import { describe, expect, it } from 'vitest';
import { branchWithinZone, mapLocationUrl } from './branchMap';
import type { SellerServiceZone } from './sellerStoreProfileApi';

const zone: SellerServiceZone = {
  id: 1,
  name_ar: 'الرياض',
  name_en: 'Riyadh',
  center_lat: 24.7136,
  center_lng: 46.6753,
  radius_meters: 40000,
};

describe('seller branch mapping', () => {
  it('accepts branch pin inside the service zone', () => {
    expect(branchWithinZone({ lat: 24.7136, lng: 46.6753 }, zone)).toBe(true);
    expect(branchWithinZone({ lat: 24.75, lng: 46.7 }, zone)).toBe(true);
  });

  it('rejects a location outside the zone or invalid coordinates', () => {
    expect(branchWithinZone({ lat: 21.4858, lng: 39.1925 }, zone)).toBe(false);
    expect(branchWithinZone({ lat: 100, lng: 46.6753 }, zone)).toBe(false);
    expect(branchWithinZone({ lat: Number.NaN, lng: 46.6753 }, zone)).toBe(false);
  });

  it('provides a safely encoded Google Maps location link', () => {
    expect(mapLocationUrl({ lat: 24.7136, lng: 46.6753 })).toBe(
      'https://www.google.com/maps/search/?api=1&query=24.7136%2C46.6753',
    );
  });
});

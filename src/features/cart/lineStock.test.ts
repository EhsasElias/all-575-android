import { describe, expect, it } from 'vitest';
import type { Schemas } from '@/shared/api';
import { pickDeliveryAddress, stockByVariant } from './lineStock';

function address(overrides: Partial<Schemas['AddressResource']>): Schemas['AddressResource'] {
  return {
    id: 1,
    label: null,
    recipient_name: 'Sara',
    recipient_phone: '+966512345678',
    region: 'Riyadh',
    city: 'Riyadh',
    district: 'Olaya',
    street: 'King Fahd Road',
    building_number: '1234',
    additional_number: '5678',
    postal_code: '12345',
    short_address: 'RRRD2929',
    unit: null,
    floor: null,
    delivery_notes: null,
    lat: 24.7,
    lng: 46.7,
    is_default: false,
    serviceable: true,
    service_zone_id: 1,
    ...overrides,
  };
}

describe('which address the cart judges stock for', () => {
  it('prefers the default address', () => {
    const picked = pickDeliveryAddress([address({ id: 1 }), address({ id: 2, is_default: true })]);

    expect(picked?.id).toBe(2);
  });

  it('skips an address that is outside every delivery area, even the default one', () => {
    const picked = pickDeliveryAddress([
      address({ id: 1, is_default: true, serviceable: false, service_zone_id: null }),
      address({ id: 2 }),
    ]);

    expect(picked?.id).toBe(2);
  });

  it('falls back to the first deliverable address when none is the default', () => {
    expect(pickDeliveryAddress([address({ id: 4 }), address({ id: 5 })])?.id).toBe(4);
  });

  it('is nothing when the customer has no address or none that can be delivered to', () => {
    expect(pickDeliveryAddress([])).toBeUndefined();
    expect(pickDeliveryAddress([address({ serviceable: false })])).toBeUndefined();
  });
});

describe('stock by variant', () => {
  it('looks a line up by its variant', () => {
    const stock = stockByVariant([
      { variantId: 1, availability: 'in_stock' },
      { variantId: 2, availability: 'out_of_stock' },
    ]);

    expect(stock.get(2)).toBe('out_of_stock');
    expect(stock.get(3)).toBeUndefined();
  });
});

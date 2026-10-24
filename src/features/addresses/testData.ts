import type { Address } from './api';
import type { MapPin } from './mapTypes';

export const RIYADH_PIN: MapPin = { lat: 24.7136, lng: 46.6753 };
export const JEDDAH_PIN: MapPin = { lat: 21.4858, lng: 39.1925 };

export const homeAddress: Address = {
  id: 1,
  label: 'Home',
  recipient_name: 'Sara',
  recipient_phone: '+966512345678',
  region: 'Riyadh',
  city: 'Riyadh',
  district: 'Al Olaya',
  street: 'King Fahd Rd',
  building_number: '1234',
  additional_number: '5678',
  postal_code: '12211',
  short_address: 'RRRD2929',
  unit: null,
  floor: null,
  delivery_notes: null,
  lat: RIYADH_PIN.lat,
  lng: RIYADH_PIN.lng,
  is_default: true,
  serviceable: true,
  service_zone_id: 1,
};

export const jeddahAddress: Address = {
  ...homeAddress,
  id: 2,
  label: 'Jeddah flat',
  region: 'Makkah',
  city: 'Jeddah',
  district: 'Al Rawdah',
  short_address: null,
  lat: JEDDAH_PIN.lat,
  lng: JEDDAH_PIN.lng,
  is_default: false,
  serviceable: false,
  service_zone_id: null,
};

export function addressNumber(id: number, overrides: Partial<Address> = {}): Address {
  return { ...homeAddress, id, label: `Place ${id}`, is_default: false, ...overrides };
}

/** What `GET /zones/resolve` answers for a spot we deliver to. */
export const riyadhZone = {
  serviceable: true,
  zone: {
    id: 1,
    name: { ar: 'الرياض', en: 'Riyadh' },
    delivery_fee: 1000,
    free_delivery_threshold: 5000,
    currency: 'SAR',
  },
};

export const outsideZone = { serviceable: false, zone: null };

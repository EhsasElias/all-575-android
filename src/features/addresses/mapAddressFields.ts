import type { AddressField } from './addressFields';
import type { MapAddress } from './api';

export const MAP_FIELDS = [
  { field: 'region', source: 'region' },
  { field: 'city', source: 'city' },
  { field: 'district', source: 'district' },
  { field: 'street', source: 'street' },
  { field: 'buildingNumber', source: 'building_number' },
  { field: 'postalCode', source: 'postal_code' },
] as const satisfies readonly { field: AddressField; source: keyof MapAddress }[];

// These belong to the old pin too, but cannot be guessed from ordinary map data.
export const LOCATION_FIELDS: AddressField[] = [
  ...MAP_FIELDS.map(({ field }) => field),
  'additionalNumber',
  'shortAddress',
];

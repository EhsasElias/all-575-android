import type { AddressPayload, Address } from './api';
import type { MapPin } from './mapTypes';

/** In the order the form shows them: the first invalid one gets the focus. */
export const ADDRESS_FIELDS = [
  'label',
  'recipientName',
  'recipientPhone',
  'region',
  'city',
  'district',
  'street',
  'buildingNumber',
  'additionalNumber',
  'postalCode',
  'shortAddress',
  'unit',
  'floor',
  'deliveryNotes',
] as const;

export type AddressField = (typeof ADDRESS_FIELDS)[number];
export type AddressValues = Record<AddressField, string>;

/** The server's name for each field, to show a 422 next to the right input. */
export const API_FIELD = {
  label: 'label',
  recipientName: 'recipient_name',
  recipientPhone: 'recipient_phone',
  region: 'region',
  city: 'city',
  district: 'district',
  street: 'street',
  buildingNumber: 'building_number',
  additionalNumber: 'additional_number',
  postalCode: 'postal_code',
  shortAddress: 'short_address',
  unit: 'unit',
  floor: 'floor',
  deliveryNotes: 'delivery_notes',
} as const satisfies Record<AddressField, string>;

/** The limits the API validates. */
export const MAX_LENGTH: Partial<Record<AddressField, number>> = {
  label: 40,
  recipientName: 100,
  region: 80,
  city: 80,
  district: 80,
  street: 120,
  unit: 20,
  floor: 20,
  deliveryNotes: 300,
};

export const REQUIRED_FIELDS: ReadonlySet<AddressField> = new Set<AddressField>([
  'recipientName',
  'recipientPhone',
  'region',
  'city',
  'district',
  'street',
  'buildingNumber',
  'additionalNumber',
  'postalCode',
]);

export const MAX_ADDRESSES = 10;

export const emptyAddressValues: AddressValues = {
  label: '',
  recipientName: '',
  recipientPhone: '',
  region: '',
  city: '',
  district: '',
  street: '',
  buildingNumber: '',
  additionalNumber: '',
  postalCode: '',
  shortAddress: '',
  unit: '',
  floor: '',
  deliveryNotes: '',
};

export function valuesFromAddress(address: Address): AddressValues {
  return {
    label: address.label ?? '',
    recipientName: address.recipient_name,
    recipientPhone: address.recipient_phone,
    region: address.region,
    city: address.city,
    district: address.district,
    street: address.street,
    buildingNumber: address.building_number,
    additionalNumber: address.additional_number,
    postalCode: address.postal_code,
    shortAddress: address.short_address ?? '',
    unit: address.unit ?? '',
    floor: address.floor ?? '',
    deliveryNotes: address.delivery_notes ?? '',
  };
}

const blankToNull = (value: string): string | null => (value === '' ? null : value);

/** Expects values that went through `normalizeValues` and passed `validateAddress`. */
export function buildAddressPayload(
  values: AddressValues,
  pin: MapPin,
  makeDefault: boolean,
): AddressPayload {
  return {
    label: blankToNull(values.label),
    recipient_name: values.recipientName,
    recipient_phone: values.recipientPhone,
    region: values.region,
    city: values.city,
    district: values.district,
    street: values.street,
    building_number: values.buildingNumber,
    additional_number: values.additionalNumber,
    postal_code: values.postalCode,
    short_address: blankToNull(values.shortAddress),
    unit: blankToNull(values.unit),
    floor: blankToNull(values.floor),
    delivery_notes: blankToNull(values.deliveryNotes),
    lat: pin.lat,
    lng: pin.lng,
    // Only ever promote: demoting the current default is done by choosing another one.
    ...(makeDefault ? { is_default: true } : {}),
  };
}

/** The DOM id of an input, so a failed submit can move the focus to the first problem. */
export const fieldId = (key: AddressField | 'pin'): string => `address-${key}`;

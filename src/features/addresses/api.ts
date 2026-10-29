import { http, type Data, type Schemas } from '@/shared/api';
import type { MapPin } from './mapTypes';

export type Address = Schemas['AddressResource'];
export type AddressPayload = Schemas['AddressRequest'];
export type MapAddress = Schemas['MapAddressResource'];
export type ZoneCheck = { serviceable: boolean; zone: Schemas['ZoneResource'] | null };

export async function listAddresses(signal: AbortSignal): Promise<Address[]> {
  return (await http.get<Data<Address[]>>('/addresses', { signal })).data;
}

export async function getAddress(id: number, signal: AbortSignal): Promise<Address> {
  return (await http.get<Data<Address>>(`/addresses/${id}`, { signal })).data;
}

export async function saveAddress(id: number | null, payload: AddressPayload): Promise<Address> {
  const body =
    id === null
      ? await http.post<Data<Address>>('/addresses', payload)
      : await http.put<Data<Address>>(`/addresses/${id}`, payload);
  return body.data;
}

export async function deleteAddress(id: number): Promise<void> {
  await http.delete<undefined>(`/addresses/${id}`);
}

export async function makeDefaultAddress(id: number): Promise<Address> {
  return (await http.put<Data<Address>>(`/addresses/${id}/default`)).data;
}

export async function resolveZone(pin: MapPin, signal: AbortSignal): Promise<ZoneCheck> {
  const query = { lat: pin.lat, lng: pin.lng };
  return (await http.get<Data<ZoneCheck>>('/zones/resolve', { query, signal })).data;
}

export async function reverseMapAddress(pin: MapPin, signal: AbortSignal): Promise<MapAddress> {
  return (
    await http.get<Data<MapAddress>>('/addresses/resolve', {
      query: { lat: pin.lat, lng: pin.lng },
      signal,
    })
  ).data;
}

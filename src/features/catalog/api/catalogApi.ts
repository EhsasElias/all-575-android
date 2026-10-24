import { http, type Data } from '@/shared/api';
import type { Address, Category, ProductDetail, Seller, ZoneResolution } from './types';

function pathSegment(value: string): string {
  return encodeURIComponent(value);
}

export async function fetchCategories(signal: AbortSignal): Promise<Category[]> {
  const { data } = await http.get<Data<Category[]>>('/categories', { signal });
  return data;
}

/** The zone is optional: without it the server answers "unknown" for availability. */
export async function fetchProduct(
  slug: string,
  zoneId: number | null,
  signal: AbortSignal,
): Promise<ProductDetail> {
  const { data } = await http.get<Data<ProductDetail>>(`/products/${pathSegment(slug)}`, {
    query: { zone_id: zoneId ?? undefined },
    signal,
  });
  return data;
}

export async function fetchSeller(slug: string, signal: AbortSignal): Promise<Seller> {
  const { data } = await http.get<Data<Seller>>(`/sellers/${pathSegment(slug)}`, { signal });
  return data;
}

export async function resolveZone(
  coordinates: { lat: number; lng: number },
  signal?: AbortSignal,
): Promise<ZoneResolution> {
  const { data } = await http.get<Data<ZoneResolution>>('/zones/resolve', {
    query: coordinates,
    ...(signal ? { signal } : {}),
  });
  return data;
}

export async function fetchAddresses(signal: AbortSignal): Promise<Address[]> {
  const { data } = await http.get<Data<Address[]>>('/addresses', { signal });
  return data;
}

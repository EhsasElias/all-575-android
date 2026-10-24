import type { Schemas } from '@/shared/api';
import type { paths } from '@/shared/api/schema';

export type Category = Schemas['CategoryResource'];
export type ProductSummary = Schemas['ProductListResource'];
export type ProductDetail = Schemas['ProductDetailResource'];
export type Variant = Schemas['VariantResource'];
export type Seller = Schemas['SellerResource'];
export type Review = Schemas['ReviewResource'];
export type Zone = Schemas['ZoneResource'];
export type Address = Schemas['AddressResource'];
export type Availability = ProductSummary['availability'];

type ZoneResolveResponse =
  paths['/v1/zones/resolve']['get']['responses']['200']['content']['application/json'];

/** Whether we deliver to a point and, if so, which zone it belongs to. */
export type ZoneResolution = ZoneResolveResponse['data'];

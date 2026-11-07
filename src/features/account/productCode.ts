/** Parse only values actually encoded in a scanned symbol; never invent product details. */
export type ScannedProduct = {
  sku?: string;
  barcode?: string;
  nameAr?: string;
  nameEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  categoryId?: string;
  price?: string;
  vatClass?: 'standard' | 'zero' | 'exempt';
};

const limit = (value: unknown, max: number): string | undefined => {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined;
  const text = String(value).trim();
  return text && text.length <= max ? text : undefined;
};
const normalize = (name: string) => name.trim().toLowerCase().replace(/[\s_-]/g, '');
const isBarcode = (text: string) => /^(?:\d{8}|\d{12,14})$/.test(text);

export function parseProductCode(raw: string, format?: string): ScannedProduct {
  const text = raw.trim().slice(0, 12000);
  if (!text) return {};
  const found: Record<string, unknown> = {};
  const insert = (key: string, value: unknown) => {
    found[normalize(key)] = value;
  };

  // GS1 Digital Link URIs encode the GTIN after /01/; no network call is needed.
  const gs1 = /(?:^|\/)01\/(\d{14})(?:[/?#]|$)/.exec(text);
  if (gs1) insert('barcode', gs1[1]);
  const parenthesizedGtin = /^\(01\)(\d{14})/.exec(text);
  if (parenthesizedGtin) insert('barcode', parenthesizedGtin[1]);

  if (text.startsWith('{')) {
    try {
      const parsed: unknown = JSON.parse(text);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const obj = parsed as Record<string, unknown>;
        // Support { product: { name_ar: ... } } as well as flat QR payloads.
        const nested = obj.product;
        if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
          for (const [key, value] of Object.entries(nested)) insert(key, value);
        }
        for (const [key, value] of Object.entries(obj)) {
          if (key !== 'product') insert(key, value);
        }
      }
    } catch {
      // Non-JSON QR strings are still valid codes.
    }
  } else if (/^https?:\/\//i.test(text)) {
    try {
      const url = new URL(text);
      // Read query parameters only; do not trust or fetch links embedded in QR codes.
      for (const [key, value] of url.searchParams.entries()) insert(key, value);
      if (gs1) insert('barcode', gs1[1]);
    } catch {
      // Malformed URLs are handled as raw codes.
    }
  } else if (text.includes('=') && /(?:^|[;&\n])[\w-]+=/.test(text)) {
    const params = new URLSearchParams(text.replace(/[;\n]/g, '&'));
    for (const [key, value] of params.entries()) insert(key, value);
  } else if (isBarcode(text) || (format && format !== 'qr_code' && text.length <= 100)) {
    insert('barcode', text);
  } else if (!parenthesizedGtin) {
    // Unstructured QR text may be an SKU, not necessarily a product barcode.
    insert('sku', text);
  }

  const read = (keys: string[], max: number) =>
    keys.map((key) => limit(found[normalize(key)], max)).find(Boolean);
  const sku = read(['sku', 'stock_keeping_unit', 'product_code', 'productcode'], 100);
  const barcode = read(['barcode', 'gtin', 'ean', 'upc', 'ean13'], 100);
  const nameAr = read(['name_ar', 'nameAr', 'product_name_ar', 'title_ar'], 180);
  const nameEn = read(['name_en', 'nameEn', 'product_name_en', 'title_en'], 180);
  const neutralName = read(['name', 'product_name', 'title'], 180);
  const descriptionAr = read(['description_ar', 'descriptionAr', 'details_ar'], 10000);
  const descriptionEn = read(['description_en', 'descriptionEn', 'details_en'], 10000);
  const neutralDescription = read(['description', 'details'], 10000);
  const category = read(['category_id', 'categoryId'], 12);
  const priceRaw = read(['price_sar', 'price', 'sar'], 25);
  const halalas = read(['price_halalas'], 12);
  const price = priceRaw ?? (halalas && /^\d+$/.test(halalas)
    ? (Number(halalas) / 100).toFixed(2) : undefined);
  const vat = read(['vat_class', 'vatClass', 'tax_class'], 24)?.toLowerCase();
  return {
    ...(sku ? { sku } : {}),
    ...(barcode ? { barcode } : {}),
    ...(nameAr ? { nameAr } : neutralName && /[\u0600-\u06ff]/.test(neutralName)
      ? { nameAr: neutralName } : {}),
    ...(nameEn ? { nameEn } : neutralName && !/[\u0600-\u06ff]/.test(neutralName)
      ? { nameEn: neutralName } : {}),
    ...(descriptionAr ? { descriptionAr } : neutralDescription && /[\u0600-\u06ff]/.test(neutralDescription)
      ? { descriptionAr: neutralDescription } : {}),
    ...(descriptionEn ? { descriptionEn } : neutralDescription && !/[\u0600-\u06ff]/.test(neutralDescription)
      ? { descriptionEn: neutralDescription } : {}),
    ...(category && /^\d+$/.test(category) ? { categoryId: category } : {}),
    ...(price && /^\d+(?:\.\d{1,2})?$/.test(price) && Number(price) >= 1 && Number(price) <= 10
      ? { price } : {}),
    ...(vat === 'standard' || vat === 'zero' || vat === 'exempt'
      ? { vatClass: vat } : {}),
  };
}

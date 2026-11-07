import { describe, expect, it } from 'vitest';
import { parseProductCode } from './productCode';

describe('parseProductCode', () => {
  it('reads EAN and UPC values without inventing a product name or price', () => {
    expect(parseProductCode('6281234567890')).toEqual({ barcode: '6281234567890' });
  });

  it('puts alpha-numeric CODE128 values in the barcode field when detected by camera', () => {
    expect(parseProductCode('ABC-123', 'code_128')).toEqual({ barcode: 'ABC-123' });
  });

  it('maps JSON product details to editable product fields', () => {
    expect(parseProductCode(JSON.stringify({
      product: {
        sku: 'SH-400',
        barcode: '6281234567890',
        name_ar: 'شامبو',
        name_en: 'Shampoo',
        description_ar: '400 مل',
        category_id: 12,
        price_sar: '5.75',
        vat_class: 'standard',
      },
    }))).toMatchObject({
      sku: 'SH-400', barcode: '6281234567890',
      nameAr: 'شامبو', nameEn: 'Shampoo',
      descriptionAr: '400 مل', categoryId: '12',
      price: '5.75', vatClass: 'standard',
    });
  });

  it('extracts GS1 GTIN from product Digital Link URLs', () => {
    expect(parseProductCode('https://id.gs1.org/01/06281234567890')).toEqual({
      barcode: '06281234567890',
    });
  });

  it('recognizes URL parameters and ignores out-of-range prices', () => {
    expect(parseProductCode('https://example.test/item?sku=AAA-1&name_en=Bag&price=250')).toEqual({
      sku: 'AAA-1', nameEn: 'Bag',
    });
  });

  it('reads semicolon-separated QR metadata and converts halalas to riyals', () => {
    expect(parseProductCode('SKU=BOX-1;name_ar=صندوق;price_halalas=575')).toMatchObject({
      sku: 'BOX-1', nameAr: 'صندوق', price: '5.75',
    });
  });

  it('does not reinterpret an arbitrary URL or unstructured QR text as a price', () => {
    expect(parseProductCode('https://example.test/product/abc')).toEqual({});
    expect(parseProductCode('BOX-001')).toEqual({ sku: 'BOX-001' });
  });
});

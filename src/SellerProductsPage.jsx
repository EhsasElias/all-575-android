import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

export default function SellerProductsPage({
  lang = 'ar',
  api,
  showToast,
  onAddProduct,
  onEditProduct,
}) {
  const isArabic = lang === 'ar';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [deactivating, setDeactivating] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    setError('');

    try {
      const response = await api.getSellerProducts();

      const list =
        Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.data)
            ? response.data.data
            : Array.isArray(response)
              ? response
              : [];

      setProducts(list);
    } catch (err) {
      console.error('Seller products error:', err);

      const message = isArabic
        ? 'تعذر تحميل المنتجات'
        : 'Could not load products';

      setError(message);
      showToast?.(message);
    } finally {
      setLoading(false);
    }
  }

  function productName(product) {
    return isArabic
      ? product.name_ar || product.name_en || '-'
      : product.name_en || product.name_ar || '-';
  }

  function isBrokenArabic(value) {
    if (!value) return true;

    const clean = String(value).replace(/\s/g, '');

    return clean.length > 0 && /^\?+$/.test(clean);
  }

  function categoryName(product) {
    const category = product?.category;

    if (!category) return '-';

    if (isArabic) {
      if (
        category.name_ar &&
        !isBrokenArabic(category.name_ar)
      ) {
        return category.name_ar;
      }

      return category.name_en || '-';
    }

    return category.name_en || category.name_ar || '-';
  }

  function money(value) {
    const amount = Number(value || 0);

    return isArabic
      ? `${amount.toFixed(2).replace('.', ',')} ر.س`
      : `${amount.toFixed(2)} SAR`;
  }

  async function confirmDeactivate() {
    if (!deactivateTarget) return;

    setDeactivating(true);

    try {
      await api.deleteSellerProduct(deactivateTarget.id);

      setProducts((current) =>
        current.map((product) =>
          String(product.id) === String(deactivateTarget.id)
            ? {
                ...product,
                is_active: false,
              }
            : product
        )
      );

      showToast?.(
        isArabic
          ? 'تم تعطيل المنتج'
          : 'Product deactivated'
      );

      setDeactivateTarget(null);
    } catch (err) {
      console.error('Deactivate seller product error:', err);

      showToast?.(
        err?.message ||
          (isArabic
            ? 'تعذر تعطيل المنتج'
            : 'Could not deactivate product')
      );
    } finally {
      setDeactivating(false);
    }
  }

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return products;

    return products.filter((product) => {
      const values = [
        product.name_ar,
        product.name_en,
        product.sku,
        product?.category?.name_ar,
        product?.category?.name_en,
      ];

      return values.some((value) =>
        String(value || '').toLowerCase().includes(query)
      );
    });
  }, [products, search]);

  const activeCount = products.filter((product) =>
    Boolean(product.is_active)
  ).length;

  const totalStock = products.reduce(
    (total, product) =>
      total + Number(product.stock || 0),
    0
  );

  if (loading) {
    return (
      <main
        dir={isArabic ? 'rtl' : 'ltr'}
        style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: '30px 16px 170px',
          textAlign: 'center',
        }}
      >
        {isArabic
          ? 'جاري تحميل المنتجات...'
          : 'Loading products...'}
      </main>
    );
  }

  return (
    <main
      dir={isArabic ? 'rtl' : 'ltr'}
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '20px 16px 170px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 18,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 24,
            }}
          >
            {isArabic ? 'منتجاتي' : 'My Products'}
          </h1>

          <div
            style={{
              marginTop: 5,
              opacity: 0.55,
              fontSize: 12,
            }}
          >
            {isArabic
              ? `${products.length} منتج`
              : `${products.length} products`}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onAddProduct?.()}
          style={{
            minHeight: 42,
            border: 0,
            borderRadius: 14,
            padding: '0 15px',
            background: '#10985f',
            color: '#fff',
            font: 'inherit',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          {isArabic ? '+ منتج جديد' : '+ New product'}
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(3, minmax(0, 1fr))',
          gap: 10,
          marginBottom: 16,
        }}
      >
        <StatCard
          value={products.length}
          label={isArabic ? 'المنتجات' : 'Products'}
        />

        <StatCard
          value={activeCount}
          label={isArabic ? 'النشطة' : 'Active'}
        />

        <StatCard
          value={totalStock}
          label={isArabic ? 'المخزون' : 'Stock'}
        />
      </div>

      <div
        style={{
          position: 'relative',
          marginBottom: 18,
        }}
      >
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={
            isArabic
              ? 'ابحث بالاسم أو SKU...'
              : 'Search name or SKU...'
          }
          style={{
            boxSizing: 'border-box',
            width: '100%',
            minHeight: 48,
            border: '1px solid rgba(0,0,0,.09)',
            borderRadius: 15,
            padding: '0 15px',
            background: 'var(--card, #fff)',
            color: 'inherit',
            font: 'inherit',
            outline: 'none',
          }}
        />
      </div>

      {error && (
        <div
          style={{
            padding: 16,
            borderRadius: 16,
            background: 'rgba(220,38,38,.06)',
            color: '#dc2626',
            textAlign: 'center',
            marginBottom: 16,
          }}
        >
          <div>{error}</div>

          <button
            type="button"
            onClick={loadProducts}
            style={{
              marginTop: 10,
              border: 0,
              background: 'transparent',
              color: '#10985f',
              font: 'inherit',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            {isArabic ? 'إعادة المحاولة' : 'Try again'}
          </button>
        </div>
      )}

      {!error && filteredProducts.length === 0 && (
        <div
          style={{
            padding: '50px 20px',
            textAlign: 'center',
            borderRadius: 20,
            background: 'var(--card, #fff)',
            border: '1px solid rgba(0,0,0,.06)',
          }}
        >
          <div style={{ fontSize: 38 }}>📦</div>

          <strong
            style={{
              display: 'block',
              marginTop: 10,
            }}
          >
            {search
              ? isArabic
                ? 'لا توجد نتائج'
                : 'No results'
              : isArabic
                ? 'لا توجد منتجات'
                : 'No products yet'}
          </strong>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gap: 12,
        }}
      >
        {filteredProducts.map((product) => (
          <article
            key={product.id}
            style={{
              padding: 14,
              borderRadius: 20,
              background: 'var(--card, #fff)',
              border: product.is_active
                ? '1px solid rgba(0,0,0,.06)'
                : '1px solid rgba(107,114,128,.18)',
              boxShadow: '0 8px 24px rgba(0,0,0,.035)',
              opacity: product.is_active ? 1 : 0.78,
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: 13,
              }}
            >
              <div
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: 17,
                  background: 'rgba(16,152,95,.07)',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                  overflow: 'hidden',
                }}
              >
                {product.image ? (
                  <img
                    src={product.image}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <span style={{ fontSize: 30 }}>📦</span>
                )}
              </div>

              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 10,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <strong
                      style={{
                        display: 'block',
                        fontSize: 15,
                        lineHeight: 1.5,
                      }}
                    >
                      {productName(product)}
                    </strong>

                    <div
                      style={{
                        marginTop: 3,
                        fontSize: 11,
                        opacity: 0.5,
                      }}
                    >
                      {product.sku || '-'}
                    </div>
                  </div>

                  <span
                    style={{
                      borderRadius: 999,
                      padding: '5px 8px',
                      fontSize: 10,
                      fontWeight: 800,
                      background: product.is_active
                        ? 'rgba(16,152,95,.09)'
                        : 'rgba(107,114,128,.10)',
                      color: product.is_active
                        ? '#10985f'
                        : '#6b7280',
                    }}
                  >
                    {product.is_active
                      ? isArabic
                        ? 'نشط'
                        : 'Active'
                      : isArabic
                        ? 'غير نشط'
                        : 'Inactive'}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 7,
                    marginTop: 10,
                  }}
                >
                  <SmallBadge>{categoryName(product)}</SmallBadge>

                  <SmallBadge>
                    {isArabic
                      ? `المخزون: ${product.stock}`
                      : `Stock: ${product.stock}`}
                  </SmallBadge>

                  {product.is_featured && (
                    <SmallBadge>
                      ⭐ {isArabic ? 'مميز' : 'Featured'}
                    </SmallBadge>
                  )}
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                marginTop: 14,
                paddingTop: 13,
                borderTop: '1px solid rgba(0,0,0,.055)',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 10,
                    opacity: 0.5,
                    marginBottom: 2,
                  }}
                >
                  {isArabic ? 'السعر' : 'Price'}
                </div>

                <strong
                  style={{
                    color: '#10985f',
                    fontSize: 15,
                  }}
                >
                  {money(product.price)}
                </strong>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 7,
                }}
              >
                <button
                  type="button"
                  onClick={() => onEditProduct?.(product)}
                  style={{
                    minHeight: 36,
                    borderRadius: 11,
                    border: '1px solid rgba(16,152,95,.20)',
                    background: 'rgba(16,152,95,.06)',
                    color: '#10985f',
                    padding: '0 12px',
                    font: 'inherit',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {isArabic ? 'تعديل' : 'Edit'}
                </button>

                {product.is_active && (
                  <button
                    type="button"
                    onClick={() => setDeactivateTarget(product)}
                    style={{
                      minHeight: 36,
                      borderRadius: 11,
                      border: '1px solid rgba(220,38,38,.18)',
                      background: 'rgba(220,38,38,.05)',
                      color: '#dc2626',
                      padding: '0 12px',
                      font: 'inherit',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {isArabic ? 'تعطيل' : 'Deactivate'}
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      {deactivateTarget && (
        <div
          onClick={() => {
            if (!deactivating) {
              setDeactivateTarget(null);
            }
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,.42)',
            display: 'grid',
            placeItems: 'center',
            padding: 18,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: 'min(420px, 100%)',
              background: 'var(--card, #fff)',
              borderRadius: 22,
              padding: 20,
              boxShadow: '0 24px 70px rgba(0,0,0,.20)',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                display: 'grid',
                placeItems: 'center',
                borderRadius: 15,
                background: 'rgba(220,38,38,.08)',
                fontSize: 22,
                marginBottom: 14,
              }}
            >
              ⏸️
            </div>

            <h3
              style={{
                margin: '0 0 7px',
                fontSize: 18,
              }}
            >
              {isArabic
                ? 'تعطيل المنتج؟'
                : 'Deactivate product?'}
            </h3>

            <p
              style={{
                margin: 0,
                opacity: 0.65,
                fontSize: 13,
                lineHeight: 1.7,
              }}
            >
              {isArabic
                ? `سيتم تعطيل "${productName(
                    deactivateTarget
                  )}" ولن يظهر كمنتج نشط، لكنه سيبقى محفوظاً في النظام.`
                : `"${productName(
                    deactivateTarget
                  )}" will be deactivated and kept in the system.`}
            </p>

            <div
              style={{
                display: 'flex',
                gap: 9,
                marginTop: 18,
              }}
            >
              <button
                type="button"
                disabled={deactivating}
                onClick={() => setDeactivateTarget(null)}
                style={{
                  flex: 1,
                  minHeight: 43,
                  borderRadius: 13,
                  border: '1px solid rgba(0,0,0,.10)',
                  background: 'transparent',
                  color: 'inherit',
                  font: 'inherit',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {isArabic ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                type="button"
                disabled={deactivating}
                onClick={confirmDeactivate}
                style={{
                  flex: 1,
                  minHeight: 43,
                  borderRadius: 13,
                  border: 0,
                  background: '#dc2626',
                  color: '#fff',
                  font: 'inherit',
                  fontWeight: 800,
                  cursor: deactivating ? 'wait' : 'pointer',
                  opacity: deactivating ? 0.7 : 1,
                }}
              >
                {deactivating
                  ? isArabic
                    ? 'جاري التعطيل...'
                    : 'Deactivating...'
                  : isArabic
                    ? 'تعطيل المنتج'
                    : 'Deactivate product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function StatCard({
  value,
  label,
}) {
  return (
    <div
      style={{
        padding: '14px 10px',
        borderRadius: 17,
        background: 'var(--card, #fff)',
        border: '1px solid rgba(0,0,0,.06)',
        textAlign: 'center',
      }}
    >
      <strong
        style={{
          display: 'block',
          fontSize: 20,
        }}
      >
        {value}
      </strong>

      <span
        style={{
          display: 'block',
          marginTop: 3,
          fontSize: 11,
          opacity: 0.55,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function SmallBadge({
  children,
}) {
  return (
    <span
      style={{
        padding: '5px 8px',
        borderRadius: 999,
        background: 'rgba(0,0,0,.045)',
        fontSize: 10,
        opacity: 0.75,
      }}
    >
      {children}
    </span>
  );
}

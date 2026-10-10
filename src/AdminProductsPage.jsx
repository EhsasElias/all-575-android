import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

const PRICE = 5.75;

export default function AdminProductsPage({
  lang = 'ar',
  api,
  categories = [],
  sellers = [],
  showToast,
  onBack,
}) {
  const isArabic = lang === 'ar';

  const [products, setProducts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState('');

  const [categoryFilter, setCategoryFilter] =
    useState('all');

  const [sellerFilter, setSellerFilter] =
    useState('all');

  const [statusFilter, setStatusFilter] =
    useState('all');

  const [editingProduct, setEditingProduct] =
    useState(null);

  const [deleteProduct, setDeleteProduct] =
    useState(null);

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);

    try {
      const response =
        await api.getAdminProducts();

      const rows =
        Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
            ? response
            : [];

      setProducts(rows);
    } catch (error) {
      console.error(
        'Admin products error:',
        error
      );

      showToast?.(
        isArabic
          ? 'تعذر تحميل المنتجات'
          : 'Could not load products'
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts =
    useMemo(() => {
      const q =
        search
          .trim()
          .toLowerCase();

      return products.filter(
        (product) => {
          const matchesSearch =
            !q ||
            [
              product.name_ar,
              product.name_en,
              product.sku,
              product.slug,
              product.seller?.name_ar,
              product.seller?.name_en,
            ]
              .filter(Boolean)
              .join(' ')
              .toLowerCase()
              .includes(q);

          const matchesCategory =
            categoryFilter === 'all' ||
            Number(product.category_id) ===
              Number(categoryFilter);

          const matchesSeller =
            sellerFilter === 'all' ||
            (
              sellerFilter === 'none'
                ? !product.seller_id
                : Number(product.seller_id) ===
                  Number(sellerFilter)
            );

          const matchesStatus =
            statusFilter === 'all' ||
            (
              statusFilter === 'active'
                ? Boolean(product.is_active)
                : !Boolean(product.is_active)
            );

          return (
            matchesSearch &&
            matchesCategory &&
            matchesSeller &&
            matchesStatus
          );
        }
      );
    }, [
      products,
      search,
      categoryFilter,
      sellerFilter,
      statusFilter,
    ]);

  const stats =
    useMemo(() => {
      return {
        total:
          products.length,

        active:
          products.filter(
            (product) =>
              product.is_active
          ).length,

        featured:
          products.filter(
            (product) =>
              product.is_featured
          ).length,

        outOfStock:
          products.filter(
            (product) =>
              Number(product.stock) <= 0
          ).length,
      };
    }, [products]);

  function categoryName(category) {
    if (!category) {
      return '-';
    }

    const ar =
      category.name_ar ||
      category.nameAr ||
      '';

    const en =
      category.name_en ||
      category.nameEn ||
      '';

    if (
      isArabic &&
      ar &&
      !/^\?+$/.test(
        ar.replace(/\s/g, '')
      )
    ) {
      return ar;
    }

    return en || ar || '-';
  }

  function sellerName(seller) {
    if (!seller) {
      return isArabic
        ? 'منتج المنصة'
        : 'Platform product';
    }

    return isArabic
      ? (
          seller.name_ar ||
          seller.nameAr ||
          seller.name_en ||
          seller.nameEn
        )
      : (
          seller.name_en ||
          seller.nameEn ||
          seller.name_ar ||
          seller.nameAr
        );
  }

  function openCreate() {
    setEditingProduct({
      id: null,
      category_id:
        categories[0]?.id || '',
      seller_id: '',
      name_ar: '',
      name_en: '',
      slug: '',
      description_ar: '',
      description_en: '',
      cost_price: '',
      stock: 0,
      sku: '',
      image: '',
      is_active: true,
      is_featured: false,
    });
  }

  function openEdit(product) {
    setEditingProduct({
      ...product,

      category_id:
        product.category_id || '',

      seller_id:
        product.seller_id || '',

      cost_price:
        product.cost_price ?? '',

      sku:
        product.sku || '',

      image:
        product.image || '',

      slug:
        product.slug || '',

      description_ar:
        product.description_ar || '',

      description_en:
        product.description_en || '',
    });
  }

  async function saveProduct(
    event
  ) {
    event.preventDefault();

    if (!editingProduct) {
      return;
    }

    if (
      !editingProduct.category_id ||
      !editingProduct.name_ar?.trim() ||
      !editingProduct.name_en?.trim()
    ) {
      showToast?.(
        isArabic
          ? 'أكمل الحقول المطلوبة'
          : 'Complete required fields'
      );

      return;
    }

    const payload = {
      category_id:
        Number(
          editingProduct.category_id
        ),

      seller_id:
        editingProduct.seller_id
          ? Number(
              editingProduct.seller_id
            )
          : null,

      name_ar:
        editingProduct.name_ar.trim(),

      name_en:
        editingProduct.name_en.trim(),

      slug:
        editingProduct.slug?.trim() ||
        null,

      description_ar:
        editingProduct.description_ar
          ?.trim() ||
        null,

      description_en:
        editingProduct.description_en
          ?.trim() ||
        null,

      cost_price:
        editingProduct.cost_price === ''
          ? null
          : Number(
              editingProduct.cost_price
            ),

      stock:
        Number(
          editingProduct.stock || 0
        ),

      sku:
        editingProduct.sku?.trim() ||
        null,

      image:
        editingProduct.image?.trim() ||
        null,

      is_active:
        Boolean(
          editingProduct.is_active
        ),

      is_featured:
        Boolean(
          editingProduct.is_featured
        ),
    };

    setSaving(true);

    try {
      if (editingProduct.id) {
        await api.updateAdminProduct(
          editingProduct.id,
          payload
        );

        showToast?.(
          isArabic
            ? 'تم تحديث المنتج'
            : 'Product updated'
        );
      } else {
        await api.createAdminProduct(
          payload
        );

        showToast?.(
          isArabic
            ? 'تم إنشاء المنتج'
            : 'Product created'
        );
      }

      setEditingProduct(null);

      await loadProducts();
    } catch (error) {
      console.error(
        'Save admin product error:',
        error
      );

      const firstError =
        error?.errors
          ? Object.values(
              error.errors
            )?.[0]?.[0]
          : null;

      showToast?.(
        firstError ||
        error?.message ||
        (
          isArabic
            ? 'تعذر حفظ المنتج'
            : 'Could not save product'
        )
      );
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteProduct) {
      return;
    }

    setDeleting(true);

    try {
      await api.deleteAdminProduct(
        deleteProduct.id
      );

      setProducts(
        (current) =>
          current.filter(
            (product) =>
              Number(product.id) !==
              Number(
                deleteProduct.id
              )
          )
      );

      showToast?.(
        isArabic
          ? 'تم حذف المنتج'
          : 'Product deleted'
      );

      setDeleteProduct(null);
    } catch (error) {
      console.error(
        'Delete admin product error:',
        error
      );

      showToast?.(
        error?.message ||
        (
          isArabic
            ? 'تعذر حذف المنتج'
            : 'Could not delete product'
        )
      );
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <main
        dir={
          isArabic
            ? 'rtl'
            : 'ltr'
        }
        style={{
          maxWidth: 950,
          margin: '0 auto',
          padding:
            '30px 16px 170px',
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
      dir={
        isArabic
          ? 'rtl'
          : 'ltr'
      }
      style={{
        maxWidth: 950,
        margin: '0 auto',
        padding:
          '20px 16px 170px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent:
            'space-between',
          alignItems:
            'flex-start',
          gap: 12,
          marginBottom: 18,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 25,
            }}
          >
            {isArabic
              ? 'إدارة المنتجات'
              : 'Admin Products'}
          </h1>

          <div
            style={{
              marginTop: 5,
              fontSize: 11,
              opacity: 0.55,
            }}
          >
            {isArabic
              ? 'إدارة جميع منتجات المتجر والبائعين'
              : 'Manage all platform and seller products'}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 8,
          }}
        >
          <button
            type="button"
            onClick={onBack}
            style={
              secondaryButton
            }
          >
            {isArabic
              ? 'رجوع'
              : 'Back'}
          </button>

          <button
            type="button"
            onClick={
              openCreate
            }
            style={
              primaryButton
            }
          >
            {isArabic
              ? '+ منتج جديد'
              : '+ New Product'}
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(4, minmax(0,1fr))',
          gap: 9,
          marginBottom: 14,
        }}
      >
        <Stat
          label={
            isArabic
              ? 'المنتجات'
              : 'Products'
          }
          value={
            stats.total
          }
        />

        <Stat
          label={
            isArabic
              ? 'النشطة'
              : 'Active'
          }
          value={
            stats.active
          }
        />

        <Stat
          label={
            isArabic
              ? 'المميزة'
              : 'Featured'
          }
          value={
            stats.featured
          }
        />

        <Stat
          label={
            isArabic
              ? 'نفذت الكمية'
              : 'Out of stock'
          }
          value={
            stats.outOfStock
          }
        />
      </div>

      <section
        style={{
          padding: 14,
          borderRadius: 18,
          background:
            'var(--card, #fff)',
          border:
            '1px solid rgba(0,0,0,.06)',
          marginBottom: 14,
        }}
      >
        <input
          value={search}
          onChange={
            (event) =>
              setSearch(
                event.target.value
              )
          }
          placeholder={
            isArabic
              ? 'ابحث بالاسم أو SKU...'
              : 'Search name or SKU...'
          }
          style={
            inputStyle
          }
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(3, minmax(0,1fr))',
            gap: 8,
            marginTop: 9,
          }}
        >
          <select
            value={
              categoryFilter
            }
            onChange={
              (event) =>
                setCategoryFilter(
                  event.target.value
                )
            }
            style={
              inputStyle
            }
          >
            <option value="all">
              {isArabic
                ? 'كل الأقسام'
                : 'All categories'}
            </option>

            {categories.map(
              (category) => (
                <option
                  key={
                    category.id
                  }
                  value={
                    category.id
                  }
                >
                  {categoryName(
                    category
                  )}
                </option>
              )
            )}
          </select>

          <select
            value={
              sellerFilter
            }
            onChange={
              (event) =>
                setSellerFilter(
                  event.target.value
                )
            }
            style={
              inputStyle
            }
          >
            <option value="all">
              {isArabic
                ? 'كل البائعين'
                : 'All sellers'}
            </option>

            <option value="none">
              {isArabic
                ? 'منتجات المنصة'
                : 'Platform products'}
            </option>

            {sellers.map(
              (seller) => (
                <option
                  key={
                    seller.id
                  }
                  value={
                    seller.id
                  }
                >
                  {sellerName(
                    seller
                  )}
                </option>
              )
            )}
          </select>

          <select
            value={
              statusFilter
            }
            onChange={
              (event) =>
                setStatusFilter(
                  event.target.value
                )
            }
            style={
              inputStyle
            }
          >
            <option value="all">
              {isArabic
                ? 'كل الحالات'
                : 'All statuses'}
            </option>

            <option value="active">
              {isArabic
                ? 'نشط'
                : 'Active'}
            </option>

            <option value="inactive">
              {isArabic
                ? 'غير نشط'
                : 'Inactive'}
            </option>
          </select>
        </div>
      </section>

      <div
        style={{
          display: 'grid',
          gap: 11,
        }}
      >
        {filteredProducts.map(
          (product) => (
            <article
              key={
                product.id
              }
              style={{
                display: 'grid',
                gridTemplateColumns:
                  '72px 1fr auto',
                gap: 13,
                alignItems:
                  'center',
                padding: 14,
                borderRadius: 18,
                background:
                  'var(--card, #fff)',
                border:
                  '1px solid rgba(0,0,0,.06)',
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 15,
                  overflow: 'hidden',
                  background:
                    'rgba(16,152,95,.06)',
                  display: 'grid',
                  placeItems:
                    'center',
                }}
              >
                {product.image ? (
                  <img
                    src={
                      product.image
                    }
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit:
                        'cover',
                    }}
                  />
                ) : (
                  <span
                    style={{
                      fontSize: 28,
                    }}
                  >
                    📦
                  </span>
                )}
              </div>

              <div>
                <strong
                  style={{
                    display:
                      'block',
                    fontSize: 14,
                  }}
                >
                  {isArabic
                    ? product.name_ar
                    : product.name_en}
                </strong>

                <div
                  style={{
                    marginTop: 5,
                    fontSize: 10,
                    opacity: 0.55,
                  }}
                >
                  {sellerName(
                    product.seller
                  )}
                  {' · '}
                  {categoryName(
                    product.category
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexWrap:
                      'wrap',
                    gap: 6,
                    marginTop: 8,
                  }}
                >
                  <Badge>
                    {PRICE.toFixed(
                      2
                    )}{' '}
                    SAR
                  </Badge>

                  <Badge>
                    {isArabic
                      ? `المخزون ${product.stock}`
                      : `Stock ${product.stock}`}
                  </Badge>

                  {product.sku && (
                    <Badge>
                      SKU:{' '}
                      {product.sku}
                    </Badge>
                  )}

                  <Badge>
                    {product.is_active
                      ? (
                          isArabic
                            ? 'نشط'
                            : 'Active'
                        )
                      : (
                          isArabic
                            ? 'غير نشط'
                            : 'Inactive'
                        )}
                  </Badge>

                  {product.is_featured && (
                    <Badge>
                      {isArabic
                        ? 'مميز'
                        : 'Featured'}
                    </Badge>
                  )}
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gap: 7,
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    openEdit(
                      product
                    )
                  }
                  style={
                    secondaryButton
                  }
                >
                  {isArabic
                    ? 'تعديل'
                    : 'Edit'}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setDeleteProduct(
                      product
                    )
                  }
                  style={
                    dangerButton
                  }
                >
                  {isArabic
                    ? 'حذف'
                    : 'Delete'}
                </button>
              </div>
            </article>
          )
        )}

        {!filteredProducts.length && (
          <div
            style={{
              textAlign: 'center',
              padding: 35,
              opacity: 0.55,
            }}
          >
            {isArabic
              ? 'لا توجد منتجات مطابقة'
              : 'No matching products'}
          </div>
        )}
      </div>

      {editingProduct && (
        <ProductEditor
          product={
            editingProduct
          }
          setProduct={
            setEditingProduct
          }
          categories={
            categories
          }
          sellers={
            sellers
          }
          lang={
            lang
          }
          categoryName={
            categoryName
          }
          sellerName={
            sellerName
          }
          saving={
            saving
          }
          onSubmit={
            saveProduct
          }
          onClose={() =>
            setEditingProduct(
              null
            )
          }
        />
      )}

      {deleteProduct && (
        <div
          style={
            overlayStyle
          }
        >
          <div
            style={
              modalStyle
            }
          >
            <h2
              style={{
                margin:
                  '0 0 8px',
                fontSize: 18,
              }}
            >
              {isArabic
                ? 'حذف المنتج؟'
                : 'Delete product?'}
            </h2>

            <p
              style={{
                opacity: 0.65,
                fontSize: 12,
                lineHeight: 1.7,
              }}
            >
              {isArabic
                ? 'سيتم حذف المنتج نهائياً من قاعدة البيانات.'
                : 'This permanently deletes the product from the database.'}
            </p>

            <strong>
              {isArabic
                ? deleteProduct.name_ar
                : deleteProduct.name_en}
            </strong>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  '1fr 1fr',
                gap: 8,
                marginTop: 18,
              }}
            >
              <button
                type="button"
                disabled={
                  deleting
                }
                onClick={
                  confirmDelete
                }
                style={
                  dangerButton
                }
              >
                {deleting
                  ? (
                      isArabic
                        ? 'جاري الحذف...'
                        : 'Deleting...'
                    )
                  : (
                      isArabic
                        ? 'تأكيد الحذف'
                        : 'Confirm delete'
                    )}
              </button>

              <button
                type="button"
                disabled={
                  deleting
                }
                onClick={() =>
                  setDeleteProduct(
                    null
                  )
                }
                style={
                  secondaryButton
                }
              >
                {isArabic
                  ? 'إلغاء'
                  : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function ProductEditor({
  product,
  setProduct,
  categories,
  sellers,
  lang,
  categoryName,
  sellerName,
  saving,
  onSubmit,
  onClose,
}) {
  const isArabic =
    lang === 'ar';

  function set(
    field,
    value
  ) {
    setProduct(
      (current) => ({
        ...current,
        [field]: value,
      })
    );
  }

  return (
    <div
      style={
        overlayStyle
      }
    >
      <form
        onSubmit={
          onSubmit
        }
        style={{
          ...modalStyle,
          maxWidth: 620,
          maxHeight:
            'calc(100vh - 32px)',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            gap: 12,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 19,
              }}
            >
              {product.id
                ? (
                    isArabic
                      ? 'تعديل المنتج'
                      : 'Edit Product'
                  )
                : (
                    isArabic
                      ? 'منتج جديد'
                      : 'New Product'
                  )}
            </h2>

            <div
              style={{
                marginTop: 5,
                opacity: 0.55,
                fontSize: 10,
              }}
            >
              {isArabic
                ? 'السعر ثابت من النظام: 5,75 ر.س'
                : 'Price is fixed by server: 5.75 SAR'}
            </div>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            style={{
              border: 0,
              background:
                'transparent',
              color: 'inherit',
              fontSize: 22,
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gap: 13,
            marginTop: 18,
          }}
        >
          <Field
            label={
              isArabic
                ? 'الاسم بالعربية *'
                : 'Arabic name *'
            }
          >
            <input
              value={
                product.name_ar
              }
              onChange={
                (event) =>
                  set(
                    'name_ar',
                    event.target.value
                  )
              }
              maxLength={255}
              style={
                inputStyle
              }
            />
          </Field>

          <Field
            label={
              isArabic
                ? 'الاسم بالإنجليزية *'
                : 'English name *'
            }
          >
            <input
              value={
                product.name_en
              }
              onChange={
                (event) =>
                  set(
                    'name_en',
                    event.target.value
                  )
              }
              maxLength={255}
              style={
                inputStyle
              }
            />
          </Field>

          <div
            style={
              twoColumns
            }
          >
            <Field
              label={
                isArabic
                  ? 'القسم *'
                  : 'Category *'
              }
            >
              <select
                value={
                  product.category_id
                }
                onChange={
                  (event) =>
                    set(
                      'category_id',
                      event.target.value
                    )
                }
                style={
                  inputStyle
                }
              >
                {categories.map(
                  (category) => (
                    <option
                      key={
                        category.id
                      }
                      value={
                        category.id
                      }
                    >
                      {categoryName(
                        category
                      )}
                    </option>
                  )
                )}
              </select>
            </Field>

            <Field
              label={
                isArabic
                  ? 'البائع'
                  : 'Seller'
              }
            >
              <select
                value={
                  product.seller_id
                }
                onChange={
                  (event) =>
                    set(
                      'seller_id',
                      event.target.value
                    )
                }
                style={
                  inputStyle
                }
              >
                <option value="">
                  {isArabic
                    ? 'منتج المنصة'
                    : 'Platform product'}
                </option>

                {sellers.map(
                  (seller) => (
                    <option
                      key={
                        seller.id
                      }
                      value={
                        seller.id
                      }
                    >
                      {sellerName(
                        seller
                      )}
                    </option>
                  )
                )}
              </select>
            </Field>
          </div>

          <div
            style={
              twoColumns
            }
          >
            <Field
              label={
                isArabic
                  ? 'المخزون *'
                  : 'Stock *'
              }
            >
              <input
                type="number"
                min="0"
                value={
                  product.stock
                }
                onChange={
                  (event) =>
                    set(
                      'stock',
                      event.target.value
                    )
                }
                style={
                  inputStyle
                }
              />
            </Field>

            <Field
              label={
                isArabic
                  ? 'سعر التكلفة'
                  : 'Cost price'
              }
            >
              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  product.cost_price
                }
                onChange={
                  (event) =>
                    set(
                      'cost_price',
                      event.target.value
                    )
                }
                style={
                  inputStyle
                }
              />
            </Field>
          </div>

          <div
            style={
              twoColumns
            }
          >
            <Field label="SKU">
              <input
                value={
                  product.sku
                }
                onChange={
                  (event) =>
                    set(
                      'sku',
                      event.target.value
                    )
                }
                maxLength={100}
                style={
                  inputStyle
                }
              />
            </Field>

            <Field label="Slug">
              <input
                value={
                  product.slug
                }
                onChange={
                  (event) =>
                    set(
                      'slug',
                      event.target.value
                    )
                }
                maxLength={255}
                style={
                  inputStyle
                }
              />
            </Field>
          </div>

          <Field
            label={
              isArabic
                ? 'رابط الصورة'
                : 'Image URL'
            }
          >
            <input
              value={
                product.image
              }
              onChange={
                (event) =>
                  set(
                    'image',
                    event.target.value
                  )
              }
              placeholder="https://..."
              style={
                inputStyle
              }
            />
          </Field>

          <Field
            label={
              isArabic
                ? 'الوصف بالعربية'
                : 'Arabic description'
            }
          >
            <textarea
              value={
                product.description_ar
              }
              onChange={
                (event) =>
                  set(
                    'description_ar',
                    event.target.value
                  )
              }
              rows={3}
              style={{
                ...inputStyle,
                padding: 12,
              }}
            />
          </Field>

          <Field
            label={
              isArabic
                ? 'الوصف بالإنجليزية'
                : 'English description'
            }
          >
            <textarea
              value={
                product.description_en
              }
              onChange={
                (event) =>
                  set(
                    'description_en',
                    event.target.value
                  )
              }
              rows={3}
              style={{
                ...inputStyle,
                padding: 12,
              }}
            />
          </Field>

          <label
            style={
              checkStyle
            }
          >
            <input
              type="checkbox"
              checked={
                Boolean(
                  product.is_active
                )
              }
              onChange={
                (event) =>
                  set(
                    'is_active',
                    event.target.checked
                  )
              }
            />

            <span>
              {isArabic
                ? 'المنتج نشط'
                : 'Product active'}
            </span>
          </label>

          <label
            style={
              checkStyle
            }
          >
            <input
              type="checkbox"
              checked={
                Boolean(
                  product.is_featured
                )
              }
              onChange={
                (event) =>
                  set(
                    'is_featured',
                    event.target.checked
                  )
              }
            />

            <span>
              {isArabic
                ? 'منتج مميز'
                : 'Featured product'}
            </span>
          </label>

          <button
            type="submit"
            disabled={
              saving
            }
            style={{
              ...primaryButton,
              minHeight: 50,
            }}
          >
            {saving
              ? (
                  isArabic
                    ? 'جاري الحفظ...'
                    : 'Saving...'
                )
              : (
                  isArabic
                    ? 'حفظ المنتج'
                    : 'Save product'
                )}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
}) {
  return (
    <label
      style={{
        display: 'grid',
        gap: 7,
        fontSize: 11,
        fontWeight: 750,
      }}
    >
      <span>
        {label}
      </span>

      {children}
    </label>
  );
}

function Stat({
  label,
  value,
}) {
  return (
    <div
      style={{
        padding: 12,
        borderRadius: 15,
        background:
          'var(--card, #fff)',
        border:
          '1px solid rgba(0,0,0,.06)',
        textAlign: 'center',
      }}
    >
      <strong
        style={{
          display: 'block',
          fontSize: 19,
        }}
      >
        {value}
      </strong>

      <span
        style={{
          fontSize: 9,
          opacity: 0.55,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function Badge({
  children,
}) {
  return (
    <span
      style={{
        padding: '5px 8px',
        borderRadius: 999,
        background:
          'rgba(16,152,95,.07)',
        color: '#10985f',
        fontSize: 9,
        fontWeight: 800,
      }}
    >
      {children}
    </span>
  );
}

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  minHeight: 44,
  border:
    '1px solid rgba(0,0,0,.10)',
  borderRadius: 12,
  background:
    'var(--card, #fff)',
  color: 'inherit',
  padding: '0 12px',
  font: 'inherit',
  outline: 'none',
};

const primaryButton = {
  minHeight: 40,
  padding: '0 14px',
  border: 0,
  borderRadius: 12,
  background: '#10985f',
  color: '#fff',
  font: 'inherit',
  fontWeight: 850,
  cursor: 'pointer',
};

const secondaryButton = {
  minHeight: 40,
  padding: '0 14px',
  borderRadius: 12,
  border:
    '1px solid rgba(0,0,0,.10)',
  background:
    'var(--card, #fff)',
  color: 'inherit',
  font: 'inherit',
  fontWeight: 800,
  cursor: 'pointer',
};

const dangerButton = {
  minHeight: 40,
  padding: '0 14px',
  borderRadius: 12,
  border:
    '1px solid rgba(220,38,38,.15)',
  background:
    'rgba(220,38,38,.06)',
  color: '#dc2626',
  font: 'inherit',
  fontWeight: 800,
  cursor: 'pointer',
};

const twoColumns = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(2, minmax(0,1fr))',
  gap: 10,
};

const checkStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 9,
  fontSize: 12,
  fontWeight: 750,
};

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  zIndex: 1000,
  display: 'grid',
  placeItems: 'center',
  padding: 16,
  background:
    'rgba(0,0,0,.38)',
};

const modalStyle = {
  width: '100%',
  maxWidth: 480,
  padding: 18,
  borderRadius: 22,
  background:
    'var(--card, #fff)',
  color: 'inherit',
  boxShadow:
    '0 24px 70px rgba(0,0,0,.18)',
};
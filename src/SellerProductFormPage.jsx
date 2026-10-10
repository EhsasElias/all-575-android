import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

const FIXED_PRICE = 5.75;

export default function SellerProductFormPage({
  lang = 'ar',
  api,
  categories = [],
  product = null,
  showToast,
  onSaved,
  onCancel,
}) {
  const isArabic =
    lang === 'ar';

  const isEdit =
    Boolean(product?.id);

  const [
    form,
    setForm,
  ] = useState({
    categoryId: '',
    nameAr: '',
    nameEn: '',
    descriptionAr: '',
    descriptionEn: '',
    stock: '0',
    sku: '',
    image: '',
    isActive: true,
  });

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    errors,
    setErrors,
  ] = useState({});

  /*
  |--------------------------------------------------------------------------
  | Populate form
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (product?.id) {
      setForm({
        categoryId:
          product.category_id != null
            ? String(
                product.category_id
              )
            : '',

        nameAr:
          product.name_ar ||
          '',

        nameEn:
          product.name_en ||
          '',

        descriptionAr:
          product.description_ar ||
          '',

        descriptionEn:
          product.description_en ||
          '',

        stock:
          product.stock != null
            ? String(
                product.stock
              )
            : '0',

        sku:
          product.sku ||
          '',

        image:
          product.image ||
          '',

        isActive:
          Boolean(
            product.is_active
          ),
      });

      return;
    }

    setForm({
      categoryId:
        categories?.[0]?.id != null
          ? String(
              categories[0].id
            )
          : '',

      nameAr: '',
      nameEn: '',
      descriptionAr: '',
      descriptionEn: '',
      stock: '0',
      sku: '',
      image: '',
      isActive: true,
    });
  }, [
    product,
    categories,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Helpers
  |--------------------------------------------------------------------------
  */

  function updateField(
    field,
    value
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      })
    );

    if (errors[field]) {
      setErrors(
        (current) => ({
          ...current,
          [field]: '',
        })
      );
    }
  }

  function categoryName(
    category
  ) {
    if (!category) {
      return '-';
    }

    const arabicName =
      category.name_ar ||
      category.nameAr ||
      '';

    const englishName =
      category.name_en ||
      category.nameEn ||
      '';

    /*
    |--------------------------------------------------------------------------
    | Avoid corrupted ???? Arabic category names
    |--------------------------------------------------------------------------
    */

    const corruptedArabic =
      arabicName &&
      /^\?+$/.test(
        arabicName.replace(
          /\s/g,
          ''
        )
      );

    if (isArabic) {
      if (
        arabicName &&
        !corruptedArabic
      ) {
        return arabicName;
      }

      return (
        englishName ||
        arabicName ||
        '-'
      );
    }

    return (
      englishName ||
      arabicName ||
      '-'
    );
  }

  const activeCategories =
    useMemo(
      () =>
        categories.filter(
          (category) =>
            category.is_active ===
              undefined ||
            category.is_active ===
              null ||
            Boolean(
              category.is_active
            )
        ),
      [categories]
    );

  /*
  |--------------------------------------------------------------------------
  | Frontend validation
  |--------------------------------------------------------------------------
  */

  function validate() {
    const next = {};

    if (!form.categoryId) {
      next.categoryId =
        isArabic
          ? 'اختر القسم'
          : 'Select a category';
    }

    if (
      !form.nameAr.trim()
    ) {
      next.nameAr =
        isArabic
          ? 'اسم المنتج بالعربية مطلوب'
          : 'Arabic product name is required';
    }

    if (
      !form.nameEn.trim()
    ) {
      next.nameEn =
        isArabic
          ? 'اسم المنتج بالإنجليزية مطلوب'
          : 'English product name is required';
    }

    if (
      form.nameAr.trim()
        .length > 255
    ) {
      next.nameAr =
        isArabic
          ? 'الاسم طويل جداً'
          : 'Name is too long';
    }

    if (
      form.nameEn.trim()
        .length > 255
    ) {
      next.nameEn =
        isArabic
          ? 'الاسم طويل جداً'
          : 'Name is too long';
    }

    const stock =
      Number(form.stock);

    if (
      form.stock === '' ||
      !Number.isInteger(
        stock
      ) ||
      stock < 0
    ) {
      next.stock =
        isArabic
          ? 'المخزون يجب أن يكون رقماً صحيحاً صفر أو أكثر'
          : 'Stock must be a whole number of 0 or more';
    }

    if (
      form.sku.trim()
        .length > 100
    ) {
      next.sku =
        isArabic
          ? 'SKU يجب ألا يتجاوز 100 حرف'
          : 'SKU cannot exceed 100 characters';
    }

    if (
      form.image.trim()
        .length > 2048
    ) {
      next.image =
        isArabic
          ? 'رابط الصورة طويل جداً'
          : 'Image URL is too long';
    }

    setErrors(next);

    return (
      Object.keys(next)
        .length === 0
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Laravel validation mapping
  |--------------------------------------------------------------------------
  */

  function mapBackendErrors(
    backendErrors
  ) {
    if (
      !backendErrors ||
      typeof backendErrors !==
        'object'
    ) {
      return {};
    }

    const mapping = {
      category_id:
        'categoryId',

      name_ar:
        'nameAr',

      name_en:
        'nameEn',

      description_ar:
        'descriptionAr',

      description_en:
        'descriptionEn',

      stock:
        'stock',

      sku:
        'sku',

      image:
        'image',

      is_active:
        'isActive',
    };

    const result = {};

    Object.entries(
      backendErrors
    ).forEach(
      ([
        backendField,
        messages,
      ]) => {
        const frontendField =
          mapping[
            backendField
          ];

        if (
          !frontendField
        ) {
          return;
        }

        result[
          frontendField
        ] = Array.isArray(
          messages
        )
          ? messages[0]
          : String(
              messages
            );
      }
    );

    return result;
  }

  /*
  |--------------------------------------------------------------------------
  | Submit
  |--------------------------------------------------------------------------
  */

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setSaving(true);
    setErrors({});

    const payload = {
      category_id:
        Number(
          form.categoryId
        ),

      name_ar:
        form.nameAr.trim(),

      name_en:
        form.nameEn.trim(),

      description_ar:
        form.descriptionAr
          .trim() ||
        null,

      description_en:
        form.descriptionEn
          .trim() ||
        null,

      stock:
        Number(
          form.stock
        ),

      sku:
        form.sku.trim() ||
        null,

      image:
        form.image.trim() ||
        null,
    };

    /*
    |--------------------------------------------------------------------------
    | is_active is accepted only by update in your controller
    |--------------------------------------------------------------------------
    */

    if (isEdit) {
      payload.is_active =
        Boolean(
          form.isActive
        );
    }

    try {
      let response;

      if (isEdit) {
        response =
          await api
            .updateSellerProduct(
              product.id,
              payload
            );
      } else {
        response =
          await api
            .createSellerProduct(
              payload
            );
      }

      const savedProduct =
        response?.data ||
        response;

      if (showToast) {
        showToast(
          isEdit
            ? (
                isArabic
                  ? 'تم تحديث المنتج بنجاح'
                  : 'Product updated successfully'
              )
            : (
                isArabic
                  ? 'تم إضافة المنتج بنجاح'
                  : 'Product created successfully'
              )
        );
      }

      onSaved?.(
        savedProduct
      );
    } catch (error) {
      console.error(
        'Seller product save error:',
        error
      );

      const backendErrors =
        mapBackendErrors(
          error?.errors
        );

      if (
        Object.keys(
          backendErrors
        ).length > 0
      ) {
        setErrors(
          backendErrors
        );
      }

      if (showToast) {
        showToast(
          error?.message ||
            (
              isArabic
                ? 'تعذر حفظ المنتج'
                : 'Could not save product'
            )
        );
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <main
      dir={
        isArabic
          ? 'rtl'
          : 'ltr'
      }
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding:
          '20px 16px 170px',
      }}
    >
      {/* Header */}

      <div
        style={{
          display: 'flex',
          justifyContent:
            'space-between',
          alignItems:
            'center',
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
            {isEdit
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
          </h1>

          <div
            style={{
              marginTop: 5,
              opacity: 0.55,
              fontSize: 12,
            }}
          >
            {isArabic
              ? 'السعر ثابت لجميع المنتجات'
              : 'All products have a fixed price'}
          </div>
        </div>

        <button
          type="button"
          onClick={
            onCancel
          }
          style={{
            minHeight: 40,
            borderRadius: 13,
            padding:
              '0 14px',
            border:
              '1px solid rgba(0,0,0,.10)',
            background:
              'var(--card, #fff)',
            color: 'inherit',
            font: 'inherit',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {isArabic
            ? 'رجوع'
            : 'Back'}
        </button>
      </div>

      <form
        onSubmit={
          handleSubmit
        }
        style={{
          display: 'grid',
          gap: 14,
        }}
      >
        {/* Fixed price */}

        <section
          style={{
            padding: 17,
            borderRadius: 19,
            border:
              '1px solid rgba(16,152,95,.16)',
            background:
              'rgba(16,152,95,.055)',
          }}
        >
          <div
            style={{
              fontSize: 11,
              opacity: 0.6,
            }}
          >
            {isArabic
              ? 'سعر البيع'
              : 'Selling price'}
          </div>

          <strong
            style={{
              display: 'block',
              color:
                '#10985f',
              marginTop: 4,
              fontSize: 22,
            }}
          >
            {isArabic
              ? '5,75 ر.س'
              : `${FIXED_PRICE.toFixed(
                  2
                )} SAR`}
          </strong>

          <div
            style={{
              marginTop: 5,
              fontSize: 11,
              opacity: 0.5,
            }}
          >
            {isArabic
              ? 'لا يستطيع البائع تغيير السعر.'
              : 'The seller cannot change the price.'}
          </div>
        </section>

        {/* Names */}

        <FormCard
          title={
            isArabic
              ? 'معلومات المنتج'
              : 'Product information'
          }
        >
          <Field
            label={
              isArabic
                ? 'اسم المنتج بالعربية'
                : 'Arabic product name'
            }
            required
            error={
              errors.nameAr
            }
          >
            <input
              value={
                form.nameAr
              }
              onChange={
                (event) =>
                  updateField(
                    'nameAr',
                    event.target
                      .value
                  )
              }
              maxLength={255}
              placeholder="مثال: مناديل ورقية"
              style={
                inputStyle
              }
            />
          </Field>

          <Field
            label={
              isArabic
                ? 'اسم المنتج بالإنجليزية'
                : 'English product name'
            }
            required
            error={
              errors.nameEn
            }
          >
            <input
              value={
                form.nameEn
              }
              onChange={
                (event) =>
                  updateField(
                    'nameEn',
                    event.target
                      .value
                  )
              }
              maxLength={255}
              placeholder="Example: Tissue Paper"
              style={
                inputStyle
              }
            />
          </Field>

          <Field
            label={
              isArabic
                ? 'القسم'
                : 'Category'
            }
            required
            error={
              errors.categoryId
            }
          >
            <select
              value={
                form.categoryId
              }
              onChange={
                (event) =>
                  updateField(
                    'categoryId',
                    event.target
                      .value
                  )
              }
              style={
                inputStyle
              }
            >
              <option value="">
                {isArabic
                  ? 'اختر القسم'
                  : 'Select category'}
              </option>

              {activeCategories.map(
                (
                  category
                ) => (
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
        </FormCard>

        {/* Descriptions */}

        <FormCard
          title={
            isArabic
              ? 'الوصف'
              : 'Description'
          }
        >
          <Field
            label={
              isArabic
                ? 'الوصف بالعربية'
                : 'Arabic description'
            }
            error={
              errors.descriptionAr
            }
          >
            <textarea
              value={
                form.descriptionAr
              }
              onChange={
                (event) =>
                  updateField(
                    'descriptionAr',
                    event.target
                      .value
                  )
              }
              rows={4}
              style={{
                ...inputStyle,
                minHeight: 105,
                padding:
                  '12px 14px',
                resize:
                  'vertical',
              }}
            />
          </Field>

          <Field
            label={
              isArabic
                ? 'الوصف بالإنجليزية'
                : 'English description'
            }
            error={
              errors.descriptionEn
            }
          >
            <textarea
              value={
                form.descriptionEn
              }
              onChange={
                (event) =>
                  updateField(
                    'descriptionEn',
                    event.target
                      .value
                  )
              }
              rows={4}
              style={{
                ...inputStyle,
                minHeight: 105,
                padding:
                  '12px 14px',
                resize:
                  'vertical',
              }}
            />
          </Field>
        </FormCard>

        {/* Inventory */}

        <FormCard
          title={
            isArabic
              ? 'المخزون والرمز'
              : 'Inventory & SKU'
          }
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(2, minmax(0, 1fr))',
              gap: 12,
            }}
          >
            <Field
              label={
                isArabic
                  ? 'المخزون'
                  : 'Stock'
              }
              required
              error={
                errors.stock
              }
            >
              <input
                type="number"
                min="0"
                step="1"
                value={
                  form.stock
                }
                onChange={
                  (event) =>
                    updateField(
                      'stock',
                      event.target
                        .value
                    )
                }
                style={
                  inputStyle
                }
              />
            </Field>

            <Field
              label="SKU"
              error={
                errors.sku
              }
            >
              <input
                value={
                  form.sku
                }
                onChange={
                  (event) =>
                    updateField(
                      'sku',
                      event.target
                        .value
                    )
                }
                maxLength={100}
                placeholder="SELLER-0003"
                style={
                  inputStyle
                }
              />
            </Field>
          </div>
        </FormCard>

        {/* Image */}

        <FormCard
          title={
            isArabic
              ? 'صورة المنتج'
              : 'Product image'
          }
        >
          <Field
            label={
              isArabic
                ? 'رابط الصورة'
                : 'Image URL'
            }
            error={
              errors.image
            }
          >
            <input
              value={
                form.image
              }
              onChange={
                (event) =>
                  updateField(
                    'image',
                    event.target
                      .value
                  )
              }
              maxLength={2048}
              placeholder="https://..."
              style={
                inputStyle
              }
            />
          </Field>

          {form.image.trim() && (
            <div
              style={{
                marginTop: 12,
                width: 110,
                height: 110,
                borderRadius: 18,
                overflow:
                  'hidden',
                border:
                  '1px solid rgba(0,0,0,.08)',
                background:
                  'rgba(0,0,0,.03)',
              }}
            >
              <img
                src={
                  form.image
                }
                alt=""
                onError={
                  (event) => {
                    event.currentTarget
                      .style
                      .display =
                      'none';
                  }
                }
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit:
                    'cover',
                }}
              />
            </div>
          )}
        </FormCard>

        {/* Edit-only status */}

        {isEdit && (
          <FormCard
            title={
              isArabic
                ? 'حالة المنتج'
                : 'Product status'
            }
          >
            <label
              style={{
                display: 'flex',
                alignItems:
                  'center',
                justifyContent:
                  'space-between',
                gap: 15,
                cursor:
                  'pointer',
              }}
            >
              <div>
                <strong
                  style={{
                    display:
                      'block',
                    fontSize:
                      14,
                  }}
                >
                  {isArabic
                    ? 'المنتج نشط'
                    : 'Product active'}
                </strong>

                <span
                  style={{
                    display:
                      'block',
                    marginTop:
                      4,
                    fontSize:
                      11,
                    opacity:
                      0.55,
                  }}
                >
                  {isArabic
                    ? 'المنتج النشط يمكن عرضه وبيعه في المتجر.'
                    : 'Active products can be displayed and sold.'}
                </span>
              </div>

              <input
                type="checkbox"
                checked={
                  form.isActive
                }
                onChange={
                  (event) =>
                    updateField(
                      'isActive',
                      event.target
                        .checked
                    )
                }
                style={{
                  width: 22,
                  height: 22,
                  accentColor:
                    '#10985f',
                }}
              />
            </label>
          </FormCard>
        )}

        {/* Actions */}

        <div
          style={{
            display: 'flex',
            gap: 10,
            marginTop: 3,
          }}
        >
          <button
            type="button"
            onClick={
              onCancel
            }
            disabled={
              saving
            }
            style={{
              flex: 1,
              minHeight: 48,
              borderRadius: 15,
              border:
                '1px solid rgba(0,0,0,.10)',
              background:
                'var(--card, #fff)',
              color: 'inherit',
              font: 'inherit',
              fontWeight: 800,
              cursor:
                saving
                  ? 'default'
                  : 'pointer',
            }}
          >
            {isArabic
              ? 'إلغاء'
              : 'Cancel'}
          </button>

          <button
            type="submit"
            disabled={
              saving
            }
            style={{
              flex: 2,
              minHeight: 48,
              borderRadius: 15,
              border: 0,
              background:
                '#10985f',
              color: '#fff',
              font: 'inherit',
              fontWeight: 900,
              cursor:
                saving
                  ? 'wait'
                  : 'pointer',
              opacity:
                saving
                  ? 0.7
                  : 1,
            }}
          >
            {saving
              ? (
                  isArabic
                    ? 'جاري الحفظ...'
                    : 'Saving...'
                )
              : isEdit
                ? (
                    isArabic
                      ? 'حفظ التعديلات'
                      : 'Save changes'
                  )
                : (
                    isArabic
                      ? 'إضافة المنتج'
                      : 'Create product'
                  )}
          </button>
        </div>
      </form>
    </main>
  );
}

/*
|--------------------------------------------------------------------------
| Form Card
|--------------------------------------------------------------------------
*/

function FormCard({
  title,
  children,
}) {
  return (
    <section
      style={{
        padding: 17,
        borderRadius: 20,
        background:
          'var(--card, #fff)',
        border:
          '1px solid rgba(0,0,0,.06)',
        boxShadow:
          '0 8px 24px rgba(0,0,0,.025)',
      }}
    >
      <h2
        style={{
          margin:
            '0 0 15px',
          fontSize: 16,
        }}
      >
        {title}
      </h2>

      <div
        style={{
          display: 'grid',
          gap: 14,
        }}
      >
        {children}
      </div>
    </section>
  );
}

/*
|--------------------------------------------------------------------------
| Field
|--------------------------------------------------------------------------
*/

function Field({
  label,
  required = false,
  error,
  children,
}) {
  return (
    <label
      style={{
        display: 'grid',
        gap: 7,
      }}
    >
      <span
        style={{
          fontSize: 12,
          fontWeight: 750,
        }}
      >
        {label}

        {required && (
          <span
            style={{
              color:
                '#dc2626',
              marginInlineStart:
                4,
            }}
          >
            *
          </span>
        )}
      </span>

      {children}

      {error && (
        <span
          style={{
            color:
              '#dc2626',
            fontSize: 11,
            lineHeight: 1.5,
          }}
        >
          {error}
        </span>
      )}
    </label>
  );
}

const inputStyle = {
  boxSizing: 'border-box',
  width: '100%',
  minHeight: 47,
  border:
    '1px solid rgba(0,0,0,.10)',
  borderRadius: 13,
  padding: '0 14px',
  background:
    'var(--card, #fff)',
  color: 'inherit',
  font: 'inherit',
  outline: 'none',
};
import React, { useState } from 'react';
import './AddressesPage.css';

const emptyForm = {
  name: '',
  phone: '',
  city: '',
  district: '',
  street: '',
  building: '',
  notes: '',
  is_default: false,
};

function LocationIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle
        cx="12"
        cy="9"
        r="2.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M7.2 3.8 9.6 7c.4.6.3 1.4-.2 1.9l-1.3 1.2a13.5 13.5 0 0 0 5.8 5.8l1.2-1.3c.5-.5 1.3-.6 1.9-.2l3.2 2.4c.6.4.8 1.2.4 1.9l-.7 1.2c-.5.9-1.5 1.4-2.5 1.2C9.8 19.9 4.1 14.2 2.9 6.6c-.2-1 .3-2 1.2-2.5l1.2-.7c.7-.4 1.5-.2 1.9.4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AddressesPage({
  lang,
  currentUser,
  addresses,
  addressesLoading,
  createAddress,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
  showToast,
  go,
}) {
  const isArabic =
    lang === 'ar';

  const [
    form,
    setForm,
  ] = useState(emptyForm);

  const [
    editingId,
    setEditingId,
  ] = useState(null);

  const [
    formOpen,
    setFormOpen,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

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
  }

  function openCreate() {
    setEditingId(null);

    setForm({
      ...emptyForm,
      name:
        currentUser?.name || '',
    });

    setFormOpen(true);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  function openEdit(address) {
    setEditingId(address.id);

    setForm({
      name:
        address.name || '',

      phone:
        address.phone || '',

      city:
        address.city || '',

      district:
        address.district || '',

      street:
        address.street || '',

      building:
        address.building || '',

      notes:
        address.notes || '',

      is_default:
        Boolean(
          address.is_default
        ),
    });

    setFormOpen(true);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function submit(event) {
    event.preventDefault();

    if (
      !form.name.trim() ||
      !form.phone.trim() ||
      !form.city.trim()
    ) {
      showToast(
        isArabic
          ? 'الاسم ورقم الهاتف والمدينة مطلوبة'
          : 'Name, phone and city are required'
      );

      return;
    }

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      city: form.city.trim(),

      district:
        form.district.trim() ||
        null,

      street:
        form.street.trim() ||
        null,

      building:
        form.building.trim() ||
        null,

      notes:
        form.notes.trim() ||
        null,

      is_default:
        Boolean(
          form.is_default
        ),
    };

    setSaving(true);

    try {
      let success;

      if (editingId) {
        success =
          await updateAddress(
            editingId,
            payload
          );
      } else {
        success =
          await createAddress(
            payload
          );
      }

      if (success) {
        closeForm();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(
    address
  ) {
    const confirmed =
      window.confirm(
        isArabic
          ? `هل تريد حذف عنوان ${address.name}؟`
          : `Delete ${address.name}'s address?`
      );

    if (!confirmed) {
      return;
    }

    await deleteAddress(
      address.id
    );
  }

  if (!currentUser) {
    return (
      <main
        className="addresses-page"
        dir={
          isArabic
            ? 'rtl'
            : 'ltr'
        }
      >
        <div className="addresses-empty">
          <h2>
            {isArabic
              ? 'عناويني'
              : 'My Addresses'}
          </h2>

          <p>
            {isArabic
              ? 'سجل الدخول لإدارة عناوينك.'
              : 'Sign in to manage your addresses.'}
          </p>

          <button
            className="addresses-primary-btn"
            onClick={() =>
              go('login')
            }
          >
            {isArabic
              ? 'تسجيل الدخول'
              : 'Sign in'}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      className="addresses-page"
      dir={
        isArabic
          ? 'rtl'
          : 'ltr'
      }
    >
      <header className="addresses-header">
        <div>
          <h1>
            {isArabic
              ? 'عناويني'
              : 'My Addresses'}
          </h1>

          <p>
            {addresses.length
              ? (
                  isArabic
                    ? `${addresses.length} عنوان محفوظ`
                    : `${addresses.length} saved ${
                        addresses.length === 1
                          ? 'address'
                          : 'addresses'
                      }`
                )
              : (
                  isArabic
                    ? 'أضف عنوانك لتسهيل الطلب'
                    : 'Add an address for faster checkout'
                )}
          </p>
        </div>

        <button
          type="button"
          className="addresses-add-btn"
          onClick={openCreate}
        >
          <span className="addresses-add-icon">
            +
          </span>

          <span>
            {isArabic
              ? 'عنوان جديد'
              : 'New address'}
          </span>
        </button>
      </header>

      {formOpen && (
        <form
          className="address-form-card"
          onSubmit={submit}
        >
          <div className="address-form-heading">
            <div>
              <h2>
                {editingId
                  ? (
                      isArabic
                        ? 'تعديل العنوان'
                        : 'Edit Address'
                    )
                  : (
                      isArabic
                        ? 'إضافة عنوان'
                        : 'Add Address'
                    )}
              </h2>

              <p>
                {isArabic
                  ? 'أدخل بيانات التوصيل'
                  : 'Enter your delivery details'}
              </p>
            </div>

            <button
              type="button"
              className="address-close-btn"
              onClick={closeForm}
            >
              ×
            </button>
          </div>

          <div className="address-form-grid">
            <label className="address-field">
              <span>
                {isArabic
                  ? 'اسم المستلم'
                  : 'Recipient name'}
              </span>

              <input
                type="text"
                value={form.name}
                onChange={
                  (event) =>
                    updateField(
                      'name',
                      event.target.value
                    )
                }
                placeholder={
                  isArabic
                    ? 'مثال: أحمد محمد'
                    : 'e.g. Ahmed Mohammed'
                }
              />
            </label>

            <label className="address-field">
              <span>
                {isArabic
                  ? 'رقم الهاتف'
                  : 'Phone number'}
              </span>

              <input
                type="tel"
                value={form.phone}
                onChange={
                  (event) =>
                    updateField(
                      'phone',
                      event.target.value
                    )
                }
                placeholder="05xxxxxxxx"
                dir="ltr"
              />
            </label>

            <label className="address-field">
              <span>
                {isArabic
                  ? 'المدينة'
                  : 'City'}
              </span>

              <input
                type="text"
                value={form.city}
                onChange={
                  (event) =>
                    updateField(
                      'city',
                      event.target.value
                    )
                }
              />
            </label>

            <label className="address-field">
              <span>
                {isArabic
                  ? 'الحي'
                  : 'District'}
              </span>

              <input
                type="text"
                value={form.district}
                onChange={
                  (event) =>
                    updateField(
                      'district',
                      event.target.value
                    )
                }
              />
            </label>

            <label className="address-field">
              <span>
                {isArabic
                  ? 'الشارع'
                  : 'Street'}
              </span>

              <input
                type="text"
                value={form.street}
                onChange={
                  (event) =>
                    updateField(
                      'street',
                      event.target.value
                    )
                }
              />
            </label>

            <label className="address-field">
              <span>
                {isArabic
                  ? 'رقم المبنى'
                  : 'Building'}
              </span>

              <input
                type="text"
                value={form.building}
                onChange={
                  (event) =>
                    updateField(
                      'building',
                      event.target.value
                    )
                }
              />
            </label>
          </div>

          <label className="address-field">
            <span>
              {isArabic
                ? 'ملاحظات'
                : 'Notes'}
            </span>

            <textarea
              rows="3"
              value={form.notes}
              onChange={
                (event) =>
                  updateField(
                    'notes',
                    event.target.value
                  )
              }
              placeholder={
                isArabic
                  ? 'مثال: الاتصال قبل الوصول'
                  : 'e.g. Call before delivery'
              }
            />
          </label>

          <label className="address-default-check">
            <input
              type="checkbox"
              checked={
                form.is_default
              }
              onChange={
                (event) =>
                  updateField(
                    'is_default',
                    event.target.checked
                  )
              }
            />

            <span>
              {isArabic
                ? 'اجعله العنوان الافتراضي'
                : 'Make this my default address'}
            </span>
          </label>

          <div className="address-form-actions">
            <button
              type="submit"
              className="addresses-primary-btn"
              disabled={saving}
            >
              {saving
                ? (
                    isArabic
                      ? 'جاري الحفظ...'
                      : 'Saving...'
                  )
                : (
                    isArabic
                      ? 'حفظ العنوان'
                      : 'Save Address'
                  )}
            </button>

            <button
              type="button"
              className="addresses-cancel-btn"
              onClick={closeForm}
            >
              {isArabic
                ? 'إلغاء'
                : 'Cancel'}
            </button>
          </div>
        </form>
      )}

      {addressesLoading ? (
        <div className="addresses-loading">
          {isArabic
            ? 'جاري تحميل العناوين...'
            : 'Loading addresses...'}
        </div>
      ) : (
        <div className="addresses-list">
          {addresses.map(
            (address) => (
              <article
                className={`address-card ${
                  address.is_default
                    ? 'address-card-default'
                    : ''
                }`}
                key={address.id}
              >
                <div className="address-card-top">
                  <div className="address-person">
                    <strong>
                      {address.name}
                    </strong>

                    {Boolean(
                      address.is_default
                    ) && (
                      <span className="address-default-badge">
                        {isArabic
                          ? 'افتراضي'
                          : 'Default'}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    className="address-edit-link"
                    onClick={() =>
                      openEdit(
                        address
                      )
                    }
                  >
                    {isArabic
                      ? 'تعديل'
                      : 'Edit'}
                  </button>
                </div>

                <div className="address-info-row">
                  <span className="address-info-icon">
                    <PhoneIcon />
                  </span>

                  <span
                    dir="ltr"
                    className="address-info-text"
                  >
                    {address.phone}
                  </span>
                </div>

                <div className="address-info-row address-location-row">
                  <span className="address-info-icon">
                    <LocationIcon />
                  </span>

                  <div className="address-info-text">
                    <strong>
                      {[
                        address.city,
                        address.district,
                      ]
                        .filter(Boolean)
                        .join(
                          isArabic
                            ? '، '
                            : ', '
                        )}
                    </strong>

                    {(address.street ||
                      address.building) && (
                      <span>
                        {[
                          address.street,

                          address.building
                            ? (
                                isArabic
                                  ? `مبنى ${address.building}`
                                  : `Building ${address.building}`
                              )
                            : null,
                        ]
                          .filter(Boolean)
                          .join(
                            isArabic
                              ? '، '
                              : ', '
                          )}
                      </span>
                    )}
                  </div>
                </div>

                {address.notes && (
                  <div className="address-note">
                    {address.notes}
                  </div>
                )}

                <div className="address-card-actions">
                  {!Boolean(
                    address.is_default
                  ) && (
                    <button
                      type="button"
                      className="address-default-btn"
                      onClick={() =>
                        setDefaultAddress(
                          address.id
                        )
                      }
                    >
                      {isArabic
                        ? 'تعيين كافتراضي'
                        : 'Set as default'}
                    </button>
                  )}

                  <button
                    type="button"
                    className="address-delete-btn"
                    onClick={() =>
                      handleDelete(
                        address
                      )
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

          {!addresses.length && (
            <div className="addresses-empty">
              <div className="addresses-empty-icon">
                <LocationIcon />
              </div>

              <h3>
                {isArabic
                  ? 'لا توجد عناوين محفوظة'
                  : 'No saved addresses'}
              </h3>

              <p>
                {isArabic
                  ? 'أضف عنوانك الأول لتسهيل عملية الشراء.'
                  : 'Add your first address for an easier checkout.'}
              </p>

              <button
                type="button"
                className="addresses-primary-btn"
                onClick={openCreate}
              >
                {isArabic
                  ? 'إضافة عنوان'
                  : 'Add Address'}
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
import React, { useEffect, useState } from 'react';

export default function SellerProfilePage({
  lang = 'ar',
  api,
  showToast,
  onBack,
}) {
  const isArabic = lang === 'ar';
  const [seller, setSeller] = useState(null);
  const [form, setForm] = useState({
    nameAr: '',
    nameEn: '',
    phone: '',
    email: '',
    logo: '',
    descriptionAr: '',
    descriptionEn: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    setError('');

    try {
      const response = await api.getSellerProfile();
      const data = response?.data || response || null;

      setSeller(data);
      setForm({
        nameAr: data?.name_ar || '',
        nameEn: data?.name_en || '',
        phone: data?.phone || '',
        email: data?.email || '',
        logo: data?.logo || '',
        descriptionAr: data?.description_ar || '',
        descriptionEn: data?.description_en || '',
      });
    } catch (err) {
      console.error('Seller profile error:', err);
      const message = isArabic
        ? 'تعذر تحميل ملف البائع'
        : 'Could not load seller profile';
      setError(message);
      showToast?.(message);
    } finally {
      setLoading(false);
    }
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));

    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: '' }));
    }
  }

  function validate() {
    const next = {};

    if (!form.nameAr.trim()) {
      next.nameAr = isArabic
        ? 'اسم المتجر بالعربية مطلوب'
        : 'Arabic store name is required';
    }

    if (!form.nameEn.trim()) {
      next.nameEn = isArabic
        ? 'اسم المتجر بالإنجليزية مطلوب'
        : 'English store name is required';
    }

    if (form.nameAr.length > 255) {
      next.nameAr = isArabic ? 'الاسم طويل جداً' : 'Name is too long';
    }

    if (form.nameEn.length > 255) {
      next.nameEn = isArabic ? 'الاسم طويل جداً' : 'Name is too long';
    }

    if (form.phone.length > 50) {
      next.phone = isArabic
        ? 'رقم الجوال طويل جداً'
        : 'Phone number is too long';
    }

    if (
      form.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    ) {
      next.email = isArabic
        ? 'البريد الإلكتروني غير صحيح'
        : 'Invalid email address';
    }

    if (form.logo.length > 2048) {
      next.logo = isArabic
        ? 'رابط الشعار طويل جداً'
        : 'Logo URL is too long';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function mapBackendErrors(backendErrors) {
    if (!backendErrors || typeof backendErrors !== 'object') {
      return {};
    }

    const mapping = {
      name_ar: 'nameAr',
      name_en: 'nameEn',
      phone: 'phone',
      email: 'email',
      logo: 'logo',
      description_ar: 'descriptionAr',
      description_en: 'descriptionEn',
    };

    const result = {};

    Object.entries(backendErrors).forEach(([field, messages]) => {
      const mapped = mapping[field];
      if (!mapped) return;

      result[mapped] = Array.isArray(messages)
        ? messages[0]
        : String(messages);
    });

    return result;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!validate()) return;

    setSaving(true);
    setErrors({});

    const payload = {
      name_ar: form.nameAr.trim(),
      name_en: form.nameEn.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      logo: form.logo.trim() || null,
      description_ar: form.descriptionAr.trim() || null,
      description_en: form.descriptionEn.trim() || null,
    };

    try {
      const response = await api.updateSellerProfile(payload);
      const data = response?.data || response || null;

      setSeller(data);

      if (data) {
        setForm({
          nameAr: data.name_ar || '',
          nameEn: data.name_en || '',
          phone: data.phone || '',
          email: data.email || '',
          logo: data.logo || '',
          descriptionAr: data.description_ar || '',
          descriptionEn: data.description_en || '',
        });
      }

      showToast?.(
        isArabic
          ? 'تم تحديث ملف البائع بنجاح'
          : 'Seller profile updated successfully'
      );
    } catch (err) {
      console.error('Seller profile update error:', err);
      const backendErrors = mapBackendErrors(err?.errors);

      if (Object.keys(backendErrors).length) {
        setErrors(backendErrors);
      }

      showToast?.(
        err?.message ||
          (isArabic
            ? 'تعذر تحديث ملف البائع'
            : 'Could not update seller profile')
      );
    } finally {
      setSaving(false);
    }
  }

  function statusLabel(status) {
    const labels = {
      approved: { ar: 'معتمد', en: 'Approved' },
      pending: { ar: 'قيد المراجعة', en: 'Pending' },
      rejected: { ar: 'مرفوض', en: 'Rejected' },
    };

    return labels?.[status]?.[isArabic ? 'ar' : 'en'] || status || '-';
  }

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
        {isArabic ? 'جاري تحميل ملف البائع...' : 'Loading seller profile...'}
      </main>
    );
  }

  if (error || !seller) {
    return (
      <main
        dir={isArabic ? 'rtl' : 'ltr'}
        style={{ maxWidth: 720, margin: '0 auto', padding: '30px 16px 170px' }}
      >
        <button type="button" onClick={onBack} style={backButtonStyle}>
          {isArabic ? 'رجوع' : 'Back'}
        </button>

        <div
          style={{
            marginTop: 18,
            padding: 20,
            borderRadius: 18,
            textAlign: 'center',
            background: 'rgba(220,38,38,.06)',
            color: '#dc2626',
          }}
        >
          {error || (isArabic ? 'ملف البائع غير موجود' : 'Seller profile not found')}
        </div>
      </main>
    );
  }

  return (
    <main
      dir={isArabic ? 'rtl' : 'ltr'}
      style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px 170px' }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
          marginBottom: 18,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 24 }}>
            {isArabic ? 'ملف البائع' : 'Seller Profile'}
          </h1>
          <div style={{ marginTop: 5, fontSize: 12, opacity: 0.55 }}>
            {isArabic ? 'إدارة بيانات متجرك' : 'Manage your store information'}
          </div>
        </div>

        <button type="button" onClick={onBack} style={backButtonStyle}>
          {isArabic ? 'رجوع' : 'Back'}
        </button>
      </div>

      <section
        style={{
          padding: 17,
          borderRadius: 20,
          background: 'var(--card, #fff)',
          border: '1px solid rgba(0,0,0,.06)',
          marginBottom: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 70,
              height: 70,
              borderRadius: 18,
              overflow: 'hidden',
              display: 'grid',
              placeItems: 'center',
              background: 'rgba(16,152,95,.08)',
              flexShrink: 0,
            }}
          >
            {form.logo ? (
              <img
                src={form.logo}
                alt=""
                onError={(event) => {
                  event.currentTarget.style.display = 'none';
                }}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{ fontSize: 30 }}>🏪</span>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <strong style={{ display: 'block', fontSize: 17 }}>
              {isArabic ? seller.name_ar : seller.name_en}
            </strong>
            <div style={{ marginTop: 4, fontSize: 11, opacity: 0.55 }}>
              {seller.slug}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 10 }}>
              <Badge>{statusLabel(seller.status)}</Badge>
              <Badge>
                {isArabic
                  ? `عمولة المنصة ${Number(seller.commission_percentage || 0).toFixed(2)}%`
                  : `Platform commission ${Number(seller.commission_percentage || 0).toFixed(2)}%`}
              </Badge>
              <Badge>
                {seller.is_active
                  ? isArabic
                    ? 'نشط'
                    : 'Active'
                  : isArabic
                    ? 'غير نشط'
                    : 'Inactive'}
              </Badge>
            </div>
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
        <FormCard title={isArabic ? 'اسم المتجر' : 'Store Name'}>
          <Field
            label={isArabic ? 'اسم المتجر بالعربية' : 'Arabic store name'}
            required
            error={errors.nameAr}
          >
            <input
              value={form.nameAr}
              onChange={(event) => updateField('nameAr', event.target.value)}
              maxLength={255}
              style={inputStyle}
            />
          </Field>

          <Field
            label={isArabic ? 'اسم المتجر بالإنجليزية' : 'English store name'}
            required
            error={errors.nameEn}
          >
            <input
              value={form.nameEn}
              onChange={(event) => updateField('nameEn', event.target.value)}
              maxLength={255}
              style={inputStyle}
            />
          </Field>
        </FormCard>

        <FormCard title={isArabic ? 'بيانات التواصل' : 'Contact Information'}>
          <Field label={isArabic ? 'رقم الجوال' : 'Phone'} error={errors.phone}>
            <input
              type="tel"
              value={form.phone}
              onChange={(event) => updateField('phone', event.target.value)}
              maxLength={50}
              style={inputStyle}
            />
          </Field>

          <Field label={isArabic ? 'البريد الإلكتروني' : 'Email'} error={errors.email}>
            <input
              type="email"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              maxLength={255}
              style={inputStyle}
            />
          </Field>
        </FormCard>

        <FormCard title={isArabic ? 'وصف المتجر' : 'Store Description'}>
          <Field label={isArabic ? 'الوصف بالعربية' : 'Arabic description'} error={errors.descriptionAr}>
            <textarea
              value={form.descriptionAr}
              onChange={(event) => updateField('descriptionAr', event.target.value)}
              rows={4}
              style={{ ...inputStyle, minHeight: 105, padding: '12px 14px', resize: 'vertical' }}
            />
          </Field>

          <Field label={isArabic ? 'الوصف بالإنجليزية' : 'English description'} error={errors.descriptionEn}>
            <textarea
              value={form.descriptionEn}
              onChange={(event) => updateField('descriptionEn', event.target.value)}
              rows={4}
              style={{ ...inputStyle, minHeight: 105, padding: '12px 14px', resize: 'vertical' }}
            />
          </Field>
        </FormCard>

        <FormCard title={isArabic ? 'شعار المتجر' : 'Store Logo'}>
          <Field label={isArabic ? 'رابط الشعار' : 'Logo URL'} error={errors.logo}>
            <input
              value={form.logo}
              onChange={(event) => updateField('logo', event.target.value)}
              maxLength={2048}
              placeholder="https://..."
              style={inputStyle}
            />
          </Field>
        </FormCard>

        <FormCard title={isArabic ? 'معلومات الحساب' : 'Account Information'}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 10,
            }}
          >
            <InfoBox label={isArabic ? 'الحالة' : 'Status'} value={statusLabel(seller.status)} />
            <InfoBox
              label={isArabic ? 'عمولة المنصة' : 'Commission'}
              value={`${Number(seller.commission_percentage || 0).toFixed(2)}%`}
            />
            <InfoBox label={isArabic ? 'معرف البائع' : 'Seller ID'} value={seller.id} />
            <InfoBox label={isArabic ? 'الرابط' : 'Slug'} value={seller.slug} />
          </div>

          <div style={{ marginTop: 10, fontSize: 10, opacity: 0.5, lineHeight: 1.6 }}>
            {isArabic
              ? 'الحالة والعمولة والرابط يتم التحكم بها من إدارة النظام ولا يمكن للبائع تعديلها.'
              : 'Status, commission and slug are managed by the administrator and cannot be edited by the seller.'}
          </div>
        </FormCard>

        <button
          type="submit"
          disabled={saving}
          style={{
            minHeight: 50,
            border: 0,
            borderRadius: 15,
            background: '#10985f',
            color: '#fff',
            font: 'inherit',
            fontWeight: 900,
            cursor: saving ? 'wait' : 'pointer',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving
            ? isArabic
              ? 'جاري الحفظ...'
              : 'Saving...'
            : isArabic
              ? 'حفظ التغييرات'
              : 'Save changes'}
        </button>
      </form>
    </main>
  );
}

function FormCard({ title, children }) {
  return (
    <section
      style={{
        padding: 17,
        borderRadius: 20,
        background: 'var(--card, #fff)',
        border: '1px solid rgba(0,0,0,.06)',
        boxShadow: '0 8px 24px rgba(0,0,0,.025)',
      }}
    >
      <h2 style={{ margin: '0 0 15px', fontSize: 16 }}>{title}</h2>
      <div style={{ display: 'grid', gap: 14 }}>{children}</div>
    </section>
  );
}

function Field({ label, required = false, error, children }) {
  return (
    <label style={{ display: 'grid', gap: 7 }}>
      <span style={{ fontSize: 12, fontWeight: 750 }}>
        {label}
        {required && (
          <span style={{ color: '#dc2626', marginInlineStart: 4 }}>*</span>
        )}
      </span>
      {children}
      {error && (
        <span style={{ color: '#dc2626', fontSize: 11, lineHeight: 1.5 }}>
          {error}
        </span>
      )}
    </label>
  );
}

function Badge({ children }) {
  return (
    <span
      style={{
        padding: '5px 8px',
        borderRadius: 999,
        background: 'rgba(16,152,95,.07)',
        color: '#10985f',
        fontSize: 10,
        fontWeight: 800,
      }}
    >
      {children}
    </span>
  );
}

function InfoBox({ label, value }) {
  return (
    <div style={{ padding: 11, borderRadius: 13, background: 'rgba(0,0,0,.025)' }}>
      <span style={{ display: 'block', fontSize: 9, opacity: 0.5 }}>{label}</span>
      <strong
        style={{
          display: 'block',
          marginTop: 4,
          fontSize: 11,
          wordBreak: 'break-word',
        }}
      >
        {value ?? '-'}
      </strong>
    </div>
  );
}

const inputStyle = {
  boxSizing: 'border-box',
  width: '100%',
  minHeight: 47,
  border: '1px solid rgba(0,0,0,.10)',
  borderRadius: 13,
  padding: '0 14px',
  background: 'var(--card, #fff)',
  color: 'inherit',
  font: 'inherit',
  outline: 'none',
};

const backButtonStyle = {
  minHeight: 40,
  borderRadius: 13,
  padding: '0 14px',
  border: '1px solid rgba(0,0,0,.10)',
  background: 'var(--card, #fff)',
  color: 'inherit',
  font: 'inherit',
  fontWeight: 800,
  cursor: 'pointer',
};

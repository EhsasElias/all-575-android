import React, { useEffect, useMemo, useState } from 'react';

export default function SellerOrderDetailsPage({
  orderId,
  lang = 'ar',
  api,
  showToast,
  onBack,
}) {
  const isArabic = lang === 'ar';
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (orderId) loadOrder();
  }, [orderId]);

  async function loadOrder() {
    setLoading(true);
    setError('');

    try {
      const response = await api.getSellerOrder(orderId);
      setOrder(response?.data || response || null);
    } catch (err) {
      console.error('Seller order details error:', err);
      const message = isArabic
        ? 'تعذر تحميل تفاصيل الطلب'
        : 'Could not load order details';
      setError(message);
      showToast?.(message);
    } finally {
      setLoading(false);
    }
  }

  function money(value, currency = 'SAR') {
    const amount = Number(value || 0);
    return isArabic
      ? `${amount.toFixed(2).replace('.', ',')} ر.س`
      : `${amount.toFixed(2)} ${currency}`;
  }

  function formatDate(value) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString(isArabic ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function statusLabel(status) {
    const labels = {
      pending: { ar: 'قيد الانتظار', en: 'Pending' },
      confirmed: { ar: 'تم التأكيد', en: 'Confirmed' },
      preparing: { ar: 'قيد التجهيز', en: 'Preparing' },
      out_for_delivery: { ar: 'خرج للتوصيل', en: 'Out for delivery' },
      delivered: { ar: 'تم التوصيل', en: 'Delivered' },
      cancelled: { ar: 'ملغي', en: 'Cancelled' },
    };

    return labels?.[status]?.[isArabic ? 'ar' : 'en'] || status || '-';
  }

  function statusStyle(status) {
    if (status === 'delivered') {
      return { background: 'rgba(16,152,95,.10)', color: '#10985f' };
    }

    if (status === 'cancelled') {
      return { background: 'rgba(220,38,38,.08)', color: '#dc2626' };
    }

    if (['confirmed', 'preparing', 'out_for_delivery'].includes(status)) {
      return { background: 'rgba(37,99,235,.08)', color: '#2563eb' };
    }

    return { background: 'rgba(245,158,11,.10)', color: '#b7791f' };
  }

  function paymentMethodLabel(method) {
    if (method === 'cash_on_delivery') {
      return isArabic ? 'الدفع عند الاستلام' : 'Cash on delivery';
    }
    return method || '-';
  }

  function paymentStatusLabel(status) {
    const labels = {
      pending: { ar: 'بانتظار الدفع', en: 'Pending payment' },
      paid: { ar: 'مدفوع', en: 'Paid' },
      failed: { ar: 'فشل الدفع', en: 'Payment failed' },
      refunded: { ar: 'مسترجع', en: 'Refunded' },
    };

    return labels?.[status]?.[isArabic ? 'ar' : 'en'] || status || '-';
  }

  function historyNote(item) {
    const note = item?.note || '';
    if (!isArabic) return note || '-';

    const map = {
      'Order created.': 'تم إنشاء الطلب.',
      'Cancelled by customer.': 'تم إلغاء الطلب بواسطة العميل.',
    };

    return map[note] || note || '-';
  }

  const items = useMemo(
    () => (Array.isArray(order?.items) ? order.items : []),
    [order]
  );

  const statusHistory = useMemo(
    () =>
      Array.isArray(order?.status_history)
        ? order.status_history
        : [],
    [order]
  );

  const commission = useMemo(
    () =>
      items.reduce(
        (total, item) =>
          total +
          (Number(item.line_total || 0) - Number(item.seller_amount || 0)),
        0
      ),
    [items]
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
          ? 'جاري تحميل تفاصيل الطلب...'
          : 'Loading order details...'}
      </main>
    );
  }

  if (error || !order) {
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
          {error || (isArabic ? 'الطلب غير موجود' : 'Order not found')}
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
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 18,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 24 }}>
            {isArabic ? 'تفاصيل الطلب' : 'Order Details'}
          </h1>
          <div style={{ marginTop: 5, fontSize: 12, opacity: 0.55 }}>
            {order.order_number}
          </div>
        </div>

        <button type="button" onClick={onBack} style={backButtonStyle}>
          {isArabic ? 'رجوع' : 'Back'}
        </button>
      </div>

      <Card>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div>
            <Label>{isArabic ? 'حالة الطلب' : 'Order status'}</Label>
            <strong style={{ display: 'block', marginTop: 5, fontSize: 16 }}>
              {statusLabel(order.status)}
            </strong>
          </div>

          <span
            style={{
              ...statusStyle(order.status),
              padding: '7px 10px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            {statusLabel(order.status)}
          </span>
        </div>

        <div
          style={{
            marginTop: 14,
            paddingTop: 13,
            borderTop: '1px solid rgba(0,0,0,.055)',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 10,
          }}
        >
          <Info
            label={isArabic ? 'تاريخ الطلب' : 'Order date'}
            value={formatDate(order.created_at)}
          />
          <Info
            label={isArabic ? 'آخر تحديث' : 'Last updated'}
            value={formatDate(order.updated_at)}
          />
        </div>
      </Card>

      <Card title={isArabic ? 'بيانات العميل' : 'Customer'}>
        <Grid>
          <Info label={isArabic ? 'الاسم' : 'Name'} value={order.customer_name} />
          <Info label={isArabic ? 'رقم الجوال' : 'Phone'} value={order.customer_phone} />
        </Grid>
      </Card>

      <Card title={isArabic ? 'عنوان التوصيل' : 'Delivery Address'}>
        <Grid>
          <Info label={isArabic ? 'المدينة' : 'City'} value={order.city} />
          <Info label={isArabic ? 'الحي' : 'District'} value={order.district} />
          <Info label={isArabic ? 'الشارع' : 'Street'} value={order.street} />
          <Info label={isArabic ? 'المبنى' : 'Building'} value={order.building} />
        </Grid>

        {order.address_notes && (
          <NoteBox
            label={isArabic ? 'ملاحظات العنوان' : 'Address notes'}
            value={order.address_notes}
          />
        )}
      </Card>

      <Card title={isArabic ? 'الدفع' : 'Payment'}>
        <Grid>
          <Info
            label={isArabic ? 'طريقة الدفع' : 'Payment method'}
            value={paymentMethodLabel(order.payment_method)}
          />
          <Info
            label={isArabic ? 'حالة الدفع' : 'Payment status'}
            value={paymentStatusLabel(order.payment_status)}
          />
        </Grid>
      </Card>

      <Card title={isArabic ? 'منتجاتك في الطلب' : 'Your Items'}>
        <div style={{ display: 'grid', gap: 10 }}>
          {items.map((item) => (
            <article
              key={item.id}
              style={{
                padding: 13,
                borderRadius: 15,
                background: 'rgba(0,0,0,.025)',
                border: '1px solid rgba(0,0,0,.045)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <strong style={{ display: 'block', fontSize: 13, lineHeight: 1.5 }}>
                    {isArabic
                      ? item.product_name_ar || item.product_name_en
                      : item.product_name_en || item.product_name_ar}
                  </strong>
                  <div style={{ marginTop: 4, fontSize: 10, opacity: 0.5 }}>
                    SKU: {item.sku || '-'}
                  </div>
                </div>

                <strong style={{ color: '#10985f', fontSize: 13 }}>
                  {money(item.line_total, order.currency)}
                </strong>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  gap: 8,
                  marginTop: 12,
                }}
              >
                <MiniInfo
                  label={isArabic ? 'الكمية' : 'Qty'}
                  value={item.quantity}
                />
                <MiniInfo
                  label={isArabic ? 'السعر' : 'Unit price'}
                  value={money(item.unit_price, order.currency)}
                />
                <MiniInfo
                  label={isArabic ? 'عمولة المنصة' : 'Commission'}
                  value={`${Number(item.seller_commission_percentage || 0).toFixed(2)}%`}
                />
              </div>

              <div
                style={{
                  marginTop: 10,
                  padding: 10,
                  borderRadius: 12,
                  background: 'rgba(16,152,95,.06)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 10, opacity: 0.65 }}>
                  {isArabic ? 'مبلغك من هذا المنتج' : 'Your amount'}
                </span>
                <strong style={{ color: '#10985f', fontSize: 13 }}>
                  {money(item.seller_amount, order.currency)}
                </strong>
              </div>
            </article>
          ))}
        </div>
      </Card>

      <Card title={isArabic ? 'الملخص المالي' : 'Financial Summary'}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 10,
          }}
        >
          <MoneyBox
            label={isArabic ? 'قيمة منتجاتك' : 'Your subtotal'}
            value={money(order.seller_subtotal, order.currency)}
          />
          <MoneyBox
            label={isArabic ? 'عمولة المنصة' : 'Platform commission'}
            value={money(commission, order.currency)}
          />
          <MoneyBox
            label={isArabic ? 'مبلغ البائع' : 'Seller earnings'}
            value={money(order.seller_earnings, order.currency)}
            strong
            spanTwo
          />
        </div>
      </Card>

      {order.customer_notes && (
        <Card title={isArabic ? 'ملاحظات العميل' : 'Customer Notes'}>
          <NoteBox value={order.customer_notes} />
        </Card>
      )}

      <Card title={isArabic ? 'سجل حالة الطلب' : 'Order Status History'}>
        {statusHistory.length > 0 ? (
          <div style={{ display: 'grid', gap: 10 }}>
            {statusHistory.map((history, index) => (
              <div
                key={history.id || index}
                style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}
              >
                <div
                  style={{
                    width: 11,
                    height: 11,
                    borderRadius: 999,
                    background:
                      index === statusHistory.length - 1
                        ? '#10985f'
                        : 'rgba(0,0,0,.18)',
                    marginTop: 5,
                    flexShrink: 0,
                  }}
                />

                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    paddingBottom:
                      index === statusHistory.length - 1 ? 0 : 12,
                    borderBottom:
                      index === statusHistory.length - 1
                        ? 'none'
                        : '1px solid rgba(0,0,0,.05)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 10,
                    }}
                  >
                    <strong style={{ fontSize: 12 }}>
                      {statusLabel(history.to_status)}
                    </strong>
                    <span style={{ fontSize: 9, opacity: 0.45 }}>
                      {formatDate(history.created_at)}
                    </span>
                  </div>

                  <p
                    style={{
                      margin: '5px 0 0',
                      fontSize: 11,
                      opacity: 0.65,
                      lineHeight: 1.6,
                    }}
                  >
                    {historyNote(history)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 12, opacity: 0.55 }}>
            {isArabic ? 'لا يوجد سجل للحالة' : 'No status history'}
          </div>
        )}
      </Card>
    </main>
  );
}

function Card({ title, children }) {
  return (
    <section
      style={{
        padding: 16,
        borderRadius: 20,
        background: 'var(--card, #fff)',
        border: '1px solid rgba(0,0,0,.06)',
        boxShadow: '0 8px 24px rgba(0,0,0,.03)',
        marginBottom: 13,
      }}
    >
      {title && <h2 style={{ margin: '0 0 14px', fontSize: 15 }}>{title}</h2>}
      {children}
    </section>
  );
}

function Grid({ children }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: 10,
      }}
    >
      {children}
    </div>
  );
}

function Label({ children }) {
  return (
    <span style={{ display: 'block', fontSize: 10, opacity: 0.5 }}>
      {children}
    </span>
  );
}

function Info({ label, value }) {
  return (
    <div
      style={{
        padding: 11,
        borderRadius: 13,
        background: 'rgba(0,0,0,.025)',
      }}
    >
      <Label>{label}</Label>
      <strong
        style={{
          display: 'block',
          marginTop: 4,
          fontSize: 11,
          lineHeight: 1.5,
          wordBreak: 'break-word',
        }}
      >
        {value || '-'}
      </strong>
    </div>
  );
}

function MiniInfo({ label, value }) {
  return (
    <div
      style={{
        padding: 9,
        borderRadius: 11,
        background: 'rgba(255,255,255,.65)',
        textAlign: 'center',
      }}
    >
      <span style={{ display: 'block', fontSize: 8, opacity: 0.5 }}>
        {label}
      </span>
      <strong style={{ display: 'block', marginTop: 4, fontSize: 10 }}>
        {value}
      </strong>
    </div>
  );
}

function NoteBox({ label, value }) {
  return (
    <div
      style={{
        marginTop: label ? 12 : 0,
        padding: 12,
        borderRadius: 13,
        background: 'rgba(245,158,11,.06)',
        border: '1px solid rgba(245,158,11,.10)',
      }}
    >
      {label && <Label>{label}</Label>}
      <div
        style={{
          marginTop: label ? 5 : 0,
          fontSize: 11,
          lineHeight: 1.7,
        }}
      >
        {value || '-'}
      </div>
    </div>
  );
}

function MoneyBox({ label, value, strong = false, spanTwo = false }) {
  return (
    <div
      style={{
        gridColumn: spanTwo ? '1 / -1' : 'auto',
        padding: 12,
        borderRadius: 14,
        background: strong
          ? 'rgba(16,152,95,.07)'
          : 'rgba(0,0,0,.025)',
        border: strong
          ? '1px solid rgba(16,152,95,.13)'
          : '1px solid transparent',
      }}
    >
      <Label>{label}</Label>
      <strong
        style={{
          display: 'block',
          marginTop: 5,
          fontSize: strong ? 16 : 13,
          color: strong ? '#10985f' : 'inherit',
        }}
      >
        {value}
      </strong>
    </div>
  );
}

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

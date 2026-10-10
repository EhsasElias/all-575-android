import React, { useEffect, useState } from 'react';

export default function OrderDetailsPage({
  orderId,
  api,
  lang,
  showToast,
  go,
  reloadOrders,
}) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const isArabic = lang === 'ar';

  /*
  |--------------------------------------------------------------------------
  | Cancel modal UX
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    if (!cancelModalOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    function handleKeyDown(event) {
      if (
        event.key === 'Escape' &&
        !cancelling
      ) {
        setCancelModalOpen(false);
      }
    }

    document.addEventListener(
      'keydown',
      handleKeyDown
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      document.removeEventListener(
        'keydown',
        handleKeyDown
      );
    };
  }, [
    cancelModalOpen,
    cancelling,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Load order
  |--------------------------------------------------------------------------
  */
  useEffect(() => {
    loadOrder();
  }, [orderId]);

  async function loadOrder() {
    if (!orderId) {
      return;
    }

    setLoading(true);

    try {
      const response =
        await api.getOrder(orderId);

      setOrder(
        response?.data ||
        response ||
        null
      );
    } catch (error) {
      console.error(
        'Order details error:',
        error
      );

      showToast(
        isArabic
          ? 'تعذر تحميل تفاصيل الطلب'
          : 'Could not load order details'
      );

      go('orders');
    } finally {
      setLoading(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Cancel order
  |--------------------------------------------------------------------------
  */
  async function confirmCancelOrder() {
    if (!order) {
      return;
    }

    setCancelling(true);

    try {
      await api.cancelOrder(
        order.id
      );

      setCancelModalOpen(false);

      showToast(
        isArabic
          ? 'تم إلغاء الطلب بنجاح'
          : 'Order cancelled successfully'
      );

      await loadOrder();

      if (reloadOrders) {
        await reloadOrders();
      }
    } catch (error) {
      console.error(
        'Cancel order error:',
        error
      );

      showToast(
        error?.message ||
        (
          isArabic
            ? 'تعذر إلغاء الطلب'
            : 'Could not cancel order'
        )
      );
    } finally {
      setCancelling(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Helpers
  |--------------------------------------------------------------------------
  */
  function money(value) {
    const amount =
      Number(value || 0);

    return isArabic
      ? `${amount
          .toFixed(2)
          .replace('.', ',')} ر.س`
      : `${amount.toFixed(2)} SAR`;
  }

  function statusLabel(status) {
    const labels = {
      pending: {
        ar: 'قيد الانتظار',
        en: 'Pending',
      },

      confirmed: {
        ar: 'تم التأكيد',
        en: 'Confirmed',
      },

      preparing: {
        ar: 'جاري التجهيز',
        en: 'Preparing',
      },

      out_for_delivery: {
        ar: 'خرج للتوصيل',
        en: 'Out for delivery',
      },

      delivered: {
        ar: 'تم التسليم',
        en: 'Delivered',
      },

      cancelled: {
        ar: 'ملغي',
        en: 'Cancelled',
      },
    };

    return (
      labels[status]?.[
        isArabic
          ? 'ar'
          : 'en'
      ] ||
      status
    );
  }

  function formatDate(value) {
    if (!value) {
      return '-';
    }

    return new Date(
      value
    ).toLocaleString(
      isArabic
        ? 'ar-SA'
        : 'en-US'
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */
  if (loading) {
    return (
      <div
        style={{
          padding: 30,
          textAlign: 'center',
        }}
      >
        {isArabic
          ? 'جاري تحميل الطلب...'
          : 'Loading order...'}
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const items =
    Array.isArray(
      order.items
    )
      ? order.items
      : [];

  const history =
    Array.isArray(
      order.status_history
    )
      ? order.status_history
      : [];

  /*
  |--------------------------------------------------------------------------
  | Customer cancellation
  |--------------------------------------------------------------------------
  |
  | For now the cancel button is shown only while the order is pending.
  | Laravel remains the final authority for whether cancellation is allowed.
  |
  */

  const canCancel =
    order.status ===
    'pending';

  return (
    <main
      style={{
        maxWidth: 620,
        margin: '0 auto',
        padding:
          '22px 16px 140px',
      }}
      dir={
        isArabic
          ? 'rtl'
          : 'ltr'
      }
    >
      {/* Header */}

      <div
        style={{
          display: 'flex',
          alignItems:
            'center',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <button
          type="button"
          onClick={() =>
            go('orders')
          }
          style={{
            width: 42,
            height: 42,
            borderRadius: 13,

            border:
              '1px solid rgba(0,0,0,.1)',

            background:
              'transparent',

            color:
              'inherit',

            cursor:
              'pointer',
          }}
        >
          {isArabic
            ? '→'
            : '←'}
        </button>

        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 24,
            }}
          >
            {isArabic
              ? 'تفاصيل الطلب'
              : 'Order Details'}
          </h1>

          <div
            dir="ltr"
            style={{
              marginTop: 4,
              fontSize: 12,
              opacity: 0.6,
            }}
          >
            {
              order.order_number
            }
          </div>
        </div>
      </div>

      {/* Main information */}

      <section
        className="order-card"
        style={{
          display: 'grid',
          gap: 14,
          padding: 18,
          marginBottom: 14,
        }}
      >
        <InfoRow
          label={
            isArabic
              ? 'رقم الطلب'
              : 'Order number'
          }
          value={
            order.order_number
          }
        />

        <InfoRow
          label={
            isArabic
              ? 'الحالة'
              : 'Status'
          }
          value={
            statusLabel(
              order.status
            )
          }
        />

        <InfoRow
          label={
            isArabic
              ? 'تاريخ الطلب'
              : 'Order date'
          }
          value={
            formatDate(
              order.created_at
            )
          }
        />

        <InfoRow
          label={
            isArabic
              ? 'طريقة الدفع'
              : 'Payment'
          }
          value={
            order.payment_method ===
            'cash_on_delivery'
              ? (
                isArabic
                  ? 'الدفع عند الاستلام'
                  : 'Cash on delivery'
              )
              : order.payment_method
          }
        />
      </section>

      {/* Address */}

      <section
        className="order-card"
        style={{
          padding: 18,
          marginBottom: 14,
        }}
      >
        <h3
          style={{
            margin:
              '0 0 14px',
          }}
        >
          {isArabic
            ? 'عنوان التوصيل'
            : 'Delivery Address'}
        </h3>

        <strong>
          {
            order.customer_name
          }
        </strong>

        <div
          dir="ltr"
          style={{
            marginTop: 6,
          }}
        >
          {
            order.customer_phone
          }
        </div>

        <div
          style={{
            marginTop: 12,
            lineHeight: 1.8,
          }}
        >
          {[
            order.city,

            order.district,

            order.street,

            order.building
              ? (
                isArabic
                  ? `مبنى ${order.building}`
                  : `Building ${order.building}`
              )
              : null,
          ]
            .filter(Boolean)
            .join(
              isArabic
                ? '، '
                : ', '
            )}
        </div>

        {order.address_notes && (
          <div
            style={{
              marginTop: 10,
              opacity: 0.65,
            }}
          >
            {
              order.address_notes
            }
          </div>
        )}
      </section>

      {/* Products */}

      <section
        className="order-card"
        style={{
          padding: 18,
          marginBottom: 14,
        }}
      >
        <h3
          style={{
            margin:
              '0 0 16px',
          }}
        >
          {isArabic
            ? 'المنتجات'
            : 'Products'}
        </h3>

        {items.map(
          (item) => (
            <div
              key={
                item.id
              }
              style={{
                display:
                  'flex',

                justifyContent:
                  'space-between',

                gap: 14,

                padding:
                  '12px 0',

                borderBottom:
                  '1px solid rgba(0,0,0,.06)',
              }}
            >
              <div>
                <strong>
                  {isArabic
                    ? (
                      item
                        .product_name_ar ||
                      item
                        .product_name_en
                    )
                    : (
                      item
                        .product_name_en ||
                      item
                        .product_name_ar
                    )}
                </strong>

                <div
                  style={{
                    marginTop: 5,
                    fontSize: 12,
                    opacity: 0.6,
                  }}
                >
                  {isArabic
                    ? 'الكمية'
                    : 'Quantity'}
                  :{' '}
                  {
                    item.quantity
                  }
                </div>
              </div>

              <strong>
                {money(
                  item.line_total
                )}
              </strong>
            </div>
          )
        )}
      </section>

      {/* Price */}

      <section
        className="order-card"
        style={{
          padding: 18,
          marginBottom: 14,
        }}
      >
        <InfoRow
          label={
            isArabic
              ? 'المجموع'
              : 'Subtotal'
          }
          value={
            money(
              order.subtotal
            )
          }
        />

        <InfoRow
          label={
            isArabic
              ? 'التوصيل'
              : 'Delivery'
          }
          value={
            Number(
              order.delivery_fee ||
              0
            ) === 0
              ? (
                isArabic
                  ? 'مجاني'
                  : 'Free'
              )
              : money(
                order.delivery_fee
              )
          }
        />

        <div
          style={{
            display: 'flex',

            justifyContent:
              'space-between',

            alignItems:
              'center',

            marginTop: 14,

            paddingTop: 14,

            borderTop:
              '1px solid rgba(0,0,0,.08)',

            fontSize: 17,
          }}
        >
          <strong>
            {isArabic
              ? 'الإجمالي'
              : 'Total'}
          </strong>

          <strong
            style={{
              color:
                '#10985f',

              fontSize: 20,
            }}
          >
            {money(
              order.total
            )}
          </strong>
        </div>
      </section>

      {/* Customer notes */}

      {order.customer_notes && (
        <section
          className="order-card"
          style={{
            padding: 18,
            marginBottom: 14,
          }}
        >
          <h3
            style={{
              margin:
                '0 0 8px',
            }}
          >
            {isArabic
              ? 'ملاحظات الطلب'
              : 'Order Notes'}
          </h3>

          <div>
            {
              order.customer_notes
            }
          </div>
        </section>
      )}

      {/* Status history */}

      {history.length > 0 && (
        <section
          className="order-card"
          style={{
            padding: 18,
            marginBottom: 14,
          }}
        >
          <h3
            style={{
              margin:
                '0 0 16px',
            }}
          >
            {isArabic
              ? 'تتبع الطلب'
              : 'Order Tracking'}
          </h3>

          <div
            style={{
              display: 'grid',
              gap: 14,
            }}
          >
            {history.map(
              (item) => (
                <div
                  key={
                    item.id
                  }
                  style={{
                    display:
                      'flex',

                    gap: 12,
                  }}
                >
                  <span
                    style={{
                      width: 11,
                      height: 11,

                      marginTop:
                        6,

                      flex:
                        '0 0 11px',

                      borderRadius:
                        '50%',

                      background:
                        '#10985f',
                    }}
                  />

                  <div>
                    <strong>
                      {statusLabel(
                        item
                          .to_status
                      )}
                    </strong>

                    {item.note && (
                      <div
                        style={{
                          marginTop:
                            3,

                          fontSize:
                            12,

                          opacity:
                            0.65,
                        }}
                      >
                        {
                          item.note
                        }
                      </div>
                    )}

                    <div
                      style={{
                        marginTop:
                          3,

                        fontSize:
                          11,

                        opacity:
                          0.5,
                      }}
                    >
                      {formatDate(
                        item
                          .created_at
                      )}
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </section>
      )}

      {/* Cancel button */}

      {canCancel && (
        <button
          type="button"
          disabled={
            cancelling
          }
          onClick={() =>
            setCancelModalOpen(
              true
            )
          }
          style={{
            width: '100%',

            minHeight: 48,

            borderRadius: 14,

            border:
              '1px solid rgba(210,50,50,.25)',

            background:
              'rgba(210,50,50,.06)',

            color:
              '#c73434',

            font:
              'inherit',

            fontWeight:
              800,

            cursor:
              cancelling
                ? 'not-allowed'
                : 'pointer',
          }}
        >
          {cancelling
            ? (
              isArabic
                ? 'جاري الإلغاء...'
                : 'Cancelling...'
            )
            : (
              isArabic
                ? 'إلغاء الطلب'
                : 'Cancel Order'
            )}
        </button>
      )}

      {/* Cancel confirmation modal */}

      {cancelModalOpen && (
        <div
          role="presentation"
          onMouseDown={
            (event) => {
              if (
                event.target ===
                event.currentTarget &&
                !cancelling
              ) {
                setCancelModalOpen(
                  false
                );
              }
            }
          }
          style={{
            position:
              'fixed',

            inset: 0,

            zIndex:
              9999,

            display:
              'grid',

            placeItems:
              'center',

            padding:
              20,

            background:
              'rgba(15, 23, 42, 0.58)',

            backdropFilter:
              'blur(8px)',

            WebkitBackdropFilter:
              'blur(8px)',
          }}
        >
          <div
            role="dialog"

            aria-modal="true"

            aria-labelledby="cancel-order-title"

            aria-describedby="cancel-order-description"

            dir={
              isArabic
                ? 'rtl'
                : 'ltr'
            }

            onMouseDown={
              (event) =>
                event
                  .stopPropagation()
            }

            style={{
              width:
                '100%',

              maxWidth:
                390,

              padding:
                22,

              borderRadius:
                24,

              background:
                'var(--card, var(--surface, #ffffff))',

              color:
                'var(--ink, var(--text, #111827))',

              border:
                '1px solid var(--edge, rgba(0,0,0,.08))',

              boxShadow:
                '0 28px 80px rgba(0,0,0,.28)',

              animation:
                'cancelModalIn .18s ease-out',
            }}
          >
            <div
              style={{
                display:
                  'flex',

                alignItems:
                  'flex-start',

                justifyContent:
                  'space-between',

                gap:
                  16,
              }}
            >
              {/* Warning icon */}

              <div
                aria-hidden="true"

                style={{
                  width:
                    56,

                  height:
                    56,

                  flex:
                    '0 0 56px',

                  borderRadius:
                    18,

                  display:
                    'grid',

                  placeItems:
                    'center',

                  background:
                    'rgba(220, 38, 38, .10)',

                  color:
                    '#dc2626',

                  fontSize:
                    28,

                  fontWeight:
                    900,
                }}
              >
                !
              </div>

              {/* Close */}

              <button
                type="button"

                aria-label={
                  isArabic
                    ? 'إغلاق'
                    : 'Close'
                }

                disabled={
                  cancelling
                }

                onClick={() =>
                  setCancelModalOpen(
                    false
                  )
                }

                style={{
                  width:
                    36,

                  height:
                    36,

                  borderRadius:
                    12,

                  border:
                    '1px solid var(--edge, rgba(0,0,0,.08))',

                  background:
                    'transparent',

                  color:
                    'inherit',

                  font:
                    'inherit',

                  fontSize:
                    20,

                  lineHeight:
                    1,

                  cursor:
                    cancelling
                      ? 'not-allowed'
                      : 'pointer',

                  opacity:
                    cancelling
                      ? 0.5
                      : 0.72,
                }}
              >
                ×
              </button>
            </div>

            {/* Title */}

            <h2
              id="cancel-order-title"

              style={{
                margin:
                  '18px 0 8px',

                fontSize:
                  21,

                lineHeight:
                  1.4,
              }}
            >
              {isArabic
                ? 'إلغاء الطلب؟'
                : 'Cancel this order?'}
            </h2>

            {/* Description */}

            <p
              id="cancel-order-description"

              style={{
                margin:
                  0,

                opacity:
                  0.65,

                fontSize:
                  14,

                lineHeight:
                  1.8,
              }}
            >
              {isArabic
                ? 'هل أنت متأكد من أنك تريد إلغاء هذا الطلب؟ لن تتمكن من التراجع عن الإلغاء بعد التأكيد.'
                : 'Are you sure you want to cancel this order? You cannot undo the cancellation after confirming.'}
            </p>

            {/* Order number */}

            <div
              dir="ltr"

              style={{
                margin:
                  '16px 0 20px',

                padding:
                  '11px 13px',

                borderRadius:
                  13,

                background:
                  'var(--fill, rgba(0,0,0,.04))',

                border:
                  '1px solid var(--edge, rgba(0,0,0,.05))',

                fontSize:
                  12,

                fontWeight:
                  800,

                textAlign:
                  'center',

                overflowWrap:
                  'anywhere',
              }}
            >
              {
                order.order_number
              }
            </div>

            {/* Actions */}

            <div
              style={{
                display:
                  'grid',

                gridTemplateColumns:
                  '1fr 1fr',

                gap:
                  10,
              }}
            >
              <button
                type="button"

                disabled={
                  cancelling
                }

                onClick={() =>
                  setCancelModalOpen(
                    false
                  )
                }

                style={{
                  minHeight:
                    50,

                  padding:
                    '0 14px',

                  borderRadius:
                    14,

                  border:
                    '1px solid var(--edge, rgba(0,0,0,.10))',

                  background:
                    'transparent',

                  color:
                    'inherit',

                  font:
                    'inherit',

                  fontWeight:
                    800,

                  cursor:
                    cancelling
                      ? 'not-allowed'
                      : 'pointer',

                  opacity:
                    cancelling
                      ? 0.55
                      : 1,
                }}
              >
                {isArabic
                  ? 'الاحتفاظ بالطلب'
                  : 'Keep Order'}
              </button>

              <button
                type="button"

                disabled={
                  cancelling
                }

                onClick={
                  confirmCancelOrder
                }

                style={{
                  minHeight:
                    50,

                  padding:
                    '0 14px',

                  borderRadius:
                    14,

                  border:
                    0,

                  background:
                    '#dc2626',

                  color:
                    '#ffffff',

                  font:
                    'inherit',

                  fontWeight:
                    800,

                  cursor:
                    cancelling
                      ? 'not-allowed'
                      : 'pointer',

                  opacity:
                    cancelling
                      ? 0.7
                      : 1,

                  boxShadow:
                    '0 10px 24px rgba(220,38,38,.20)',
                }}
              >
                {cancelling
                  ? (
                    isArabic
                      ? 'جاري الإلغاء...'
                      : 'Cancelling...'
                  )
                  : (
                    isArabic
                      ? 'نعم، إلغاء الطلب'
                      : 'Yes, Cancel Order'
                  )}
              </button>
            </div>
          </div>

          <style>
            {`
              @keyframes cancelModalIn {
                from {
                  opacity: 0;
                  transform:
                    translateY(14px)
                    scale(.97);
                }

                to {
                  opacity: 1;
                  transform:
                    translateY(0)
                    scale(1);
                }
              }
            `}
          </style>
        </div>
      )}
    </main>
  );
}

function InfoRow({
  label,
  value,
}) {
  return (
    <div
      style={{
        display:
          'flex',

        justifyContent:
          'space-between',

        alignItems:
          'center',

        gap:
          14,
      }}
    >
      <span
        style={{
          opacity:
            0.6,

          fontSize:
            13,
        }}
      >
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}
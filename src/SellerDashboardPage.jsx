import React, {
  useEffect,
  useState,
} from 'react';

export default function SellerDashboardPage({
  lang = 'ar',
  api,
  showToast,
}) {
  const isArabic =
    lang === 'ar';

  const [
    dashboard,
    setDashboard,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError('');

    try {
      const response =
        await api.getSellerDashboard();

      setDashboard(
        response?.data || null
      );
    } catch (err) {
      console.error(
        'Seller dashboard error:',
        err
      );

      const message =
        isArabic
          ? 'تعذر تحميل لوحة البائع'
          : 'Could not load seller dashboard';

      setError(message);

      if (showToast) {
        showToast(message);
      }
    } finally {
      setLoading(false);
    }
  }

  function formatMoney(
    value,
    currency = 'SAR'
  ) {
    const amount =
      Number(value || 0);

    if (isArabic) {
      return `${amount.toFixed(2)} ر.س`;
    }

    return `${amount.toFixed(2)} ${currency}`;
  }

  function formatDate(value) {
    if (!value) {
      return '';
    }

    return new Date(
      value
    ).toLocaleDateString(
      isArabic
        ? 'ar-SA'
        : 'en-US',
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }
    );
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
        ar: 'قيد التجهيز',
        en: 'Preparing',
      },

      out_for_delivery: {
        ar: 'خرج للتوصيل',
        en: 'Out for delivery',
      },

      delivered: {
        ar: 'تم التوصيل',
        en: 'Delivered',
      },

      cancelled: {
        ar: 'ملغي',
        en: 'Cancelled',
      },

      approved: {
        ar: 'معتمد',
        en: 'Approved',
      },

      rejected: {
        ar: 'مرفوض',
        en: 'Rejected',
      },
    };

    return (
      labels?.[status]?.[
        isArabic
          ? 'ar'
          : 'en'
      ] ||
      status ||
      '-'
    );
  }

  function statusStyle(status) {
    if (
      status === 'delivered' ||
      status === 'approved'
    ) {
      return {
        background:
          'rgba(16,152,95,.10)',
        color:
          '#10985f',
      };
    }

    if (
      status === 'cancelled' ||
      status === 'rejected'
    ) {
      return {
        background:
          'rgba(220,38,38,.08)',
        color:
          '#dc2626',
      };
    }

    return {
      background:
        'rgba(245,158,11,.10)',
      color:
        '#b7791f',
    };
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
          maxWidth: 720,
          margin: '0 auto',
          padding:
            '28px 16px 150px',
          textAlign: 'center',
        }}
      >
        {isArabic
          ? 'جاري تحميل لوحة البائع...'
          : 'Loading seller dashboard...'}
      </main>
    );
  }

  if (
    error ||
    !dashboard
  ) {
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
            '40px 16px 150px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            marginBottom: 16,
            opacity: 0.7,
          }}
        >
          {error}
        </div>

        <button
          type="button"
          onClick={
            loadDashboard
          }
          style={{
            border: 0,
            borderRadius: 14,
            padding:
              '12px 20px',
            background:
              '#10985f',
            color: '#fff',
            font: 'inherit',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          {isArabic
            ? 'إعادة المحاولة'
            : 'Try again'}
        </button>
      </main>
    );
  }

  const seller =
    dashboard.seller || {};

  const recentOrders =
    Array.isArray(
      dashboard.recent_orders
    )
      ? dashboard.recent_orders
      : [];

  const stats = [
    {
      icon: '📦',
      label: isArabic
        ? 'المنتجات'
        : 'Products',
      value:
        dashboard.products_count ??
        0,
    },
    {
      icon: '✅',
      label: isArabic
        ? 'المنتجات النشطة'
        : 'Active products',
      value:
        dashboard
          .active_products_count ??
        0,
    },
    {
      icon: '🧾',
      label: isArabic
        ? 'الطلبات'
        : 'Orders',
      value:
        dashboard.orders_count ??
        0,
    },
    {
      icon: '🚚',
      label: isArabic
        ? 'الطلبات النشطة'
        : 'Active orders',
      value:
        dashboard
          .active_orders_count ??
        0,
    },
  ];

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
          '18px 16px 150px',
      }}
    >
      {/* Seller header */}

      <section
        style={{
          padding: 18,
          borderRadius: 22,
          background:
            'var(--card, #fff)',
          border:
            '1px solid rgba(0,0,0,.06)',
          boxShadow:
            '0 10px 30px rgba(0,0,0,.04)',
          marginBottom: 18,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems:
              'center',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: 18,
              background:
                'rgba(16,152,95,.10)',
              display: 'grid',
              placeItems:
                'center',
              fontSize: 26,
              overflow:
                'hidden',
              flexShrink: 0,
            }}
          >
            {seller.logo ? (
              <img
                src={seller.logo}
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit:
                    'cover',
                }}
              />
            ) : (
              '🏪'
            )}
          </div>

          <div
            style={{
              minWidth: 0,
              flex: 1,
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: 21,
                lineHeight: 1.4,
              }}
            >
              {isArabic
                ? seller.name_ar
                : seller.name_en}
            </h1>

            <div
              style={{
                marginTop: 5,
                fontSize: 13,
                opacity: 0.6,
              }}
            >
              {seller.email}
            </div>
          </div>

          <span
            style={{
              ...statusStyle(
                seller.status
              ),
              padding:
                '7px 10px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 800,
              whiteSpace:
                'nowrap',
            }}
          >
            {statusLabel(
              seller.status
            )}
          </span>
        </div>

        {(seller.description_ar ||
          seller.description_en) && (
          <p
            style={{
              margin:
                '15px 0 0',
              opacity: 0.68,
              fontSize: 13,
              lineHeight: 1.7,
            }}
          >
            {isArabic
              ? seller.description_ar ||
                seller.description_en
              : seller.description_en ||
                seller.description_ar}
          </p>
        )}
      </section>

      {/* Stats */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(2, minmax(0, 1fr))',
          gap: 12,
          marginBottom: 18,
        }}
      >
        {stats.map(
          (
            stat
          ) => (
            <article
              key={
                stat.label
              }
              style={{
                padding: 16,
                borderRadius: 19,
                background:
                  'var(--card, #fff)',
                border:
                  '1px solid rgba(0,0,0,.06)',
                boxShadow:
                  '0 8px 24px rgba(0,0,0,.035)',
              }}
            >
              <div
                style={{
                  fontSize: 22,
                  marginBottom: 8,
                }}
              >
                {stat.icon}
              </div>

              <div
                style={{
                  fontSize: 23,
                  fontWeight: 900,
                }}
              >
                {stat.value}
              </div>

              <div
                style={{
                  marginTop: 4,
                  opacity: 0.6,
                  fontSize: 12,
                }}
              >
                {stat.label}
              </div>
            </article>
          )
        )}
      </div>

      {/* Financial summary */}

      <section
        style={{
          padding: 18,
          borderRadius: 22,
          background:
            'var(--card, #fff)',
          border:
            '1px solid rgba(0,0,0,.06)',
          boxShadow:
            '0 8px 24px rgba(0,0,0,.035)',
          marginBottom: 20,
        }}
      >
        <h2
          style={{
            margin:
              '0 0 15px',
            fontSize: 17,
          }}
        >
          {isArabic
            ? 'الملخص المالي'
            : 'Financial summary'}
        </h2>

        <div
          style={{
            display: 'grid',
            gap: 13,
          }}
        >
          <FinancialRow
            label={
              isArabic
                ? 'إجمالي المبيعات'
                : 'Gross sales'
            }
            value={formatMoney(
              dashboard.gross_sales,
              dashboard.currency
            )}
          />

          <FinancialRow
            label={
              isArabic
                ? 'عمولة المنصة'
                : 'Platform commission'
            }
            value={formatMoney(
              dashboard
                .platform_commission,
              dashboard.currency
            )}
          />

          <FinancialRow
            label={
              isArabic
                ? 'أرباحك'
                : 'Your earnings'
            }
            value={formatMoney(
              dashboard.earnings,
              dashboard.currency
            )}
            strong
          />

          <FinancialRow
            label={
              isArabic
                ? 'نسبة العمولة'
                : 'Commission rate'
            }
            value={`${Number(
              seller
                .commission_percentage ||
                0
            ).toFixed(2)}%`}
          />
        </div>
      </section>

      {/* Recent orders */}

      <section>
        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems:
              'center',
            marginBottom: 12,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 18,
            }}
          >
            {isArabic
              ? 'أحدث الطلبات'
              : 'Recent orders'}
          </h2>

          <span
            style={{
              fontSize: 12,
              opacity: 0.55,
            }}
          >
            {dashboard.orders_count ||
              0}{' '}
            {isArabic
              ? 'طلب'
              : 'orders'}
          </span>
        </div>

        {recentOrders.length ===
        0 ? (
          <div
            style={{
              padding:
                '34px 20px',
              borderRadius: 20,
              background:
                'var(--card, #fff)',
              border:
                '1px solid rgba(0,0,0,.06)',
              textAlign:
                'center',
              opacity: 0.65,
            }}
          >
            {isArabic
              ? 'لا توجد طلبات حالياً'
              : 'No orders yet'}
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gap: 12,
            }}
          >
            {recentOrders.map(
              (
                order
              ) => (
                <article
                  key={order.id}
                  style={{
                    padding: 16,
                    borderRadius: 19,
                    background:
                      'var(--card, #fff)',
                    border:
                      '1px solid rgba(0,0,0,.06)',
                    boxShadow:
                      '0 8px 24px rgba(0,0,0,.03)',
                  }}
                >
                  <div
                    style={{
                      display:
                        'flex',
                      justifyContent:
                        'space-between',
                      gap: 12,
                      alignItems:
                        'flex-start',
                    }}
                  >
                    <div>
                      <strong
                        style={{
                          display:
                            'block',
                          fontSize: 14,
                        }}
                      >
                        {
                          order.order_number
                        }
                      </strong>

                      <div
                        style={{
                          marginTop: 5,
                          fontSize: 12,
                          opacity: 0.55,
                        }}
                      >
                        {formatDate(
                          order.created_at
                        )}
                      </div>
                    </div>

                    <span
                      style={{
                        ...statusStyle(
                          order.status
                        ),
                        padding:
                          '6px 9px',
                        borderRadius:
                          999,
                        fontSize: 11,
                        fontWeight:
                          800,
                      }}
                    >
                      {statusLabel(
                        order.status
                      )}
                    </span>
                  </div>

                  <div
                    style={{
                      display:
                        'flex',
                      justifyContent:
                        'space-between',
                      alignItems:
                        'center',
                      marginTop: 14,
                      paddingTop: 13,
                      borderTop:
                        '1px solid rgba(0,0,0,.06)',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          opacity: 0.55,
                        }}
                      >
                        {isArabic
                          ? 'العميل'
                          : 'Customer'}
                      </div>

                      <strong
                        style={{
                          display:
                            'block',
                          marginTop: 3,
                          fontSize: 13,
                        }}
                      >
                        {
                          order.customer_name
                        }
                      </strong>
                    </div>

                    <strong
                      style={{
                        color:
                          '#10985f',
                        fontSize: 15,
                      }}
                    >
                      {formatMoney(
                        order.total,
                        order.currency
                      )}
                    </strong>
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function FinancialRow({
  label,
  value,
  strong = false,
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent:
          'space-between',
        alignItems:
          'center',
        gap: 16,
      }}
    >
      <span
        style={{
          fontSize: 13,
          opacity: 0.65,
        }}
      >
        {label}
      </span>

      <strong
        style={{
          fontSize:
            strong
              ? 16
              : 14,
          color:
            strong
              ? '#10985f'
              : 'inherit',
        }}
      >
        {value}
      </strong>
    </div>
  );
}
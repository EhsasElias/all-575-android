import React, {
  useEffect,
  useState,
} from 'react';

export default function AdminDashboardPage({
  lang = 'ar',
  api,
  showToast,
  onOpenOrders,
  onOpenProducts,
  onOpenApplications,
}) {
  const isArabic = lang === 'ar';

  const [data, setData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError('');

    try {
      const response =
        await api.getAdminDashboard();

      setData(
        response?.data ||
        response ||
        null
      );
    } catch (err) {
      console.error(
        'Admin dashboard error:',
        err
      );

      const message =
        isArabic
          ? 'تعذر تحميل لوحة التحكم'
          : 'Could not load admin dashboard';

      setError(message);
      showToast?.(message);
    } finally {
      setLoading(false);
    }
  }

  function money(
    value,
    currency = 'SAR'
  ) {
    const amount =
      Number(value || 0);

    return isArabic
      ? `${amount
          .toFixed(2)
          .replace('.', ',')} ر.س`
      : `${amount.toFixed(
          2
        )} ${currency}`;
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
    if (status === 'delivered') {
      return {
        background:
          'rgba(16,152,95,.10)',
        color: '#10985f',
      };
    }

    if (status === 'cancelled') {
      return {
        background:
          'rgba(220,38,38,.08)',
        color: '#dc2626',
      };
    }

    if (
      [
        'confirmed',
        'preparing',
        'out_for_delivery',
      ].includes(status)
    ) {
      return {
        background:
          'rgba(37,99,235,.08)',
        color: '#2563eb',
      };
    }

    return {
      background:
        'rgba(245,158,11,.10)',
      color: '#b7791f',
    };
  }

  function formatDate(value) {
    if (!value) {
      return '-';
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return date.toLocaleString(
      isArabic
        ? 'ar-SA'
        : 'en-US',
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }
    );
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
          maxWidth: 900,
          margin: '0 auto',
          padding:
            '30px 16px 170px',
          textAlign: 'center',
        }}
      >
        {isArabic
          ? 'جاري تحميل لوحة التحكم...'
          : 'Loading dashboard...'}
      </main>
    );
  }

  if (
    error ||
    !data
  ) {
    return (
      <main
        dir={
          isArabic
            ? 'rtl'
            : 'ltr'
        }
        style={{
          maxWidth: 900,
          margin: '0 auto',
          padding:
            '30px 16px 170px',
        }}
      >
        <div
          style={{
            padding: 20,
            borderRadius: 18,
            textAlign: 'center',
            background:
              'rgba(220,38,38,.06)',
            color: '#dc2626',
          }}
        >
          {error ||
            (
              isArabic
                ? 'لا توجد بيانات'
                : 'No dashboard data'
            )}

          <button
            type="button"
            onClick={
              loadDashboard
            }
            style={{
              display: 'block',
              margin:
                '14px auto 0',
              border: 0,
              background:
                'transparent',
              color: '#10985f',
              font: 'inherit',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            {isArabic
              ? 'إعادة المحاولة'
              : 'Try again'}
          </button>
        </div>
      </main>
    );
  }

  const users =
    data.users || {};

  const categories =
    data.categories || {};

  const sellers =
    data.sellers || {};

  const products =
    data.products || {};

  const orders =
    data.orders || {};

  const sales =
    data.sales || {};

  const recentOrders =
    Array.isArray(
      data.recent_orders
    )
      ? data.recent_orders
      : [];

  return (
    <main
      dir={
        isArabic
          ? 'rtl'
          : 'ltr'
      }
      style={{
        maxWidth: 900,
        margin: '0 auto',
        padding:
          '20px 16px 170px',
      }}
    >
      {/* Header */}

      <div
        style={{
          display: 'flex',
          alignItems:
            'flex-start',
          justifyContent:
            'space-between',
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
              ? 'لوحة التحكم'
              : 'Admin Dashboard'}
          </h1>

          <div
            style={{
              marginTop: 5,
              opacity: 0.55,
              fontSize: 12,
            }}
          >
            {isArabic
              ? 'نظرة عامة على المتجر'
              : 'Store overview'}
          </div>
        </div>

        <button
          type="button"
          onClick={
            loadDashboard
          }
          style={{
            minHeight: 40,
            border:
              '1px solid rgba(16,152,95,.18)',
            borderRadius: 13,
            padding:
              '0 14px',
            background:
              'rgba(16,152,95,.06)',
            color: '#10985f',
            font: 'inherit',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          {isArabic
            ? 'تحديث'
            : 'Refresh'}
        </button>
      </div>

      {/* Main counts */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(145px, 1fr))',
          gap: 10,
          marginBottom: 16,
        }}
      >
        <StatCard
          value={
            users.total || 0
          }
          label={
            isArabic
              ? 'المستخدمون'
              : 'Users'
          }
          note={
            isArabic
              ? `${users.customers || 0} عملاء`
              : `${users.customers || 0} customers`
          }
        />

        <StatCard
          value={
            sellers.total || 0
          }
          label={
            isArabic
              ? 'البائعون'
              : 'Sellers'
          }
          note={
            isArabic
              ? `${sellers.active || 0} نشط`
              : `${sellers.active || 0} active`
          }
        />

        <StatCard
          value={
            products.total || 0
          }
          label={
            isArabic
              ? 'المنتجات'
              : 'Products'
          }
          note={
            isArabic
              ? `${products.active || 0} نشط`
              : `${products.active || 0} active`
          }
        />

        <StatCard
          value={
            orders.total || 0
          }
          label={
            isArabic
              ? 'الطلبات'
              : 'Orders'
          }
          note={
            isArabic
              ? `${orders.pending || 0} قيد الانتظار`
              : `${orders.pending || 0} pending`
          }
        />

        <StatCard
          value={
            categories.total || 0
          }
          label={
            isArabic
              ? 'الأقسام'
              : 'Categories'
          }
          note={
            isArabic
              ? `${categories.active || 0} نشط`
              : `${categories.active || 0} active`
          }
        />
      </div>

      {/* Sales */}

      <Section
        title={
          isArabic
            ? 'المبيعات والأرباح'
            : 'Sales & Earnings'
        }
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 10,
          }}
        >
          <MoneyCard
            label={
              isArabic
                ? 'إجمالي المبيعات'
                : 'Gross sales'
            }
            value={
              money(
                sales.gross_sales,
                sales.currency
              )
            }
            strong
          />

          <MoneyCard
            label={
              isArabic
                ? 'مبيعات اليوم'
                : 'Today sales'
            }
            value={
              money(
                sales.today_sales,
                sales.currency
              )
            }
          />

          <MoneyCard
            label={
              isArabic
                ? 'مبيعات الشهر'
                : 'Month sales'
            }
            value={
              money(
                sales.month_sales,
                sales.currency
              )
            }
          />

          <MoneyCard
            label={
              isArabic
                ? 'أرباح البائعين'
                : 'Seller earnings'
            }
            value={
              money(
                sales.seller_earnings,
                sales.currency
              )
            }
          />

          <MoneyCard
            label={
              isArabic
                ? 'عمولة المنصة'
                : 'Platform commission'
            }
            value={
              money(
                sales.platform_commission,
                sales.currency
              )
            }
            strong
          />
        </div>
      </Section>

      {/* Orders summary */}

      <Section
        title={
          isArabic
            ? 'حالات الطلبات'
            : 'Order Statuses'
        }
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(120px, 1fr))',
            gap: 8,
          }}
        >
          <MiniStat
            value={
              orders.pending || 0
            }
            label={
              statusLabel(
                'pending'
              )
            }
          />

          <MiniStat
            value={
              orders.confirmed || 0
            }
            label={
              statusLabel(
                'confirmed'
              )
            }
          />

          <MiniStat
            value={
              orders.preparing || 0
            }
            label={
              statusLabel(
                'preparing'
              )
            }
          />

          <MiniStat
            value={
              orders.out_for_delivery ||
              0
            }
            label={
              statusLabel(
                'out_for_delivery'
              )
            }
          />

          <MiniStat
            value={
              orders.delivered || 0
            }
            label={
              statusLabel(
                'delivered'
              )
            }
          />

          <MiniStat
            value={
              orders.cancelled || 0
            }
            label={
              statusLabel(
                'cancelled'
              )
            }
          />
        </div>
      </Section>

      {/* Quick actions */}

      <Section
        title={
          isArabic
            ? 'إدارة المتجر'
            : 'Store Management'
        }
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 10,
          }}
        >
          <ActionButton
            label={
              isArabic
                ? 'إدارة الطلبات'
                : 'Manage Orders'
            }
            onClick={
              onOpenOrders
            }
          />

          <ActionButton
            label={
              isArabic
                ? 'إدارة المنتجات'
                : 'Manage Products'
            }
            onClick={
              onOpenProducts
            }
          />

          <ActionButton
            label={
              isArabic
                ? 'طلبات البائعين'
                : 'Seller Applications'
            }
            note={
              sellers.pending_applications ||
              0
            }
            onClick={
              onOpenApplications
            }
          />
        </div>
      </Section>

      {/* Recent orders */}

      <Section
        title={
          isArabic
            ? 'أحدث الطلبات'
            : 'Recent Orders'
        }
      >
        {recentOrders.length >
        0 ? (
          <div
            style={{
              display: 'grid',
              gap: 9,
            }}
          >
            {recentOrders.map(
              (order) => (
                <article
                  key={
                    order.id
                  }
                  style={{
                    padding: 13,
                    borderRadius: 15,
                    background:
                      'rgba(0,0,0,.025)',
                    border:
                      '1px solid rgba(0,0,0,.045)',
                  }}
                >
                  <div
                    style={{
                      display:
                        'flex',
                      justifyContent:
                        'space-between',
                      alignItems:
                        'flex-start',
                      gap: 12,
                    }}
                  >
                    <div>
                      <strong
                        style={{
                          display:
                            'block',
                          fontSize: 12,
                        }}
                      >
                        {
                          order.order_number
                        }
                      </strong>

                      <div
                        style={{
                          marginTop: 4,
                          fontSize: 10,
                          opacity: 0.5,
                        }}
                      >
                        {
                          order.customer_name
                        }
                        {' · '}
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
                          '5px 8px',
                        borderRadius:
                          999,
                        fontSize: 9,
                        fontWeight: 800,
                      }}
                    >
                      {statusLabel(
                        order.status
                      )}
                    </span>
                  </div>

                  <strong
                    style={{
                      display:
                        'block',
                      marginTop: 10,
                      color:
                        '#10985f',
                      fontSize: 13,
                    }}
                  >
                    {money(
                      order.total,
                      order.currency
                    )}
                  </strong>
                </article>
              )
            )}
          </div>
        ) : (
          <div
            style={{
              textAlign: 'center',
              opacity: 0.55,
              padding: 25,
            }}
          >
            {isArabic
              ? 'لا توجد طلبات'
              : 'No orders'}
          </div>
        )}
      </Section>
    </main>
  );
}

function Section({
  title,
  children,
}) {
  return (
    <section
      style={{
        padding: 16,
        borderRadius: 20,
        background:
          'var(--card, #fff)',
        border:
          '1px solid rgba(0,0,0,.06)',
        boxShadow:
          '0 8px 24px rgba(0,0,0,.025)',
        marginBottom: 14,
      }}
    >
      <h2
        style={{
          margin:
            '0 0 14px',
          fontSize: 16,
        }}
      >
        {title}
      </h2>

      {children}
    </section>
  );
}

function StatCard({
  value,
  label,
  note,
}) {
  return (
    <div
      style={{
        padding: 14,
        borderRadius: 17,
        background:
          'var(--card, #fff)',
        border:
          '1px solid rgba(0,0,0,.06)',
      }}
    >
      <strong
        style={{
          display: 'block',
          fontSize: 22,
        }}
      >
        {value}
      </strong>

      <span
        style={{
          display: 'block',
          marginTop: 3,
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        {label}
      </span>

      <small
        style={{
          display: 'block',
          marginTop: 4,
          opacity: 0.5,
          fontSize: 9,
        }}
      >
        {note}
      </small>
    </div>
  );
}

function MoneyCard({
  label,
  value,
  strong = false,
}) {
  return (
    <div
      style={{
        padding: 13,
        borderRadius: 15,
        background:
          strong
            ? 'rgba(16,152,95,.06)'
            : 'rgba(0,0,0,.025)',
        border:
          strong
            ? '1px solid rgba(16,152,95,.12)'
            : '1px solid transparent',
      }}
    >
      <span
        style={{
          display: 'block',
          fontSize: 9,
          opacity: 0.55,
        }}
      >
        {label}
      </span>

      <strong
        style={{
          display: 'block',
          marginTop: 5,
          fontSize: 14,
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

function MiniStat({
  value,
  label,
}) {
  return (
    <div
      style={{
        padding: 11,
        borderRadius: 13,
        background:
          'rgba(0,0,0,.025)',
        textAlign: 'center',
      }}
    >
      <strong
        style={{
          display: 'block',
          fontSize: 16,
        }}
      >
        {value}
      </strong>

      <span
        style={{
          display: 'block',
          marginTop: 3,
          opacity: 0.55,
          fontSize: 9,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function ActionButton({
  label,
  note,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      style={{
        minHeight: 49,
        borderRadius: 14,
        border:
          '1px solid rgba(16,152,95,.16)',
        background:
          'rgba(16,152,95,.055)',
        color: '#10985f',
        font: 'inherit',
        fontWeight: 800,
        cursor: 'pointer',
        padding:
          '0 13px',
      }}
    >
      {label}

      {note != null && (
        <span
          style={{
            marginInlineStart: 6,
            opacity: 0.65,
          }}
        >
          ({note})
        </span>
      )}
    </button>
  );
}

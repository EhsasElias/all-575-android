import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

export default function SellerOrdersPage({
  lang = 'ar',
  api,
  showToast,
  onOpenOrder,
}) {
  const isArabic =
    lang === 'ar';

  const [
    orders,
    setOrders,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');

  const [
    search,
    setSearch,
  ] = useState('');

  const [
    statusFilter,
    setStatusFilter,
  ] = useState('all');

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    setError('');

    try {
      const response =
        await api.getSellerOrders();

      const list =
        Array.isArray(
          response?.data
        )
          ? response.data
          : Array.isArray(
              response?.data?.data
            )
            ? response.data.data
            : Array.isArray(
                response
              )
              ? response
              : [];

      setOrders(list);
    } catch (err) {
      console.error(
        'Seller orders error:',
        err
      );

      const message =
        isArabic
          ? 'تعذر تحميل طلبات البائع'
          : 'Could not load seller orders';

      setError(message);

      showToast?.(
        message
      );
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

    if (isArabic) {
      return `${amount
        .toFixed(2)
        .replace(
          '.',
          ','
        )} ر.س`;
    }

    return `${amount.toFixed(
      2
    )} ${currency}`;
  }

  function formatDate(
    value
  ) {
    if (!value) {
      return '-';
    }

    return new Date(
      value
    ).toLocaleString(
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

  function statusLabel(
    status
  ) {
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

  function statusStyle(
    status
  ) {
    if (
      status ===
      'delivered'
    ) {
      return {
        background:
          'rgba(16,152,95,.10)',
        color:
          '#10985f',
      };
    }

    if (
      status ===
      'cancelled'
    ) {
      return {
        background:
          'rgba(220,38,38,.08)',
        color:
          '#dc2626',
      };
    }

    if (
      status ===
      'confirmed' ||
      status ===
      'preparing' ||
      status ===
      'out_for_delivery'
    ) {
      return {
        background:
          'rgba(37,99,235,.08)',
        color:
          '#2563eb',
      };
    }

    return {
      background:
        'rgba(245,158,11,.10)',
      color:
        '#b7791f',
    };
  }

  function paymentLabel(
    method
  ) {
    if (
      method ===
      'cash_on_delivery'
    ) {
      return isArabic
        ? 'الدفع عند الاستلام'
        : 'Cash on delivery';
    }

    return (
      method ||
      '-'
    );
  }

  function paymentStatusLabel(
    status
  ) {
    const labels = {
      pending: {
        ar: 'بانتظار الدفع',
        en: 'Pending payment',
      },

      paid: {
        ar: 'مدفوع',
        en: 'Paid',
      },

      failed: {
        ar: 'فشل الدفع',
        en: 'Payment failed',
      },

      refunded: {
        ar: 'مسترجع',
        en: 'Refunded',
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

  const filteredOrders =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return orders.filter(
        (order) => {
          if (
            statusFilter !==
              'all' &&
            order.status !==
              statusFilter
          ) {
            return false;
          }

          if (!query) {
            return true;
          }

          const items =
            Array.isArray(
              order.items
            )
              ? order.items
              : [];

          const values = [
            order.order_number,
            order.customer_name,
            order.customer_phone,
            order.city,
            order.district,

            ...items.map(
              (item) =>
                item.product_name_ar
            ),

            ...items.map(
              (item) =>
                item.product_name_en
            ),
          ];

          return values.some(
            (value) =>
              String(
                value || ''
              )
                .toLowerCase()
                .includes(query)
          );
        }
      );
    }, [
      orders,
      search,
      statusFilter,
    ]);

  const activeOrdersCount =
    orders.filter(
      (order) =>
        [
          'pending',
          'confirmed',
          'preparing',
          'out_for_delivery',
        ].includes(
          order.status
        )
    ).length;

  const deliveredCount =
    orders.filter(
      (order) =>
        order.status ===
        'delivered'
    ).length;

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
            '30px 16px 170px',
          textAlign:
            'center',
        }}
      >
        {isArabic
          ? 'جاري تحميل الطلبات...'
          : 'Loading orders...'}
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
            {isArabic
              ? 'طلبات المتجر'
              : 'Store Orders'}
          </h1>

          <div
            style={{
              marginTop: 5,
              fontSize: 12,
              opacity: 0.55,
            }}
          >
            {isArabic
              ? `${orders.length} طلب`
              : `${orders.length} orders`}
          </div>
        </div>

        <button
          type="button"
          onClick={
            loadOrders
          }
          style={{
            minHeight: 40,
            border:
              '1px solid rgba(16,152,95,.20)',
            borderRadius: 13,
            background:
              'rgba(16,152,95,.06)',
            color:
              '#10985f',
            padding:
              '0 13px',
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

      {/* Statistics */}

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
          value={
            orders.length
          }
          label={
            isArabic
              ? 'كل الطلبات'
              : 'All orders'
          }
        />

        <StatCard
          value={
            activeOrdersCount
          }
          label={
            isArabic
              ? 'النشطة'
              : 'Active'
          }
        />

        <StatCard
          value={
            deliveredCount
          }
          label={
            isArabic
              ? 'المكتملة'
              : 'Delivered'
          }
        />
      </div>

      {/* Search */}

      <input
        value={
          search
        }
        onChange={
          (event) =>
            setSearch(
              event.target.value
            )
        }
        placeholder={
          isArabic
            ? 'ابحث برقم الطلب أو العميل...'
            : 'Search order or customer...'
        }
        style={{
          boxSizing:
            'border-box',
          width: '100%',
          minHeight: 48,
          border:
            '1px solid rgba(0,0,0,.09)',
          borderRadius: 15,
          padding:
            '0 15px',
          background:
            'var(--card, #fff)',
          color:
            'inherit',
          font: 'inherit',
          outline: 'none',
          marginBottom: 12,
        }}
      />

      {/* Status filters */}

      <div
        style={{
          display: 'flex',
          gap: 7,
          overflowX: 'auto',
          paddingBottom: 6,
          marginBottom: 16,
        }}
      >
        {[
          [
            'all',
            isArabic
              ? 'الكل'
              : 'All',
          ],
          [
            'pending',
            statusLabel(
              'pending'
            ),
          ],
          [
            'confirmed',
            statusLabel(
              'confirmed'
            ),
          ],
          [
            'preparing',
            statusLabel(
              'preparing'
            ),
          ],
          [
            'out_for_delivery',
            statusLabel(
              'out_for_delivery'
            ),
          ],
          [
            'delivered',
            statusLabel(
              'delivered'
            ),
          ],
          [
            'cancelled',
            statusLabel(
              'cancelled'
            ),
          ],
        ].map(
          ([
            status,
            label,
          ]) => (
            <button
              key={
                status
              }
              type="button"
              onClick={() =>
                setStatusFilter(
                  status
                )
              }
              style={{
                flexShrink: 0,
                border:
                  statusFilter ===
                  status
                    ? 0
                    : '1px solid rgba(0,0,0,.08)',

                background:
                  statusFilter ===
                  status
                    ? '#10985f'
                    : 'var(--card, #fff)',

                color:
                  statusFilter ===
                  status
                    ? '#fff'
                    : 'inherit',

                borderRadius:
                  999,

                minHeight: 34,

                padding:
                  '0 12px',

                font:
                  'inherit',

                fontSize: 11,

                fontWeight: 800,

                cursor:
                  'pointer',
              }}
            >
              {label}
            </button>
          )
        )}
      </div>

      {/* Error */}

      {error && (
        <div
          style={{
            padding: 16,
            borderRadius: 16,
            background:
              'rgba(220,38,38,.06)',
            color:
              '#dc2626',
            textAlign:
              'center',
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {/* Empty */}

      {!error &&
        filteredOrders.length ===
          0 && (
          <div
            style={{
              padding:
                '50px 20px',
              textAlign:
                'center',
              borderRadius: 20,
              background:
                'var(--card, #fff)',
              border:
                '1px solid rgba(0,0,0,.06)',
            }}
          >
            <div
              style={{
                fontSize: 38,
              }}
            >
              🧾
            </div>

            <strong
              style={{
                display:
                  'block',
                marginTop: 10,
              }}
            >
              {isArabic
                ? 'لا توجد طلبات'
                : 'No orders found'}
            </strong>
          </div>
        )}

      {/* Orders */}

      <div
        style={{
          display: 'grid',
          gap: 13,
        }}
      >
        {filteredOrders.map(
          (order) => {
            const items =
              Array.isArray(
                order.items
              )
                ? order.items
                : [];

            return (
              <article
                key={
                  order.id
                }
                style={{
                  padding: 16,
                  borderRadius: 20,
                  background:
                    'var(--card, #fff)',
                  border:
                    '1px solid rgba(0,0,0,.06)',
                  boxShadow:
                    '0 8px 24px rgba(0,0,0,.035)',
                }}
              >
                {/* Order top */}

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
                        fontSize: 14,
                      }}
                    >
                      {
                        order.order_number
                      }
                    </strong>

                    <div
                      style={{
                        marginTop: 4,
                        fontSize: 11,
                        opacity: 0.5,
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

                      fontSize: 10,

                      fontWeight: 800,
                    }}
                  >
                    {statusLabel(
                      order.status
                    )}
                  </span>
                </div>

                {/* Customer */}

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(2, minmax(0, 1fr))',
                    gap: 10,
                    marginTop: 14,
                  }}
                >
                  <Info
                    label={
                      isArabic
                        ? 'العميل'
                        : 'Customer'
                    }
                    value={
                      order.customer_name
                    }
                  />

                  <Info
                    label={
                      isArabic
                        ? 'الجوال'
                        : 'Phone'
                    }
                    value={
                      order.customer_phone
                    }
                  />

                  <Info
                    label={
                      isArabic
                        ? 'المدينة'
                        : 'City'
                    }
                    value={
                      order.city
                    }
                  />

                  <Info
                    label={
                      isArabic
                        ? 'الدفع'
                        : 'Payment'
                    }
                    value={
                      paymentLabel(
                        order.payment_method
                      )
                    }
                  />
                </div>

                {/* Items */}

                <div
                  style={{
                    marginTop: 15,
                    paddingTop: 14,
                    borderTop:
                      '1px solid rgba(0,0,0,.055)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      opacity: 0.55,
                      marginBottom: 9,
                    }}
                  >
                    {isArabic
                      ? 'منتجاتك في هذا الطلب'
                      : 'Your items in this order'}
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gap: 8,
                    }}
                  >
                    {items.map(
                      (
                        item
                      ) => (
                        <div
                          key={
                            item.id
                          }
                          style={{
                            display:
                              'flex',

                            justifyContent:
                              'space-between',

                            alignItems:
                              'center',

                            gap: 12,

                            padding:
                              '10px 11px',

                            borderRadius:
                              13,

                            background:
                              'rgba(0,0,0,.025)',
                          }}
                        >
                          <div>
                            <strong
                              style={{
                                display:
                                  'block',

                                fontSize:
                                  12,
                              }}
                            >
                              {isArabic
                                ? item.product_name_ar ||
                                  item.product_name_en
                                : item.product_name_en ||
                                  item.product_name_ar}
                            </strong>

                            <span
                              style={{
                                display:
                                  'block',

                                marginTop:
                                  3,

                                fontSize:
                                  10,

                                opacity:
                                  0.55,
                              }}
                            >
                              {isArabic
                                ? `الكمية: ${item.quantity}`
                                : `Qty: ${item.quantity}`}
                            </span>
                          </div>

                          <strong
                            style={{
                              fontSize:
                                12,
                            }}
                          >
                            {money(
                              item.line_total,
                              order.currency
                            )}
                          </strong>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Seller financial information */}

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(2, minmax(0, 1fr))',
                    gap: 9,
                    marginTop: 14,
                  }}
                >
                  <MoneyBox
                    label={
                      isArabic
                        ? 'قيمة منتجاتك'
                        : 'Your subtotal'
                    }
                    value={
                      money(
                        order.seller_subtotal,
                        order.currency
                      )
                    }
                  />

                  <MoneyBox
                    label={
                      isArabic
                        ? 'مبلغ البائع'
                        : 'Seller amount'
                    }
                    value={
                      money(
                        order.seller_earnings,
                        order.currency
                      )
                    }
                    strong
                  />
                </div>

                {/* Payment status */}

                <div
                  style={{
                    marginTop: 12,
                    fontSize: 11,
                    opacity: 0.6,
                  }}
                >
                  {isArabic
                    ? 'حالة الدفع: '
                    : 'Payment status: '}

                  <strong>
                    {paymentStatusLabel(
                      order.payment_status
                    )}
                  </strong>
                </div>

                {/* Action */}

                <button
                  type="button"
                  onClick={() =>
                    onOpenOrder?.(
                      order
                    )
                  }
                  style={{
                    width: '100%',
                    minHeight: 41,
                    marginTop: 14,
                    borderRadius: 13,
                    border:
                      '1px solid rgba(16,152,95,.18)',
                    background:
                      'rgba(16,152,95,.055)',
                    color:
                      '#10985f',
                    font: 'inherit',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {isArabic
                    ? 'عرض تفاصيل الطلب'
                    : 'View order details'}
                </button>
              </article>
            );
          }
        )}
      </div>
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
        padding:
          '14px 10px',
        borderRadius: 17,
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

function Info({
  label,
  value,
}) {
  return (
    <div
      style={{
        padding: 10,
        borderRadius: 13,
        background:
          'rgba(0,0,0,.025)',
      }}
    >
      <span
        style={{
          display: 'block',
          fontSize: 9,
          opacity: 0.5,
        }}
      >
        {label}
      </span>

      <strong
        style={{
          display: 'block',
          marginTop: 4,
          fontSize: 11,
        }}
      >
        {value || '-'}
      </strong>
    </div>
  );
}

function MoneyBox({
  label,
  value,
  strong = false,
}) {
  return (
    <div
      style={{
        padding: 11,
        borderRadius: 14,
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
          marginTop: 4,
          fontSize: 13,
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
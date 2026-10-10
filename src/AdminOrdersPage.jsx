import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

export default function AdminOrdersPage({
  lang = 'ar',
  api,
  showToast,
  onBack,
}) {
  const isArabic =
    lang === 'ar';

  const [orders, setOrders] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState('');

  const [statusFilter, setStatusFilter] =
    useState('all');

  const [paymentFilter, setPaymentFilter] =
    useState('all');

  const [
    selectedOrder,
    setSelectedOrder,
  ] = useState(null);

  const [
    detailsLoading,
    setDetailsLoading,
  ] = useState(false);

  const [
    statusAction,
    setStatusAction,
  ] = useState(null);

  const [note, setNote] =
    useState('');

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);

    try {
      const response =
        await api.getAdminOrders();

      const rows =
        Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
            ? response
            : [];

      setOrders(rows);
    } catch (error) {
      console.error(
        'Admin orders error:',
        error
      );

      showToast?.(
        isArabic
          ? 'تعذر تحميل الطلبات'
          : 'Could not load orders'
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredOrders =
    useMemo(() => {
      const q =
        search
          .trim()
          .toLowerCase();

      return orders.filter(
        (order) => {
          const matchesSearch =
            !q ||
            [
              order.order_number,
              order.customer_name,
              order.customer_phone,
              order.user?.email,
              order.city,
            ]
              .filter(Boolean)
              .join(' ')
              .toLowerCase()
              .includes(q);

          const matchesStatus =
            statusFilter === 'all' ||
            order.status ===
              statusFilter;

          const matchesPayment =
            paymentFilter === 'all' ||
            order.payment_status ===
              paymentFilter;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesPayment
          );
        }
      );
    }, [
      orders,
      search,
      statusFilter,
      paymentFilter,
    ]);

  const stats =
    useMemo(() => ({
      total:
        orders.length,

      pending:
        orders.filter(
          (order) =>
            order.status === 'pending'
        ).length,

      active:
        orders.filter(
          (order) =>
            [
              'confirmed',
              'preparing',
              'out_for_delivery',
            ].includes(
              order.status
            )
        ).length,

      delivered:
        orders.filter(
          (order) =>
            order.status ===
            'delivered'
        ).length,

      cancelled:
        orders.filter(
          (order) =>
            order.status ===
            'cancelled'
        ).length,
    }), [orders]);

  function statusText(
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
        ar: 'تم التسليم',
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

  function paymentText(
    status
  ) {
    const labels = {
      pending: {
        ar: 'غير مدفوع',
        en: 'Pending',
      },

      paid: {
        ar: 'مدفوع',
        en: 'Paid',
      },

      failed: {
        ar: 'فشل الدفع',
        en: 'Failed',
      },

      refunded: {
        ar: 'مسترد',
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

  function money(
    value,
    currency = 'SAR'
  ) {
    const amount =
      Number(value || 0);

    return isArabic
      ? `${amount
          .toFixed(2)
          .replace(
            '.',
            ','
          )} ر.س`
      : `${amount.toFixed(2)} ${currency}`;
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

  function allowedTransitions(
    status
  ) {
    const transitions = {
      pending: [
        'confirmed',
        'cancelled',
      ],

      confirmed: [
        'preparing',
        'cancelled',
      ],

      preparing: [
        'out_for_delivery',
        'cancelled',
      ],

      out_for_delivery: [
        'delivered',
      ],

      delivered: [],

      cancelled: [],
    };

    return (
      transitions[status] || []
    );
  }

  async function openOrder(
    order
  ) {
    setDetailsLoading(true);
    setSelectedOrder(order);

    try {
      const response =
        await api.getAdminOrder(
          order.id
        );

      setSelectedOrder(
        response?.data ||
        response ||
        order
      );
    } catch (error) {
      console.error(
        'Admin order details error:',
        error
      );

      showToast?.(
        isArabic
          ? 'تعذر تحميل تفاصيل الطلب'
          : 'Could not load order details'
      );
    } finally {
      setDetailsLoading(false);
    }
  }

  function openStatusAction(
    status
  ) {
    setStatusAction(status);
    setNote('');
  }

  async function updateStatus(
    event
  ) {
    event.preventDefault();

    if (
      !selectedOrder ||
      !statusAction
    ) {
      return;
    }

    setSaving(true);

    try {
      const response =
        await api.updateOrderStatus(
          selectedOrder.id,
          statusAction,
          note.trim() || null
        );

      const updated =
        response?.data ||
        response;

      setOrders(
        (current) =>
          current.map(
            (order) =>
              Number(order.id) ===
              Number(
                selectedOrder.id
              )
                ? {
                    ...order,
                    ...updated,
                  }
                : order
          )
      );

      setStatusAction(null);
      setNote('');

      showToast?.(
        isArabic
          ? 'تم تحديث حالة الطلب'
          : 'Order status updated'
      );

      await openOrder({
        ...selectedOrder,
        ...updated,
      });
    } catch (error) {
      console.error(
        'Admin order status error:',
        error
      );

      showToast?.(
        error?.message ||
        (
          isArabic
            ? 'تعذر تحديث حالة الطلب'
            : 'Could not update order status'
        )
      );
    } finally {
      setSaving(false);
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
              ? 'إدارة الطلبات'
              : 'Admin Orders'}
          </h1>

          <div
            style={{
              marginTop: 5,
              opacity: 0.55,
              fontSize: 11,
            }}
          >
            {isArabic
              ? 'متابعة وإدارة جميع طلبات المتجر'
              : 'Manage all store orders'}
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
            onClick={
              loadOrders
            }
            style={
              secondaryButton
            }
          >
            {isArabic
              ? 'تحديث'
              : 'Refresh'}
          </button>

          <button
            type="button"
            onClick={
              onBack
            }
            style={
              secondaryButton
            }
          >
            {isArabic
              ? 'رجوع'
              : 'Back'}
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(5, minmax(0,1fr))',
          gap: 8,
          marginBottom: 14,
        }}
      >
        <Stat
          label={
            isArabic
              ? 'الكل'
              : 'All'
          }
          value={
            stats.total
          }
        />

        <Stat
          label={
            isArabic
              ? 'قيد الانتظار'
              : 'Pending'
          }
          value={
            stats.pending
          }
        />

        <Stat
          label={
            isArabic
              ? 'قيد التنفيذ'
              : 'Active'
          }
          value={
            stats.active
          }
        />

        <Stat
          label={
            isArabic
              ? 'تم التسليم'
              : 'Delivered'
          }
          value={
            stats.delivered
          }
        />

        <Stat
          label={
            isArabic
              ? 'ملغي'
              : 'Cancelled'
          }
          value={
            stats.cancelled
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
              ? 'ابحث برقم الطلب أو العميل أو الجوال...'
              : 'Search order, customer or phone...'
          }
          style={
            inputStyle
          }
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(2, minmax(0,1fr))',
            gap: 8,
            marginTop: 9,
          }}
        >
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
                ? 'كل حالات الطلب'
                : 'All order statuses'}
            </option>

            {[
              'pending',
              'confirmed',
              'preparing',
              'out_for_delivery',
              'delivered',
              'cancelled',
            ].map(
              (status) => (
                <option
                  key={status}
                  value={status}
                >
                  {statusText(
                    status
                  )}
                </option>
              )
            )}
          </select>

          <select
            value={
              paymentFilter
            }
            onChange={
              (event) =>
                setPaymentFilter(
                  event.target.value
                )
            }
            style={
              inputStyle
            }
          >
            <option value="all">
              {isArabic
                ? 'كل حالات الدفع'
                : 'All payment statuses'}
            </option>

            <option value="pending">
              {paymentText(
                'pending'
              )}
            </option>

            <option value="paid">
              {paymentText(
                'paid'
              )}
            </option>

            <option value="failed">
              {paymentText(
                'failed'
              )}
            </option>

            <option value="refunded">
              {paymentText(
                'refunded'
              )}
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
        {filteredOrders.map(
          (order) => (
            <article
              key={
                order.id
              }
              onClick={() =>
                openOrder(order)
              }
              style={{
                padding: 15,
                borderRadius: 18,
                background:
                  'var(--card, #fff)',
                border:
                  '1px solid rgba(0,0,0,.06)',
                cursor: 'pointer',
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
                }}
              >
                <div>
                  <strong
                    style={{
                      display: 'block',
                      fontSize: 13,
                    }}
                  >
                    {
                      order.order_number
                    }
                  </strong>

                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 9,
                      opacity: 0.5,
                    }}
                  >
                    {formatDate(
                      order.created_at
                    )}
                  </div>
                </div>

                <StatusBadge
                  status={
                    order.status
                  }
                >
                  {statusText(
                    order.status
                  )}
                </StatusBadge>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(4, minmax(0,1fr))',
                  gap: 8,
                  marginTop: 12,
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
                      ? 'المنتجات'
                      : 'Items'
                  }
                  value={
                    order.items_count
                  }
                />

                <Info
                  label={
                    isArabic
                      ? 'الإجمالي'
                      : 'Total'
                  }
                  value={
                    money(
                      order.total,
                      order.currency
                    )
                  }
                />
              </div>

              <div
                style={{
                  marginTop: 9,
                  display: 'flex',
                  gap: 6,
                  flexWrap: 'wrap',
                }}
              >
                <Badge>
                  {paymentText(
                    order.payment_status
                  )}
                </Badge>

                <Badge>
                  {order.payment_method ===
                  'cash_on_delivery'
                    ? (
                        isArabic
                          ? 'الدفع عند الاستلام'
                          : 'Cash on delivery'
                      )
                    : order.payment_method}
                </Badge>

                <Badge>
                  {order.city}
                </Badge>
              </div>
            </article>
          )
        )}

        {!filteredOrders.length && (
          <div
            style={{
              padding: 35,
              textAlign: 'center',
              opacity: 0.55,
            }}
          >
            {isArabic
              ? 'لا توجد طلبات مطابقة'
              : 'No matching orders'}
          </div>
        )}
      </div>

      {selectedOrder && (
        <div
          style={
            overlayStyle
          }
          onMouseDown={
            (event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                setSelectedOrder(
                  null
                );
              }
            }
          }
        >
          <div
            style={{
              ...modalStyle,
              maxWidth: 720,
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
                    fontSize: 18,
                  }}
                >
                  {
                    selectedOrder.order_number
                  }
                </h2>

                <div
                  style={{
                    marginTop: 5,
                    opacity: 0.55,
                    fontSize: 10,
                  }}
                >
                  {formatDate(
                    selectedOrder.created_at
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedOrder(
                    null
                  )
                }
                style={
                  closeButton
                }
              >
                ×
              </button>
            </div>

            {detailsLoading ? (
              <div
                style={{
                  padding: 30,
                  textAlign:
                    'center',
                }}
              >
                {isArabic
                  ? 'جاري تحميل التفاصيل...'
                  : 'Loading details...'}
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: 'flex',
                    gap: 7,
                    flexWrap:
                      'wrap',
                    marginTop: 14,
                  }}
                >
                  <StatusBadge
                    status={
                      selectedOrder.status
                    }
                  >
                    {statusText(
                      selectedOrder.status
                    )}
                  </StatusBadge>

                  <Badge>
                    {paymentText(
                      selectedOrder.payment_status
                    )}
                  </Badge>

                  <Badge>
                    {money(
                      selectedOrder.total,
                      selectedOrder.currency
                    )}
                  </Badge>
                </div>

                <Section
                  title={
                    isArabic
                      ? 'بيانات العميل'
                      : 'Customer'
                  }
                >
                  <div
                    style={
                      gridTwo
                    }
                  >
                    <Info
                      label={
                        isArabic
                          ? 'الاسم'
                          : 'Name'
                      }
                      value={
                        selectedOrder.customer_name
                      }
                    />

                    <Info
                      label={
                        isArabic
                          ? 'الجوال'
                          : 'Phone'
                      }
                      value={
                        selectedOrder.customer_phone
                      }
                    />

                    <Info
                      label={
                        isArabic
                          ? 'البريد'
                          : 'Email'
                      }
                      value={
                        selectedOrder.user?.email ||
                        '-'
                      }
                    />

                    <Info
                      label={
                        isArabic
                          ? 'المدينة'
                          : 'City'
                      }
                      value={
                        selectedOrder.city
                      }
                    />
                  </div>
                </Section>

                <Section
                  title={
                    isArabic
                      ? 'عنوان التوصيل'
                      : 'Delivery Address'
                  }
                >
                  <div
                    style={{
                      lineHeight: 1.8,
                      fontSize: 11,
                    }}
                  >
                    {[
                      selectedOrder.city,
                      selectedOrder.district,
                      selectedOrder.street,
                      selectedOrder.building,
                    ]
                      .filter(Boolean)
                      .join(' - ')}

                    {selectedOrder.address_notes && (
                      <div
                        style={{
                          marginTop: 5,
                          opacity: 0.65,
                        }}
                      >
                        {
                          selectedOrder.address_notes
                        }
                      </div>
                    )}
                  </div>
                </Section>

                <Section
                  title={
                    isArabic
                      ? 'تفاصيل المبلغ'
                      : 'Financial Summary'
                  }
                >
                  <div
                    style={
                      gridTwo
                    }
                  >
                    <Info
                      label={
                        isArabic
                          ? 'المجموع'
                          : 'Subtotal'
                      }
                      value={
                        money(
                          selectedOrder.subtotal
                        )
                      }
                    />

                    <Info
                      label={
                        isArabic
                          ? 'رسوم التوصيل'
                          : 'Delivery fee'
                      }
                      value={
                        money(
                          selectedOrder.delivery_fee
                        )
                      }
                    />

                    <Info
                      label={
                        isArabic
                          ? 'الإجمالي'
                          : 'Total'
                      }
                      value={
                        money(
                          selectedOrder.total
                        )
                      }
                    />

                    <Info
                      label={
                        isArabic
                          ? 'طريقة الدفع'
                          : 'Payment'
                      }
                      value={
                        selectedOrder.payment_method ===
                        'cash_on_delivery'
                          ? (
                              isArabic
                                ? 'الدفع عند الاستلام'
                                : 'Cash on delivery'
                            )
                          : selectedOrder.payment_method
                      }
                    />
                  </div>
                </Section>

                {selectedOrder.customer_notes && (
                  <Section
                    title={
                      isArabic
                        ? 'ملاحظة العميل'
                        : 'Customer Note'
                    }
                  >
                    <div
                      style={{
                        fontSize: 11,
                        lineHeight: 1.7,
                      }}
                    >
                      {
                        selectedOrder.customer_notes
                      }
                    </div>
                  </Section>
                )}

                {Array.isArray(
                  selectedOrder.items
                ) &&
                  selectedOrder.items
                    .length > 0 && (
                    <Section
                      title={
                        isArabic
                          ? 'المنتجات'
                          : 'Items'
                      }
                    >
                      <div
                        style={{
                          display:
                            'grid',
                          gap: 8,
                        }}
                      >
                        {selectedOrder.items.map(
                          (item) => (
                            <div
                              key={
                                item.id
                              }
                              style={{
                                padding: 11,
                                borderRadius: 13,
                                background:
                                  'rgba(0,0,0,.025)',
                              }}
                            >
                              <strong
                                style={{
                                  fontSize: 11,
                                }}
                              >
                                {isArabic
                                  ? item.product_name_ar
                                  : item.product_name_en}
                              </strong>

                              <div
                                style={{
                                  marginTop: 5,
                                  opacity: 0.6,
                                  fontSize: 9,
                                }}
                              >
                                {isArabic
                                  ? `الكمية: ${item.quantity}`
                                  : `Qty: ${item.quantity}`}
                                {' · '}
                                {money(
                                  item.line_total
                                )}
                              </div>

                              {item.seller && (
                                <div
                                  style={{
                                    marginTop: 4,
                                    color: '#10985f',
                                    fontSize: 9,
                                  }}
                                >
                                  {isArabic
                                    ? item.seller.name_ar
                                    : item.seller.name_en}
                                </div>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </Section>
                  )}

                {Array.isArray(
                  selectedOrder.status_history
                ) &&
                  selectedOrder.status_history
                    .length > 0 && (
                    <Section
                      title={
                        isArabic
                          ? 'سجل الحالات'
                          : 'Status History'
                      }
                    >
                      <div
                        style={{
                          display:
                            'grid',
                          gap: 8,
                        }}
                      >
                        {selectedOrder.status_history.map(
                          (history) => (
                            <div
                              key={
                                history.id
                              }
                              style={{
                                padding: 10,
                                borderRadius: 12,
                                background:
                                  'rgba(0,0,0,.025)',
                              }}
                            >
                              <strong
                                style={{
                                  fontSize: 10,
                                }}
                              >
                                {history.from_status
                                  ? `${statusText(
                                      history.from_status
                                    )} → `
                                  : ''}
                                {statusText(
                                  history.to_status
                                )}
                              </strong>

                              {history.note && (
                                <div
                                  style={{
                                    marginTop: 4,
                                    fontSize: 9,
                                    opacity: 0.65,
                                  }}
                                >
                                  {
                                    history.note
                                  }
                                </div>
                              )}

                              <div
                                style={{
                                  marginTop: 4,
                                  fontSize: 8,
                                  opacity: 0.4,
                                }}
                              >
                                {history.changed_by?.name ||
                                  ''}
                                {' '}
                                {formatDate(
                                  history.created_at
                                )}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </Section>
                  )}

                <Section
                  title={
                    isArabic
                      ? 'تحديث حالة الطلب'
                      : 'Update Status'
                  }
                >
                  {allowedTransitions(
                    selectedOrder.status
                  ).length ? (
                    <div
                      style={{
                        display:
                          'flex',
                        flexWrap:
                          'wrap',
                        gap: 8,
                      }}
                    >
                      {allowedTransitions(
                        selectedOrder.status
                      ).map(
                        (status) => (
                          <button
                            key={
                              status
                            }
                            type="button"
                            onClick={() =>
                              openStatusAction(
                                status
                              )
                            }
                            style={
                              status ===
                              'cancelled'
                                ? dangerButton
                                : primaryButton
                            }
                          >
                            {statusText(
                              status
                            )}
                          </button>
                        )
                      )}
                    </div>
                  ) : (
                    <div
                      style={{
                        fontSize: 11,
                        opacity: 0.55,
                      }}
                    >
                      {isArabic
                        ? 'هذه حالة نهائية ولا يمكن تغييرها.'
                        : 'This is a final status.'}
                    </div>
                  )}
                </Section>
              </>
            )}
          </div>
        </div>
      )}

      {statusAction && (
        <div
          style={{
            ...overlayStyle,
            zIndex: 1100,
          }}
        >
          <form
            onSubmit={
              updateStatus
            }
            style={{
              ...modalStyle,
              maxWidth: 480,
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 18,
              }}
            >
              {isArabic
                ? 'تحديث حالة الطلب'
                : 'Update Order Status'}
            </h2>

            <div
              style={{
                marginTop: 8,
                color:
                  statusAction ===
                  'cancelled'
                    ? '#dc2626'
                    : '#10985f',
                fontWeight: 850,
              }}
            >
              {statusText(
                selectedOrder?.status
              )}
              {' → '}
              {statusText(
                statusAction
              )}
            </div>

            <label
              style={{
                display: 'grid',
                gap: 7,
                marginTop: 16,
                fontSize: 11,
                fontWeight: 750,
              }}
            >
              <span>
                {isArabic
                  ? 'ملاحظة الإدارة'
                  : 'Admin note'}
              </span>

              <textarea
                value={note}
                onChange={
                  (event) =>
                    setNote(
                      event.target.value
                    )
                }
                maxLength={1000}
                rows={5}
                placeholder={
                  isArabic
                    ? 'اختياري...'
                    : 'Optional...'
                }
                style={{
                  ...inputStyle,
                  padding: 12,
                  minHeight: 110,
                }}
              />
            </label>

            {statusAction ===
              'cancelled' && (
              <div
                style={{
                  marginTop: 12,
                  padding: 11,
                  borderRadius: 12,
                  background:
                    'rgba(220,38,38,.06)',
                  color: '#dc2626',
                  fontSize: 10,
                }}
              >
                {isArabic
                  ? 'عند إلغاء الطلب سيتم إرجاع كمية المنتجات إلى المخزون تلقائياً.'
                  : 'Cancelling restores product stock automatically.'}
              </div>
            )}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  '1fr 1fr',
                gap: 8,
                marginTop: 16,
              }}
            >
              <button
                type="submit"
                disabled={
                  saving
                }
                style={
                  statusAction ===
                  'cancelled'
                    ? dangerButton
                    : primaryButton
                }
              >
                {saving
                  ? (
                      isArabic
                        ? 'جاري الحفظ...'
                        : 'Saving...'
                    )
                  : (
                      isArabic
                        ? 'تأكيد'
                        : 'Confirm'
                    )}
              </button>

              <button
                type="button"
                disabled={
                  saving
                }
                onClick={() =>
                  setStatusAction(
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
          </form>
        </div>
      )}
    </main>
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
          fontSize: 18,
        }}
      >
        {value}
      </strong>

      <span
        style={{
          fontSize: 8,
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
        borderRadius: 12,
        background:
          'rgba(0,0,0,.025)',
      }}
    >
      <span
        style={{
          display: 'block',
          fontSize: 8,
          opacity: 0.5,
        }}
      >
        {label}
      </span>

      <strong
        style={{
          display: 'block',
          marginTop: 4,
          fontSize: 10,
          wordBreak:
            'break-word',
        }}
      >
        {value ?? '-'}
      </strong>
    </div>
  );
}

function Badge({
  children,
}) {
  return (
    <span
      style={{
        padding:
          '5px 8px',
        borderRadius: 999,
        background:
          'rgba(16,152,95,.07)',
        color: '#10985f',
        fontSize: 8,
        fontWeight: 800,
      }}
    >
      {children}
    </span>
  );
}

function StatusBadge({
  status,
  children,
}) {
  let background =
    'rgba(245,158,11,.10)';

  let color =
    '#b7791f';

  if (
    status ===
    'delivered'
  ) {
    background =
      'rgba(16,152,95,.10)';

    color =
      '#10985f';
  }

  if (
    status ===
    'cancelled'
  ) {
    background =
      'rgba(220,38,38,.08)';

    color =
      '#dc2626';
  }

  if (
    [
      'confirmed',
      'preparing',
      'out_for_delivery',
    ].includes(status)
  ) {
    background =
      'rgba(37,99,235,.08)';

    color =
      '#2563eb';
  }

  return (
    <span
      style={{
        padding:
          '6px 9px',
        borderRadius: 999,
        background,
        color,
        fontSize: 9,
        fontWeight: 850,
      }}
    >
      {children}
    </span>
  );
}

function Section({
  title,
  children,
}) {
  return (
    <section
      style={{
        marginTop: 15,
        padding: 13,
        borderRadius: 15,
        border:
          '1px solid rgba(0,0,0,.06)',
      }}
    >
      <strong
        style={{
          display: 'block',
          marginBottom: 10,
          fontSize: 12,
        }}
      >
        {title}
      </strong>

      {children}
    </section>
  );
}

const inputStyle = {
  width: '100%',
  minHeight: 44,
  boxSizing: 'border-box',
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
    '1px solid rgba(220,38,38,.18)',
  background:
    'rgba(220,38,38,.06)',
  color: '#dc2626',
  font: 'inherit',
  fontWeight: 850,
  cursor: 'pointer',
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
  padding: 18,
  borderRadius: 22,
  background:
    'var(--card, #fff)',
  color: 'inherit',
  boxShadow:
    '0 24px 70px rgba(0,0,0,.18)',
};

const closeButton = {
  border: 0,
  background:
    'transparent',
  color: 'inherit',
  fontSize: 22,
  cursor: 'pointer',
};

const gridTwo = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(2, minmax(0,1fr))',
  gap: 8,
};
import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

export default function AdminSellerApplicationsPage({
  lang = 'ar',
  api,
  showToast,
  onBack,
}) {
  const isArabic = lang === 'ar';

  const [applications, setApplications] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [search, setSearch] =
    useState('');

  const [statusFilter, setStatusFilter] =
    useState('all');

  const [reviewing, setReviewing] =
    useState(null);

  const [reviewStatus, setReviewStatus] =
    useState('approved');

  const [adminNote, setAdminNote] =
    useState('');

  const [commission, setCommission] =
    useState('10');

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    loadApplications();
  }, []);

  async function loadApplications() {
    setLoading(true);
    setError('');

    try {
      const response =
        await api.getAdminSellerApplications();

      const rows =
        Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
            ? response
            : [];

      setApplications(rows);
    } catch (err) {
      console.error(
        'Admin seller applications error:',
        err
      );

      const message =
        isArabic
          ? 'تعذر تحميل طلبات البائعين'
          : 'Could not load seller applications';

      setError(message);
      showToast?.(message);
    } finally {
      setLoading(false);
    }
  }

  const filteredApplications =
    useMemo(() => {
      const q =
        search
          .trim()
          .toLowerCase();

      return applications.filter(
        (application) => {
          const matchesStatus =
            statusFilter === 'all' ||
            application.status ===
              statusFilter;

          const haystack =
            [
              application.store_name_ar,
              application.store_name_en,
              application.phone,
              application.email,
              application.user?.name,
              application.user?.email,
              application.seller?.name_ar,
              application.seller?.name_en,
            ]
              .filter(Boolean)
              .join(' ')
              .toLowerCase();

          const matchesSearch =
            !q ||
            haystack.includes(q);

          return (
            matchesStatus &&
            matchesSearch
          );
        }
      );
    }, [
      applications,
      statusFilter,
      search,
    ]);

  const counts =
    useMemo(() => {
      return {
        all:
          applications.length,

        pending:
          applications.filter(
            (item) =>
              item.status ===
              'pending'
          ).length,

        approved:
          applications.filter(
            (item) =>
              item.status ===
              'approved'
          ).length,

        rejected:
          applications.filter(
            (item) =>
              item.status ===
              'rejected'
          ).length,
      };
    }, [applications]);

  function statusLabel(status) {
    const labels = {
      pending: {
        ar: 'قيد المراجعة',
        en: 'Pending',
      },
      approved: {
        ar: 'مقبول',
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
    if (status === 'approved') {
      return {
        background:
          'rgba(16,152,95,.10)',
        color: '#10985f',
      };
    }

    if (status === 'rejected') {
      return {
        background:
          'rgba(220,38,38,.08)',
        color: '#dc2626',
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

  function openReview(
    application,
    status
  ) {
    setReviewing(application);
    setReviewStatus(status);
    setAdminNote('');
    setCommission('10');
  }

  function closeReview() {
    if (saving) {
      return;
    }

    setReviewing(null);
    setAdminNote('');
    setCommission('10');
  }

  async function submitReview(
    event
  ) {
    event.preventDefault();

    if (
      !reviewing ||
      reviewing.status !== 'pending'
    ) {
      return;
    }

    const payload = {
      status: reviewStatus,
      admin_note:
        adminNote.trim() ||
        null,
    };

    if (
      reviewStatus ===
      'approved'
    ) {
      const value =
        Number(commission);

      if (
        Number.isNaN(value) ||
        value < 0 ||
        value > 100
      ) {
        showToast?.(
          isArabic
            ? 'نسبة العمولة يجب أن تكون بين 0 و100'
            : 'Commission must be between 0 and 100'
        );

        return;
      }

      payload.commission_percentage =
        value;
    }

    setSaving(true);

    try {
      const response =
        await api.reviewSellerApplication(
          reviewing.id,
          payload
        );

      const updated =
        response?.data ||
        response;

      setApplications(
        (current) =>
          current.map(
            (item) =>
              Number(item.id) ===
              Number(reviewing.id)
                ? {
                    ...item,
                    ...updated,
                  }
                : item
          )
      );

      showToast?.(
        reviewStatus ===
        'approved'
          ? (
              isArabic
                ? 'تم قبول طلب البائع'
                : 'Seller application approved'
            )
          : (
              isArabic
                ? 'تم رفض طلب البائع'
                : 'Seller application rejected'
            )
      );

      closeReview();

      await loadApplications();
    } catch (err) {
      console.error(
        'Seller application review error:',
        err
      );

      showToast?.(
        err?.message ||
          (
            isArabic
              ? 'تعذر مراجعة الطلب'
              : 'Could not review application'
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
          maxWidth: 900,
          margin: '0 auto',
          padding:
            '30px 16px 170px',
          textAlign: 'center',
        }}
      >
        {isArabic
          ? 'جاري تحميل طلبات البائعين...'
          : 'Loading seller applications...'}
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
        maxWidth: 900,
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
              ? 'طلبات البائعين'
              : 'Seller Applications'}
          </h1>

          <div
            style={{
              marginTop: 5,
              opacity: 0.55,
              fontSize: 12,
            }}
          >
            {isArabic
              ? 'مراجعة طلبات الانضمام كبائع'
              : 'Review seller onboarding applications'}
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
              loadApplications
            }
            style={
              secondaryButtonStyle
            }
          >
            {isArabic
              ? 'تحديث'
              : 'Refresh'}
          </button>

          {onBack && (
            <button
              type="button"
              onClick={
                onBack
              }
              style={
                secondaryButtonStyle
              }
            >
              {isArabic
                ? 'رجوع'
                : 'Back'}
            </button>
          )}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(4, minmax(0, 1fr))',
          gap: 9,
          marginBottom: 14,
        }}
      >
        <CountCard
          label={
            isArabic
              ? 'الكل'
              : 'All'
          }
          value={
            counts.all
          }
        />

        <CountCard
          label={
            isArabic
              ? 'قيد المراجعة'
              : 'Pending'
          }
          value={
            counts.pending
          }
        />

        <CountCard
          label={
            isArabic
              ? 'مقبول'
              : 'Approved'
          }
          value={
            counts.approved
          }
        />

        <CountCard
          label={
            isArabic
              ? 'مرفوض'
              : 'Rejected'
          }
          value={
            counts.rejected
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
              ? 'ابحث باسم المتجر أو البائع أو الجوال...'
              : 'Search store, seller, phone...'
          }
          style={{
            width: '100%',
            minHeight: 45,
            boxSizing: 'border-box',
            borderRadius: 13,
            border:
              '1px solid rgba(0,0,0,.09)',
            padding: '0 13px',
            background:
              'var(--card, #fff)',
            color: 'inherit',
            font: 'inherit',
            outline: 'none',
          }}
        />

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 7,
            marginTop: 10,
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
              isArabic
                ? 'قيد المراجعة'
                : 'Pending',
            ],
            [
              'approved',
              isArabic
                ? 'مقبول'
                : 'Approved',
            ],
            [
              'rejected',
              isArabic
                ? 'مرفوض'
                : 'Rejected',
            ],
          ].map(
            ([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() =>
                  setStatusFilter(
                    key
                  )
                }
                style={{
                  border:
                    statusFilter ===
                    key
                      ? '1px solid #10985f'
                      : '1px solid rgba(0,0,0,.08)',
                  background:
                    statusFilter ===
                    key
                      ? '#10985f'
                      : 'var(--card, #fff)',
                  color:
                    statusFilter ===
                    key
                      ? '#fff'
                      : 'inherit',
                  borderRadius: 999,
                  minHeight: 34,
                  padding:
                    '0 12px',
                  font: 'inherit',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            )
          )}
        </div>
      </section>

      {error && (
        <div
          style={{
            padding: 16,
            marginBottom: 14,
            borderRadius: 16,
            background:
              'rgba(220,38,38,.06)',
            color: '#dc2626',
            textAlign: 'center',
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gap: 12,
        }}
      >
        {filteredApplications.map(
          (application) => (
            <article
              key={
                application.id
              }
              style={{
                padding: 16,
                borderRadius: 20,
                background:
                  'var(--card, #fff)',
                border:
                  '1px solid rgba(0,0,0,.06)',
                boxShadow:
                  '0 8px 24px rgba(0,0,0,.025)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems:
                    'flex-start',
                  justifyContent:
                    'space-between',
                  gap: 12,
                }}
              >
                <div>
                  <strong
                    style={{
                      display: 'block',
                      fontSize: 16,
                    }}
                  >
                    {isArabic
                      ? application.store_name_ar
                      : application.store_name_en}
                  </strong>

                  <div
                    style={{
                      marginTop: 4,
                      opacity: 0.55,
                      fontSize: 10,
                    }}
                  >
                    #
                    {application.id}
                    {' · '}
                    {formatDate(
                      application.created_at
                    )}
                  </div>
                </div>

                <span
                  style={{
                    ...statusStyle(
                      application.status
                    ),
                    padding:
                      '6px 9px',
                    borderRadius: 999,
                    fontSize: 10,
                    fontWeight: 850,
                  }}
                >
                  {statusLabel(
                    application.status
                  )}
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(2, minmax(0, 1fr))',
                  gap: 9,
                  marginTop: 14,
                }}
              >
                <InfoBox
                  label={
                    isArabic
                      ? 'صاحب الطلب'
                      : 'Applicant'
                  }
                  value={
                    application.user?.name ||
                    '-'
                  }
                />

                <InfoBox
                  label={
                    isArabic
                      ? 'البريد'
                      : 'Email'
                  }
                  value={
                    application.email ||
                    application.user?.email ||
                    '-'
                  }
                />

                <InfoBox
                  label={
                    isArabic
                      ? 'الجوال'
                      : 'Phone'
                  }
                  value={
                    application.phone ||
                    '-'
                  }
                />

                <InfoBox
                  label={
                    isArabic
                      ? 'دور المستخدم'
                      : 'User role'
                  }
                  value={
                    application.user?.role ||
                    '-'
                  }
                />
              </div>

              {(application.description_ar ||
                application.description_en) && (
                <div
                  style={{
                    marginTop: 10,
                    padding: 12,
                    borderRadius: 13,
                    background:
                      'rgba(0,0,0,.025)',
                    lineHeight: 1.7,
                    fontSize: 11,
                  }}
                >
                  {isArabic
                    ? application.description_ar
                    : application.description_en}
                </div>
              )}

              {application.seller && (
                <div
                  style={{
                    marginTop: 10,
                    padding: 12,
                    borderRadius: 13,
                    background:
                      'rgba(16,152,95,.055)',
                    border:
                      '1px solid rgba(16,152,95,.10)',
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      fontSize: 9,
                      opacity: 0.55,
                    }}
                  >
                    {isArabic
                      ? 'حساب البائع'
                      : 'Seller account'}
                  </span>

                  <strong
                    style={{
                      display: 'block',
                      marginTop: 4,
                      fontSize: 11,
                      color: '#10985f',
                    }}
                  >
                    {isArabic
                      ? application.seller.name_ar
                      : application.seller.name_en}
                  </strong>
                </div>
              )}

              {application.admin_note && (
                <div
                  style={{
                    marginTop: 10,
                    padding: 12,
                    borderRadius: 13,
                    background:
                      'rgba(245,158,11,.055)',
                    border:
                      '1px solid rgba(245,158,11,.10)',
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      fontSize: 9,
                      opacity: 0.55,
                    }}
                  >
                    {isArabic
                      ? 'ملاحظة الإدارة'
                      : 'Admin note'}
                  </span>

                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 11,
                      lineHeight: 1.6,
                    }}
                  >
                    {
                      application.admin_note
                    }
                  </div>
                </div>
              )}

              {application.reviewed_at && (
                <div
                  style={{
                    marginTop: 9,
                    fontSize: 9,
                    opacity: 0.45,
                  }}
                >
                  {isArabic
                    ? 'تاريخ المراجعة: '
                    : 'Reviewed: '}
                  {formatDate(
                    application.reviewed_at
                  )}
                </div>
              )}

              {application.status ===
                'pending' && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      '1fr 1fr',
                    gap: 9,
                    marginTop: 14,
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      openReview(
                        application,
                        'approved'
                      )
                    }
                    style={{
                      minHeight: 43,
                      border: 0,
                      borderRadius: 13,
                      background:
                        '#10985f',
                      color: '#fff',
                      font: 'inherit',
                      fontWeight: 850,
                      cursor: 'pointer',
                    }}
                  >
                    {isArabic
                      ? 'قبول'
                      : 'Approve'}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      openReview(
                        application,
                        'rejected'
                      )
                    }
                    style={{
                      minHeight: 43,
                      border:
                        '1px solid rgba(220,38,38,.18)',
                      borderRadius: 13,
                      background:
                        'rgba(220,38,38,.055)',
                      color: '#dc2626',
                      font: 'inherit',
                      fontWeight: 850,
                      cursor: 'pointer',
                    }}
                  >
                    {isArabic
                      ? 'رفض'
                      : 'Reject'}
                  </button>
                </div>
              )}
            </article>
          )
        )}

        {!filteredApplications.length && (
          <div
            style={{
              padding: 35,
              textAlign: 'center',
              opacity: 0.55,
            }}
          >
            {isArabic
              ? 'لا توجد طلبات مطابقة'
              : 'No matching applications'}
          </div>
        )}
      </div>

      {reviewing && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'grid',
            placeItems: 'center',
            padding: 16,
            background:
              'rgba(0,0,0,.38)',
          }}
          onMouseDown={
            (event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                closeReview();
              }
            }
          }
        >
          <form
            onSubmit={
              submitReview
            }
            style={{
              width: '100%',
              maxWidth: 520,
              maxHeight:
                'calc(100vh - 32px)',
              overflowY: 'auto',
              borderRadius: 22,
              padding: 18,
              background:
                'var(--card, #fff)',
              color: 'inherit',
              boxShadow:
                '0 24px 70px rgba(0,0,0,.18)',
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
                <h2
                  style={{
                    margin: 0,
                    fontSize: 19,
                  }}
                >
                  {reviewStatus ===
                  'approved'
                    ? (
                        isArabic
                          ? 'قبول طلب البائع'
                          : 'Approve Seller'
                      )
                    : (
                        isArabic
                          ? 'رفض طلب البائع'
                          : 'Reject Seller'
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
                    ? reviewing.store_name_ar
                    : reviewing.store_name_en}
                </div>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={
                  closeReview
                }
                style={{
                  border: 0,
                  background:
                    'transparent',
                  color: 'inherit',
                  fontSize: 18,
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>

            {reviewStatus ===
              'approved' && (
                <label
                  style={
                    fieldStyle
                  }
                >
                  <span>
                    {isArabic
                      ? 'نسبة عمولة المنصة'
                      : 'Platform commission %'}
                  </span>

                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={
                      commission
                    }
                    onChange={
                      (event) =>
                        setCommission(
                          event.target.value
                        )
                    }
                    style={
                      inputStyle
                    }
                  />
                </label>
              )}

            <label
              style={
                fieldStyle
              }
            >
              <span>
                {isArabic
                  ? 'ملاحظة الإدارة'
                  : 'Admin note'}
              </span>

              <textarea
                value={
                  adminNote
                }
                onChange={
                  (event) =>
                    setAdminNote(
                      event.target.value
                    )
                }
                maxLength={2000}
                rows={5}
                placeholder={
                  reviewStatus ===
                  'approved'
                    ? (
                        isArabic
                          ? 'مثال: تم قبول الطلب'
                          : 'Example: Application approved'
                      )
                    : (
                        isArabic
                          ? 'اكتب سبب الرفض...'
                          : 'Write rejection reason...'
                      )
                }
                style={{
                  ...inputStyle,
                  minHeight: 110,
                  padding:
                    '12px 13px',
                  resize: 'vertical',
                }}
              />
            </label>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  '1fr 1fr',
                gap: 9,
                marginTop: 16,
              }}
            >
              <button
                type="submit"
                disabled={saving}
                style={{
                  minHeight: 46,
                  border: 0,
                  borderRadius: 13,
                  background:
                    reviewStatus ===
                    'approved'
                      ? '#10985f'
                      : '#dc2626',
                  color: '#fff',
                  font: 'inherit',
                  fontWeight: 850,
                  cursor:
                    saving
                      ? 'wait'
                      : 'pointer',
                  opacity:
                    saving
                      ? 0.65
                      : 1,
                }}
              >
                {saving
                  ? (
                      isArabic
                        ? 'جاري الحفظ...'
                        : 'Saving...'
                    )
                  : reviewStatus ===
                    'approved'
                    ? (
                        isArabic
                          ? 'تأكيد القبول'
                          : 'Confirm approval'
                      )
                    : (
                        isArabic
                          ? 'تأكيد الرفض'
                          : 'Confirm rejection'
                      )}
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={
                  closeReview
                }
                style={
                  secondaryButtonStyle
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

function CountCard({
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
          display: 'block',
          marginTop: 3,
          fontSize: 9,
          opacity: 0.55,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function InfoBox({
  label,
  value,
}) {
  return (
    <div
      style={{
        padding: 11,
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
          wordBreak:
            'break-word',
        }}
      >
        {value}
      </strong>
    </div>
  );
}

const fieldStyle = {
  display: 'grid',
  gap: 7,
  marginTop: 16,
  fontSize: 11,
  fontWeight: 750,
};

const inputStyle = {
  boxSizing: 'border-box',
  width: '100%',
  minHeight: 45,
  border:
    '1px solid rgba(0,0,0,.10)',
  borderRadius: 13,
  padding: '0 13px',
  background:
    'var(--card, #fff)',
  color: 'inherit',
  font: 'inherit',
  outline: 'none',
};

const secondaryButtonStyle = {
  minHeight: 40,
  borderRadius: 13,
  padding: '0 14px',
  border:
    '1px solid rgba(0,0,0,.10)',
  background:
    'var(--card, #fff)',
  color: 'inherit',
  font: 'inherit',
  fontWeight: 800,
  cursor: 'pointer',
};

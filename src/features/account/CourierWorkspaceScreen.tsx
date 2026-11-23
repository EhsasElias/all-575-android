import { useEffect, useRef, useState } from 'react';
import { Page } from './components/Page';
import { useTranslation } from 'react-i18next';
import { isApiError } from '@/shared/api';
import {
  courierAvailability,
  courierJobs,
  courierPickup,
  courierDeliver,
  courierFailedDelivery,
  courierRespond,
  courierProfile,
  type CourierJob,
} from './courierOperationsApi';
import { isExpiredCourierOffer } from './courierOfferTime';
import { courierFrench } from './courierFrench';
import './adminWorkspaceFamily.css';
import styles from './CourierWorkspaceScreen.module.css';

export function CourierWorkspaceScreen() {
  const { i18n } = useTranslation();
  const ar = i18n.language.startsWith('ar');
  const fr = i18n.language.startsWith('fr');
  const tr = (a: string, en: keyof typeof courierFrench) => (ar ? a : fr ? courierFrench[en] : en);
  const courierStatus = (status: string): string => {
    switch (status) {
      case 'offered':
        return tr('معروضة', 'Offered');
      case 'accepted':
        return tr('مقبولة', 'Accepted');
      case 'picked_up':
        return tr('تم الاستلام', 'Picked up');
      case 'delivered':
        return tr('تم التسليم', 'Delivered');
      case 'declined':
        return tr('مرفوضة', 'Declined');
      case 'expired':
        return tr('منتهية', 'Expired');
      default:
        return status;
    }
  };
  const [jobs, setJobs] = useState<CourierJob[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [code, setCode] = useState<Record<number, string>>({});
  const [parcels, setParcels] = useState<Record<number, string>>({});
  const [deliveryCode, setDeliveryCode] = useState<Record<number, string>>({});
  const [failureReason, setFailureReason] = useState<
    Record<number, 'customer_absent' | 'address_issue' | 'customer_refused' | 'other'>
  >({});
  const [failureDetails, setFailureDetails] = useState<Record<number, string>>({});
  const [revision, setRevision] = useState(0);
  const [online, setOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState('');
  const [filter, setFilter] = useState<'active' | 'all' | 'completed'>('active');
  // Offer expiry follows a live clock, rather than reading an impure time during React render.
  const [clockMs, setClockMs] = useState<number | null>(null);
  useEffect(() => {
    const updateClock = () => {
      setClockMs(Date.now());
    };
    const initialTick = window.setTimeout(updateClock, 0);
    const interval = window.setInterval(updateClock, 1_000);
    return () => {
      window.clearTimeout(initialTick);
      window.clearInterval(interval);
    };
  }, []);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    void courierProfile()
      .then((r) => {
        if (active) {
          setOnline(r.data.is_online);
          setApprovalStatus(r.data.approval_status);
          setProfileLoaded(true);
        }
      })
      .catch(() => {
        if (active) {
          setProfileLoaded(false);
          setError(tr('تعذر تحميل حالة توفر المندوب.', 'Unable to check courier availability.'));
        }
      });
    void courierJobs()
      .then((r) => {
        if (active) setJobs(r.data);
      })
      .catch((cause: unknown) => {
        if (active)
          setError(
            isApiError(cause) && cause.status === 403
              ? tr(
                  'حساب المندوب غير معتمد أو لا توجد صلاحية.',
                  'Courier not approved or access denied.',
                )
              : tr('تعذر تحميل المهام.', 'Unable to load courier jobs.'),
          );
      })
      .finally(() => { if (active) setLoading(false); });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revision]);
  const act = async (fn: () => Promise<unknown>, msg: string) => {
    if (busy || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await fn();
      setNotice(msg);
      setRevision((x) => x + 1);
    } catch (cause) {
      setError(
        isApiError(cause) && cause.status === 422
          ? Object.values(cause.fieldErrors).flat().join(' ') || cause.message
          : tr(
              'تعذر تنفيذ الإجراء. تأكد من صلاحية المهمة والرمز.',
              'Action failed. Check job status and code.',
            ),
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };
  const activeJobs = jobs.filter((job) => ['offered', 'accepted', 'picked_up'].includes(job.status));
  const deliveredJobs = jobs.filter((job) => job.status === 'delivered');
  const visibleJobs = filter === 'all' ? jobs : filter === 'completed' ? deliveredJobs : activeJobs;

  return (
    <Page>
      <main className={`admin-workspace-family ${styles.workspace}`} dir={ar ? 'rtl' : 'ltr'}>
        <header className={styles.hero}>
          <div>
            <span className={styles.eyebrow}>ALL 5.75 · {tr('التوصيل', 'Delivery')}</span>
            <h1>{tr('مساحة المندوب', 'Courier workspace')}</h1>
            <p>{tr('تابع العروض، واستلم الطرود برمز البائع، وأكد التسليم برمز العميل.', 'Manage offers, verify seller pickup, and confirm delivery with the customer code.')}</p>
          </div>
          <span className={styles.onlineBadge} data-online={online}>
            {profileLoaded ? (online ? tr('متصل', 'Online') : tr('غير متصل', 'Offline')) : tr('حالة الحساب غير متاحة', 'Account status unavailable')}
          </span>
        </header>
        <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.primaryButton}
          disabled={busy || loading || !profileLoaded || approvalStatus !== 'approved'}
          onClick={() =>
            void act(
              async () => {
                const next = !online;
                await courierAvailability(next);
                setOnline(next);
              },
              tr('تم تحديث التوفر.', 'Availability updated.'),
            )
          }
        >
          {online ? tr('التحويل إلى غير متصل', 'Go offline') : tr('التحويل إلى متصل', 'Go online')}
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          disabled={busy || loading}
          onClick={() => {
            setRevision((x) => x + 1);
          }}
        >
          ↻ {tr('تحديث المهام', 'Refresh jobs')}
        </button>
        </div>
        {loading && <p role="status">{tr('جارٍ تحميل المهام...', 'Loading jobs...')}</p>}
        {profileLoaded && approvalStatus !== 'approved' && <p role="alert" className={styles.error}>{tr('حساب المندوب غير معتمد بعد. لا يمكن قبول المهام قبل الاعتماد.', 'Your courier account is not approved yet. You cannot accept deliveries.')}</p>}
        <div className={styles.metrics}>
          <div><span>{tr('المهام النشطة', 'Active jobs')}</span><strong>{activeJobs.length}</strong></div>
          <div><span>{tr('المهام المكتملة', 'Completed jobs')}</span><strong>{deliveredJobs.length}</strong></div>
          <div><span>{tr('إجمالي المهام', 'Total jobs')}</span><strong>{jobs.length}</strong></div>
        </div>
        <div className={styles.filters} role="group" aria-label={tr('تصفية المهام', 'Filter jobs')}>
          <button type="button" aria-pressed={filter === 'active'} onClick={() => setFilter('active')}>{tr('النشطة', 'Active')} ({activeJobs.length})</button>
          <button type="button" aria-pressed={filter === 'completed'} onClick={() => setFilter('completed')}>{tr('المكتملة', 'Completed')} ({deliveredJobs.length})</button>
          <button type="button" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>{tr('الكل', 'All')} ({jobs.length})</button>
        </div>
        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
        {notice && <p role="status">{notice}</p>}
        {!loading && visibleJobs.length === 0 && <p className={styles.empty}>{tr('لا توجد مهام ضمن الفلتر المحدد.', 'No jobs match the selected filter.')}</p>}
        <p className={styles.hint}>{tr('الأرباح غير متاحة حتى تفعيل نظام التسويات.', 'Earnings are unavailable until settlements are enabled.')}</p>
        <div className={styles.jobGrid}>
        {visibleJobs.map((job) => (
          <section
            className={`admin-family-panel ${styles.jobCard}`}
            key={job.id}
          >
            <div className={styles.jobHeading}>
              <h2>{tr('الطلب', 'Order')} {job.order_number}</h2>
              <span className={styles.statusChip} data-status={job.status}>{courierStatus(job.status)}</span>
            </div>
            <p className={styles.hint}>{tr('الفرع', 'Branch')} #{job.branch_id} · {tr('عدد الطرود', 'Parcel count')}: {job.parcel_count ?? '—'}</p>
            {job.pickup_lat !== null && job.pickup_lng !== null && (
              <p>
                <a
                  href={
                    'https://www.google.com/maps/dir/?api=1&destination=' +
                    encodeURIComponent(String(job.pickup_lat) + ',' + String(job.pickup_lng))
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {tr('فتح الملاحة إلى نقطة الاستلام', 'Navigate to seller pickup')}
                </a>
              </p>
            )}
            {job.status === 'offered' && (
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.primaryButton}
                  disabled={busy || !online || isExpiredCourierOffer(job.expires_at, clockMs)}
                  onClick={() =>
                    void act(
                      () => courierRespond(job.id, 'accept'),
                      tr('تم قبول المهمة.', 'Job accepted.'),
                    )
                  }
                >
                  {tr('قبول', 'Accept')}
                </button>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  disabled={busy}
                  onClick={() =>
                    void act(
                      () => courierRespond(job.id, 'decline'),
                      tr('تم رفض المهمة.', 'Offer declined.'),
                    )
                  }
                >
                  {tr('رفض', 'Decline')}
                </button>
              </div>
            )}
            {job.status === 'picked_up' && (
              <div className={styles.workflow}>
                <p>
                  {tr(
                    'اطلب رمز التسليم من العميل عند الوصول، ولا تشارك رمز استلام البائع.',
                    'Ask the customer for the separate delivery code at the door.',
                  )}
                </p>
                <label>
                  {tr('رمز تأكيد التسليم من العميل', 'Customer delivery code')}
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={deliveryCode[job.id] ?? ''}
                    onChange={(e) =>
                      setDeliveryCode((prev) => ({
                        ...prev,
                        [job.id]: e.target.value.replace(/[^0-9]/g, '').slice(0, 6),
                      }))
                    }
                  />
                </label>
                <button
                  type="button"
                  disabled={busy || !/^[0-9]{6}$/.test(deliveryCode[job.id] ?? '')}
                  onClick={() =>
                    void act(
                      async () => {
                        await courierDeliver(job.id, deliveryCode[job.id] ?? '');
                        setDeliveryCode((prev) => ({ ...prev, [job.id]: '' }));
                      },
                      tr('تم توثيق التسليم للعميل.', 'Delivery verified with customer.'),
                    )
                  }
                >
                  {tr('تأكيد التسليم', 'Confirm delivery')}
                </button>
                <label>
                  {tr('سبب تعذر التسليم', 'Failed delivery reason')}
                  <select
                    value={failureReason[job.id] ?? 'customer_absent'}
                    onChange={(e) =>
                      setFailureReason((prev) => ({
                        ...prev,
                        [job.id]: e.target.value as
                          'customer_absent' | 'address_issue' | 'customer_refused' | 'other',
                      }))
                    }
                  >
                    <option value="customer_absent">
                      {tr('العميل غير متواجد', 'Customer absent')}
                    </option>
                    <option value="address_issue">{tr('مشكلة في العنوان', 'Address issue')}</option>
                    <option value="customer_refused">
                      {tr('رفض العميل الاستلام', 'Customer refused')}
                    </option>
                    <option value="other">{tr('سبب آخر', 'Other reason')}</option>
                  </select>
                </label>
                <label>
                  {tr('تفاصيل المحاولة', 'Attempt details')}
                  <textarea
                    value={failureDetails[job.id] ?? ''}
                    maxLength={1000}
                    onChange={(e) =>
                      setFailureDetails((prev) => ({ ...prev, [job.id]: e.target.value }))
                    }
                  />
                </label>
                <button
                  type="button"
                  disabled={busy || (failureDetails[job.id] ?? '').trim().length < 10}
                  onClick={() =>
                    void act(
                      () =>
                        courierFailedDelivery(
                          job.id,
                          failureReason[job.id] ?? 'customer_absent',
                          (failureDetails[job.id] ?? '').trim(),
                        ),
                      tr(
                        'تم تسجيل تعذر التسليم لدى الإدارة.',
                        'Failed delivery was reported to Admin.',
                      ),
                    )
                  }
                >
                  {tr('إبلاغ تعذر التسليم', 'Report failed delivery')}
                </button>
              </div>
            )}
            {job.status === 'delivered' && (
              <p role="status">
                {tr('تم تسليم الطلب وتوثيقه.', 'Delivery completed and verified.')}
              </p>
            )}
            {job.status === 'accepted' && (
              <div className={styles.workflow}>
                <label>
                  {tr('رمز استلام الطرد من البائع', 'Seller pickup code')}
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={code[job.id] ?? ''}
                    autoComplete="off"
                    onChange={(e) => {
                      setCode((v) => ({ ...v, [job.id]: e.target.value.replace(/[^0-9]/g, '').slice(0, 6) }));
                    }}
                  />
                </label>
                <label>
                  {tr('عدد الطرود', 'Parcel count')}
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={parcels[job.id] ?? '1'}
                    onChange={(e) => {
                      setParcels((v) => ({ ...v, [job.id]: e.target.value }));
                    }}
                  />
                </label>
                <button
                  type="button"
                  disabled={
                    busy ||
                    !/^[0-9]{6}$/.test(code[job.id] ?? '') ||
                    !Number.isInteger(Number(parcels[job.id] ?? '1')) ||
                    Number(parcels[job.id] ?? '1') < 1 ||
                    Number(parcels[job.id] ?? '1') > 500
                  }
                  onClick={() =>
                    void act(
                      () =>
                        courierPickup(job.id, code[job.id] ?? '', Number(parcels[job.id] ?? '1')),
                      tr(
                        'تم تسجيل الاستلام وتحويل الطلب إلى في الطريق.',
                        'Pickup verified; order is on the way.',
                      ),
                    )
                  }
                >
                  {tr('تأكيد الاستلام', 'Confirm pickup')}
                </button>
              </div>
            )}
          </section>
        ))}
        </div>
      </main>
    </Page>
  );
}

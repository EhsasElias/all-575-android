import { useEffect, useRef, useState } from 'react';
import { Page } from './components/Page';
import { useTranslation } from 'react-i18next';
import { isApiError } from '@/shared/api';
import {
  courierAvailability,
  courierJobs,
  courierPickup,
  courierRespond,
  courierProfile,
  type CourierJob,
} from './courierOperationsApi';
import { isExpiredCourierOffer } from './courierOfferTime';
import { courierFrench } from './courierFrench';
import './adminWorkspaceFamily.css';

export function CourierWorkspaceScreen() {
  const { i18n } = useTranslation();
  const ar = i18n.language.startsWith('ar');
  const fr = i18n.language.startsWith('fr');
  const tr = (a: string, en: keyof typeof courierFrench) => (ar ? a : fr ? courierFrench[en] : en);
  const [jobs, setJobs] = useState<CourierJob[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [code, setCode] = useState<Record<number, string>>({});
  const [parcels, setParcels] = useState<Record<number, string>>({});
  const [revision, setRevision] = useState(0);
  const [online, setOnline] = useState(false);
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
    void courierProfile()
      .then((r) => {
        if (active) setOnline(r.data.is_online);
      })
      .catch(() => {
        if (active) {
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
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revision]);
  const act = async (fn: () => Promise<unknown>, msg: string) => {
    if ((busy || busyRef.current)) return;
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
  return (
    <Page>
      <main className="admin-workspace-family" dir={ar ? 'rtl' : 'ltr'} style={{ padding: 16 }}>
        <h1>{tr('مساحة المندوب', 'Courier workspace')}</h1>
        <p>
          {tr(
            'الطلبات المسندة إليك فقط، مع التحقق من رمز استلام الطرد.',
            'Your assigned jobs, with verified seller handover.',
          )}
        </p>
        <button
          type="button"
          disabled={busy}
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
          disabled={busy}
          onClick={() => {
            setRevision((x) => x + 1);
          }}
        >
          {tr('تحديث المهام', 'Refresh jobs')}
        </button>
        {error && (
          <p role="alert" style={{ color: '#b42318' }}>
            {error}
          </p>
        )}
        {notice && <p role="status">{notice}</p>}
        {jobs.length === 0 && <p>{tr('لا توجد مهام حالياً.', 'No assigned jobs.')}</p>}
        {jobs.map((job) => (
          <section
            className="admin-family-panel"
            key={job.id}
            style={{ padding: 14, marginBlock: 12 }}
          >
            <h2>
              {tr('الطلب', 'Order')} {job.order_number}
            </h2>
            <p>
              {tr('الفرع', 'Branch')} #{job.branch_id} · {tr('الحالة', 'Status')}: {job.status}
            </p>
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
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  disabled={busy || isExpiredCourierOffer(job.expires_at, clockMs)}
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
            {job.status === 'accepted' && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                <label>
                  {tr('رمز استلام الطرد من البائع', 'Seller pickup code')}
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={code[job.id] ?? ''}
                    onChange={(e) => {
                      setCode((v) => ({ ...v, [job.id]: e.target.value }));
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
                    Number(parcels[job.id] ?? '1') < 1
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
      </main>
    </Page>
  );
}

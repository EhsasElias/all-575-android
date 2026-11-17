import { useEffect, useState } from 'react';
import { Page } from './components/Page';
import { useTranslation } from 'react-i18next';
import { isApiError } from '@/shared/api';
import { courierAvailability, courierJobs, courierPickup, courierRespond, courierProfile, courierDeliver, courierFailedDelivery, courierHistory, type CourierJob } from './courierOperationsApi';
import './adminWorkspaceFamily.css';

export function CourierWorkspaceScreen() {
  const { i18n } = useTranslation();
  const ar = i18n.language.startsWith('ar');
  const tr = (a: string, en: string) => ar ? a : en;
  const [jobs, setJobs] = useState<CourierJob[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState<Record<number, string>>({});
  const [parcels, setParcels] = useState<Record<number, string>>({});
  const [revision, setRevision] = useState(0);
  const [online, setOnline] = useState(false);
  const [deliveryCodes, setDeliveryCodes] = useState<Record<number, string>>({});
  const [failureReasons, setFailureReasons] = useState<Record<number, string>>({});
  const [history, setHistory] = useState<CourierJob[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  useEffect(() => {
    let active = true;
    void courierProfile().then(r => {if (active) setOnline(r.data.is_online);}).catch(() => {});
    void courierJobs().then(r => {if (active) setJobs(r.data);})
      .catch(cause => {
        if (active) setError(isApiError(cause) && cause.status === 403
          ? tr('حساب المندوب غير معتمد أو لا توجد صلاحية.', 'Courier not approved or access denied.')
          : tr('تعذر تحميل المهام.', 'Unable to load courier jobs.'));
      });
    return () => {active = false;};
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revision]);
  const act = async (fn: () => Promise<unknown>, msg: string) => {
    if (busy) return;
    setBusy(true); setError(''); setNotice('');
    try {await fn(); setNotice(msg); setRevision(x => x + 1);}
    catch (cause) {
      if (isApiError(cause)) {
        if (cause.status === 422) {
          setError(Object.values(cause.fieldErrors).flat().join(' ') || tr(
            'الرمز غير صحيح أو البيانات غير صالحة، تحقق وأعد المحاولة.',
            'Incorrect code or invalid details. Check and retry.'));
        } else if (cause.status === 429) {
          setError(tr('تم إيقاف المحاولات بعد تكرار الأخطاء. تواصل مع الدعم.',
            'Too many incorrect attempts. Contact support.'));
        } else if (cause.status === 409) {
          setError(tr('انتهت صلاحية الرمز أو تغيرت حالة المهمة. حدّث الصفحة.',
            'Code expired or job state changed. Refresh your jobs.'));
        } else if (cause.status === 403 || cause.status === 404) {
          setError(tr('هذه المهمة غير متاحة لحسابك.', 'This job is not available to your account.'));
        } else {
          setError(tr('تعذر تنفيذ الإجراء، تحقق من الاتصال.', 'Action failed. Check your connection.'));
        }
      } else {
        setError(tr('تعذر الاتصال بالخادم.', 'Unable to reach the server.'));
      }
    } finally {setBusy(false);}
  };
  return <Page><main className="admin-workspace-family" dir={ar ? 'rtl' : 'ltr'} style={{padding:16}}>
    <h1>{tr('مساحة المندوب', 'Courier workspace')}</h1>
    <p>{tr('الطلبات المسندة إليك فقط، مع التحقق من رمز استلام الطرد.', 'Your assigned jobs, with verified seller handover.')}</p>
    <button type="button" disabled={busy} onClick={() => void act(async () => {
      const next = !online; await courierAvailability(next); setOnline(next);
    }, tr('تم تحديث التوفر.', 'Availability updated.'))}>
      {online ? tr('التحويل إلى غير متصل', 'Go offline') : tr('التحويل إلى متصل', 'Go online')}
    </button>
    <button type="button" disabled={busy} onClick={() => setRevision(x => x + 1)}>{tr('تحديث المهام', 'Refresh jobs')}</button>
    <button type="button" disabled={busy} onClick={() => {
      setShowHistory(v => !v);
      void courierHistory().then(r => setHistory(r.data)).catch(() => setError(tr('تعذر تحميل السجل.', 'Unable to load history.')));
    }}>{tr('سجل المهام المكتملة والملغاة', 'Completed and declined job history')}</button>
    {showHistory && <section aria-label={tr('السجل', 'History')}>
      <p>{tr('الأرباح: غير مفعلة حاليًا؛ لا توجد مبالغ افتراضية.', 'Earnings: not configured; no assumed payout.')}</p>
      {history.map(h => <p key={h.id}>{h.order_number} — {h.status}</p>)}
    </section>}
    {error && <p role="alert" style={{color:'#b42318'}}>{error}</p>}
    {notice && <p role="status">{notice}</p>}
    {jobs.length === 0 && <p>{tr('لا توجد مهام حالياً.', 'No assigned jobs.')}</p>}
    {jobs.map(job => <section className="admin-family-panel" key={job.id} style={{padding:14, marginBlock:12}}>
      <h2>{tr('الطلب', 'Order')} {job.order_number}</h2>
      <p>{tr('الفرع', 'Branch')} #{job.branch_id} · {tr('الحالة', 'Status')}: {job.status}</p>
      {job.pickup_lat !== null && job.pickup_lng !== null && <p>
        <a href={'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(String(job.pickup_lat) + ',' + String(job.pickup_lng))}
          target="_blank" rel="noopener noreferrer">{tr('فتح الملاحة إلى نقطة الاستلام', 'Navigate to seller pickup')}</a>
      </p>}
      {job.status === 'offered' && <div style={{display:'flex',gap:12}}>
        <button disabled={busy || !!(job.expires_at && new Date(job.expires_at).getTime() <= Date.now())}
          onClick={() => void act(() => courierRespond(job.id, 'accept'), tr('تم قبول المهمة.', 'Job accepted.'))}>
          {tr('قبول', 'Accept')}
        </button>
        <button disabled={busy} onClick={() => void act(() => courierRespond(job.id,'decline'), tr('تم رفض المهمة.', 'Offer declined.'))}>
          {tr('رفض', 'Decline')}
        </button>
      </div>}
      {job.status === 'accepted' && <div style={{display:'flex', flexWrap:'wrap', gap:10}}>
        <label>{tr('رمز استلام الطرد من البائع', 'Seller pickup code')}
          <input type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6}
            value={code[job.id] ?? ''} onChange={e => setCode(v => ({...v,[job.id]:e.target.value}))}/>
        </label>
        <label>{tr('عدد الطرود', 'Parcel count')}
          <input type="number" min={1} max={500} value={parcels[job.id] ?? '1'}
            onChange={e => setParcels(v => ({...v,[job.id]:e.target.value}))}/>
        </label>
        <button type="button" disabled={busy || !/^[0-9]{6}$/.test(code[job.id] ?? '') || Number(parcels[job.id] ?? '1') < 1}
          onClick={() => void act(() => courierPickup(job.id, code[job.id] ?? '',Number(parcels[job.id] ?? '1')),
            tr('تم تسجيل الاستلام وتحويل الطلب إلى في الطريق.', 'Pickup verified; order is on the way.'))}>
          {tr('تأكيد الاستلام', 'Confirm pickup')}
        </button>
      </div>}
      {job.status === 'picked_up' && <div style={{display:'grid',gap:10,marginBlock:12}}>
        <label>{tr('رمز التسليم من العميل', 'Customer delivery code')}
          <input type="text" inputMode="numeric" maxLength={6} value={deliveryCodes[job.id] ?? ''}
            onChange={e => setDeliveryCodes(prev => ({...prev, [job.id]:e.target.value}))}/>
        </label>
        <button type="button" disabled={busy || !/^[0-9]{6}$/.test(deliveryCodes[job.id] ?? '')}
          onClick={() => void act(() => courierDeliver(job.id, deliveryCodes[job.id] ?? ''),
            tr('تم التحقق من التسليم وتحديث حالة الطلب.', 'Delivery verified; order status updated.'))}>
          {tr('تأكيد التسليم برمز العميل', 'Confirm delivery with customer code')}
        </button>
        <label>{tr('تعذر التسليم', 'Failed delivery')}
          <select value={failureReasons[job.id] ?? ''} onChange={e => setFailureReasons(prev => ({...prev,[job.id]:e.target.value}))}>
            <option value="">{tr('اختر السبب', 'Choose a reason')}</option>
            <option value="customer_absent">{tr('العميل غير موجود', 'Customer absent')}</option>
            <option value="address_issue">{tr('مشكلة في العنوان', 'Address issue')}</option>
            <option value="customer_refused">{tr('رفض الاستلام', 'Customer refused')}</option>
            <option value="return_required">{tr('يتطلب إرجاع', 'Return required')}</option>
            <option value="other">{tr('سبب آخر', 'Other')}</option>
          </select>
        </label>
        <button type="button" disabled={busy || !failureReasons[job.id]} onClick={() =>
          void act(() => courierFailedDelivery(job.id, failureReasons[job.id] ?? ''),
            tr('تم تسجيل المحاولة وإبلاغ الإدارة، ولم يتم اعتبار الطلب مُسلّمًا.', 'Attempt recorded for Admin review; order remains undelivered.'))}>
          {tr('تسجيل تعذر التسليم', 'Record failed delivery')}
        </button>
      </div>}
    </section>)}
  </main></Page>;
}

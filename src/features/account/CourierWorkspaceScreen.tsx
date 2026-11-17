import { useEffect, useState } from 'react';
import { Page } from './components/Page';
import { useTranslation } from 'react-i18next';
import { isApiError } from '@/shared/api';
import { courierAvailability, courierJobs, courierPickup, courierRespond, courierProfile, courierDeliver, courierDeliveryFailed, type CourierJob } from './courierOperationsApi';
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
  const [deliveryCode, setDeliveryCode] = useState<Record<number, string>>({});
  const [failedReason, setFailedReason] = useState<Record<number, string>>({});
  const [failedDetails, setFailedDetails] = useState<Record<number, string>>({});
  const [revision, setRevision] = useState(0);
  const [online, setOnline] = useState(false);
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
      setError(isApiError(cause) && cause.status === 422
        ? Object.values(cause.fieldErrors).flat().join(' ') || cause.message
        : tr('تعذر تنفيذ الإجراء. تأكد من صلاحية المهمة والرمز.', 'Action failed. Check job status and code.'));
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
    {error && <p role="alert" style={{color:'#b42318'}}>{error}</p>}
    {notice && <p role="status">{notice}</p>}
    <p>{tr('الأرباح: غير متاحة حتى تفعيل إعدادات المستحقات الفعلية.', 'Earnings: not available until verified payout configuration is enabled.')}</p>
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
      {job.status === 'picked_up' && <div style={{display:'grid', gap:12, maxWidth:520}}>
        <strong>{tr('تأكيد التسليم للعميل', 'Customer delivery verification')}</strong>
        <label>{tr('رمز العميل (مختلف عن رمز الاستلام من البائع)', 'Customer code (different from seller pickup code)')}
          <input type="text" inputMode="numeric" pattern="[0-9]{4,8}" maxLength={8}
            value={deliveryCode[job.id] ?? ''}
            onChange={e => setDeliveryCode(v => ({...v, [job.id]: e.target.value}))}/>
        </label>
        <button disabled={busy || !/^[0-9]{4,8}$/.test(deliveryCode[job.id] ?? '')}
          type="button" onClick={() => void act(() => courierDeliver(job.id,deliveryCode[job.id] ?? ''),
            tr('تم تأكيد التسليم.', 'Delivery verified.'))}>{tr('تأكيد التسليم', 'Confirm delivery')}</button>
        <strong>{tr('تعذر التسليم؟', 'Unable to deliver?')}</strong>
        <label>{tr('السبب', 'Reason')}
          <select value={failedReason[job.id] ?? 'customer_absent'} onChange={e => setFailedReason(v => ({...v,[job.id]:e.target.value}))}>
            <option value="customer_absent">{tr('العميل غير موجود', 'Customer absent')}</option>
            <option value="customer_unavailable">{tr('تعذر التواصل', 'Customer unreachable')}</option>
            <option value="address_not_found">{tr('العنوان غير واضح', 'Address not found')}</option>
            <option value="return_required">{tr('يحتاج إلى إرجاع', 'Return requested')}</option>
            <option value="other">{tr('سبب آخر', 'Other')}</option>
          </select>
        </label>
        <label>{tr('تفاصيل المحاولة', 'Failure details')}
          <textarea minLength={10} maxLength={500} rows={3} value={failedDetails[job.id] ?? ''}
            onChange={e => setFailedDetails(v => ({...v,[job.id]:e.target.value}))}/>
        </label>
        <button disabled={busy || (failedDetails[job.id] ?? '').trim().length < 10}
          type="button" onClick={() => void act(() =>
            courierDeliveryFailed(job.id, failedReason[job.id] ?? 'customer_absent', (failedDetails[job.id] ?? '').trim()),
            tr('تم تسجيل تعذر التسليم للمتابعة.', 'Failed delivery recorded for follow-up.'))}>
          {tr('تسجيل تعذر التسليم', 'Report failed delivery')}
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
    </section>)}
  </main></Page>;
}

import { useEffect, useState } from 'react';
import { isApiError } from '@/shared/api';
import { adminAssignCourier, adminCouriers, adminCreateIncident, adminDailyCourierStatus,
  adminIncidents, adminPickupCode, adminUpdateIncident, adminRegisterCourier, adminCourierHistory,
  type CourierChoice, type DeliveryIncident, type DailyCourierStatus, type CourierAssignmentEvent } from './courierOperationsApi';

type Props = { orders: {id: string; order_number: string; status: string; branch_id: number; dispatch_eligible: boolean}[]; onUpdated: () => void; ar: boolean };

export function AdminCourierOperations({orders, onUpdated, ar}: Props) {
  const tr = (a: string, b: string) => ar ? a : b;
  const [couriers, setCouriers] = useState<CourierChoice[]>([]);
  const [incidents, setIncidents] = useState<DeliveryIncident[]>([]);
  const [summary, setSummary] = useState<DailyCourierStatus | null>(null);
  const [selected, setSelected] = useState('');
  const [courierId, setCourierId] = useState('');
  const [reason, setReason] = useState('');
  const [issueOrder, setIssueOrder] = useState('');
  const [issueType, setIssueType] = useState<'complaint' | 'refund' | 'delivery_issue'>('delivery_issue');
  const [description, setDescription] = useState('');
  const [issue, setIssue] = useState('');
  const [message, setMessage] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [newCourierUser, setNewCourierUser] = useState('');
  const [newCourierZone, setNewCourierZone] = useState('');
  const [newCourierVehicle, setNewCourierVehicle] = useState('motorcycle');
  const [history, setHistory] = useState<CourierAssignmentEvent[]>([]);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    void Promise.all([adminCouriers(), adminIncidents(), adminDailyCourierStatus()])
      .then(([c, i, d]) => {if (active) {setCouriers(c.data); setIncidents(i.data); setSummary(d.data);}})
      .catch(() => {if (active) setIssue(tr('تعذر تحميل عمليات التوصيل.', 'Cannot load delivery operations.'));});
    return () => {active = false;};
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  const errorText = (cause: unknown) => isApiError(cause)
    ? cause.status === 403 ? tr('لا توجد صلاحية لهذا الإجراء.', 'Not authorized for this action.')
      : cause.status === 409 ? tr('حالة الطلب لا تسمح بالإجراء أو تم تحديثه من مستخدم آخر.', 'Order state changed or action conflicts.')
      : cause.status === 422 ? Object.values(cause.fieldErrors).flat().join(' ') || cause.message
      : tr('فشل الإجراء، حاول تحديث البيانات.', 'Action failed; refresh and retry.')
    : tr('تعذر الاتصال بالخادم.', 'Connection error.');

  const act = async (action: () => Promise<unknown>, success: string) => {
    if (busy) return;
    setBusy(true); setIssue(''); setMessage('');
    try {await action(); setMessage(success); setRefresh(v => v + 1); onUpdated();}
    catch (cause) {setIssue(errorText(cause));}
    finally {setBusy(false);}
  };

  return <section id="courier-operations" className="admin-family-panel" style={{padding: 18, marginBlock: 18}}>
    <h2>{tr('إدارة التوصيل والبلاغات', 'Courier dispatch and incidents')}</h2>
    <p>{tr('يُسمح بالإسناد للطلبات المدفوعة والجاهزة فقط، وللمندوب المعتمد والمتصل.', 'Dispatch requires a paid, ready order and an approved, online courier.')}</p>
    {summary && <p>{tr('جاهزة:', 'Ready:')} {summary.ready_orders} · {tr('استلامات اليوم:', 'Picked up today:')} {summary.picked_up_today} · {tr('بلاغات مفتوحة:', 'Open incidents:')} {summary.open_incidents} · {tr('حُلّت اليوم:', 'Resolved today:')} {summary.resolved_today}</p>}
    {issue && <p role="alert" style={{color:'#b42318'}}>{issue}</p>}
    {message && <p role="status" style={{color:'#147a51'}}>{message}</p>}
    <div style={{display:'flex', flexWrap:'wrap', gap:10, alignItems:'end'}}>
      <label>{tr('الطلب الجاهز', 'Ready order')}
        <select value={selected} onChange={e => {setSelected(e.target.value); setCode('');}}>
          <option value="">{tr('اختر الطلب', 'Select order')}</option>
          {orders.filter(x => x.dispatch_eligible).map(x => <option value={x.id} key={x.id}>{x.order_number} · #{x.branch_id}</option>)}
        </select>
      </label>
      <label>{tr('المندوب', 'Courier')}
        <select value={courierId} onChange={e => setCourierId(e.target.value)}>
          <option value="">{tr('اختر المندوب', 'Select courier')}</option>
          {couriers.filter(x => x.approval_status === 'approved' && x.is_online)
            .map(x => <option key={x.id} value={x.id}>{x.name} · #{x.service_zone_id}</option>)}
        </select>
      </label>
      <label>{tr('سبب إعادة الإسناد (عند الحاجة)', 'Reassignment reason')}
        <input value={reason} maxLength={300} onChange={e => setReason(e.target.value)}/>
      </label>
      <button className="admin-family-primary" type="button" disabled={busy || !selected || !courierId}
        onClick={() => void act(() => adminAssignCourier(selected, {courier_profile_id:Number(courierId), ...(reason.trim()?{reason:reason.trim()}: {})}),
          tr('تم إرسال عرض التوصيل للمندوب.', 'Courier offer sent.'))}>{tr('إسناد / إعادة إسناد', 'Assign / reassign')}</button>
      <button className="admin-family-secondary" type="button" disabled={busy || !selected} onClick={() => {
        setCode('');
        void act(async () => {const reply = await adminPickupCode(selected); setCode(reply.data.pickup_code);},
          tr('تم إصدار رمز الاستلام.', 'Pickup code issued.'));
      }}>{tr('رمز الاستلام بعد موافقة المندوب', 'Pickup code after acceptance')}</button>
    </div>
    {code && <p role="status">{tr('رمز تسليم الطرد إلى المندوب:', 'Seller handover code:')} <strong>{code}</strong> {tr('(سري، لمدة 30 دقيقة)', '(Confidential, valid for 30 minutes)')}</p>}
    <div style={{marginBlock:12}}>
      <button type="button" disabled={!selected || busy} onClick={() => {
        setIssue('');
        void adminCourierHistory(selected).then(r => setHistory(r.data)).catch(cause => setIssue(errorText(cause)));
      }}>{tr('عرض سجل الإسناد', 'View assignment history')}</button>
      {history.length > 0 && <div className="admin-family-table" style={{overflowX:'auto'}}>
        <table><thead><tr><th>{tr('الإجراء', 'Action')}</th><th>{tr('المندوب', 'Courier')}</th>
          <th>{tr('السبب', 'Reason')}</th><th>{tr('التاريخ', 'Date')}</th></tr></thead><tbody>
          {history.map((item, i) => <tr key={i}><td>{item.action}</td>
            <td>#{item.courier_profile_id ?? '-'}</td><td>{item.reason ?? '-'}</td><td>{item.created_at}</td></tr>)}
        </tbody></table>
      </div>}
    </div>
    <hr />
    <h3>{tr('تسجيل مندوب جديد للمراجعة', 'Register courier for approval')}</h3>
    <p>{tr('يجب أن يكون للمندوب حساب نشط وموثق، ويعتمد الطلب من المدير العام.', 'Courier must have a verified, active account and requires Super Admin approval.')}</p>
    <form style={{display:'flex',flexWrap:'wrap',gap:10,alignItems:'end'}} onSubmit={e => {
      e.preventDefault();
      if (!newCourierUser || !newCourierZone) return;
      void act(() => adminRegisterCourier({user_id:Number(newCourierUser),service_zone_id:Number(newCourierZone),vehicle_type:newCourierVehicle}),
        tr('تم إرسال حساب المندوب للاعتماد.', 'Courier submitted for approval.'));
    }}>
      <label>{tr('رقم حساب المستخدم', 'User ID')}
        <input required type="number" min={1} value={newCourierUser} onChange={e => setNewCourierUser(e.target.value)}/>
      </label>
      <label>{tr('رقم منطقة الخدمة', 'Service zone ID')}
        <input required type="number" min={1} value={newCourierZone} onChange={e => setNewCourierZone(e.target.value)}/>
      </label>
      <label>{tr('وسيلة التوصيل', 'Vehicle type')}
        <select value={newCourierVehicle} onChange={e => setNewCourierVehicle(e.target.value)}>
          <option value="motorcycle">{tr('دراجة نارية', 'Motorcycle')}</option>
          <option value="car">{tr('سيارة', 'Car')}</option>
          <option value="van">{tr('فان', 'Van')}</option>
          <option value="bicycle">{tr('دراجة', 'Bicycle')}</option>
        </select>
      </label>
      <button className="admin-family-primary" disabled={busy} type="submit">{tr('إرسال للاعتماد', 'Submit for approval')}</button>
    </form>
    <hr />
    <h3>{tr('بلاغ جديد', 'New incident')}</h3>
    <form style={{display:'flex', flexWrap:'wrap', gap:10, alignItems:'end'}} onSubmit={e => {
      e.preventDefault();
      if (!issueOrder || description.trim().length < 10) return;
      void act(async () => {
        await adminCreateIncident({suborder_id:issueOrder, type:issueType, description:description.trim()});
        setDescription('');
      }, tr('تم تسجيل البلاغ.', 'Incident created.'));
    }}>
      <label>{tr('الطلب', 'Order')}
        <select value={issueOrder} onChange={e => setIssueOrder(e.target.value)} required>
          <option value="">{tr('اختر', 'Choose')}</option>
          {orders.map(x => <option value={x.id} key={x.id}>{x.order_number}</option>)}
        </select>
      </label>
      <label>{tr('نوع البلاغ', 'Incident type')}
        <select value={issueType} onChange={e => setIssueType(e.target.value as typeof issueType)}>
          <option value="delivery_issue">{tr('مشكلة توصيل', 'Delivery issue')}</option>
          <option value="complaint">{tr('شكوى', 'Complaint')}</option>
          <option value="refund">{tr('متابعة استرداد', 'Refund follow-up')}</option>
        </select>
      </label>
      <label>{tr('الوصف', 'Description')}
        <input required minLength={10} maxLength={2000} value={description} onChange={e => setDescription(e.target.value)}/>
      </label>
      <button type="submit" className="admin-family-primary" disabled={busy}>{tr('تسجيل', 'Record')}</button>
    </form>
    <h3>{tr('متابعة البلاغات', 'Incident tracking')}</h3>
    <div className="admin-family-table" style={{overflowX:'auto'}}>
      <table><thead><tr><th>{tr('رقم البلاغ', 'Case')}</th><th>{tr('الطلب', 'Order')}</th>
        <th>{tr('النوع', 'Type')}</th><th>{tr('الحالة', 'Status')}</th><th>{tr('الإجراء', 'Action')}</th></tr></thead>
      <tbody>{incidents.map(item => <tr key={item.id}>
        <td>#{item.id}</td><td>{item.suborder_id}</td><td>{item.type}</td><td>{item.status}</td>
        <td><button disabled={busy || item.status === 'resolved'} type="button" onClick={() => {
          const resolution = window.prompt(tr('اكتب نتيجة معالجة البلاغ', 'Enter resolution'));
          if (!resolution?.trim()) return;
          void act(() => adminUpdateIncident(item.id, {status:'resolved',resolution:resolution.trim()}),
            tr('تم حل البلاغ.', 'Incident resolved.'));
        }}>{tr('حل البلاغ', 'Resolve')}</button></td>
      </tr>)}</tbody></table>
    </div>
  </section>;
}

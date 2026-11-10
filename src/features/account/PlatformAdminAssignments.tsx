import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  adminAssignments, addAdminAssignment, updateAdminAssignment,
  type PlatformAdminAccess,
} from './platformAdminApi';

const panel: React.CSSProperties = {
  padding: 14, border: '1px solid var(--color-border, #d8e1db)',
  borderRadius: 12, marginBottom: 12,
};
const wrap: React.CSSProperties = {
  display: 'flex', alignItems: 'end', flexWrap: 'wrap', gap: 10,
};

export function PlatformAdminAssignments() {
  const { i18n } = useTranslation();
  const ar = i18n.language.startsWith('ar');
  const tr = (a: string, en: string) => ar ? a : en;
  const [items, setItems] = useState<PlatformAdminAccess[]>([]);
  const [email, setEmail] = useState('');
  const [sellerId, setSellerId] = useState('');
  const [orders, setOrders] = useState(true);
  const [stock, setStock] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    void adminAssignments().then(response => {
      if (active) setItems(response.data);
    }).catch(() => { if (active) setError(tr('تعذر تحميل صلاحيات الإدارة.', 'Unable to load Admin permissions.')); });
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revision]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true); setError(''); setNotice('');
    try {
      await addAdminAssignment({
        email: email.trim(),
        seller_id: Number(sellerId),
        can_view_orders: orders,
        can_view_inventory: stock,
      });
      setEmail(''); setSellerId('');
      setNotice(tr('تم تعيين حساب الإدارة.', 'Admin account assigned.'));
      setRevision(x => x + 1);
    } catch {
      setError(tr('تعذر الإضافة. تحقق من الحساب ورقم المتجر وعدم تكرار الإسناد.', 'Assignment failed. Check the account, seller ID and existing assignments.'));
    } finally { setBusy(false); }
  };

  const change = async (id: number, input: { is_active?: boolean; can_view_orders?: boolean; can_view_inventory?: boolean }) => {
    setBusy(true); setError(''); setNotice('');
    try {
      await updateAdminAssignment(id, input);
      setNotice(tr('تم تحديث الصلاحية.', 'Permission updated.'));
      setRevision(x => x + 1);
    } catch {
      setError(tr('تعذر تحديث الصلاحية.', 'Could not update permission.'));
    } finally { setBusy(false); }
  };

  return (
    <section aria-labelledby="admin-access-heading">
      <h2 id="admin-access-heading">{tr('حسابات الإدارة والصلاحيات', 'Admin Accounts & Permissions')}</h2>
      <p>{tr('عيّن حساباً موجوداً ومفعلاً باستخدام بريده الإلكتروني ورقم المتجر.', 'Assign an existing verified account by email and seller ID.')}</p>
      <form onSubmit={save} style={panel}>
        <div style={wrap}>
          <label>{tr('البريد الإلكتروني', 'Account email')}
            <input type="email" required maxLength={255} value={email} onChange={e => setEmail(e.target.value)} />
          </label>
          <label>{tr('رقم المتجر', 'Seller ID')}
            <input type="number" required min={1} value={sellerId} onChange={e => setSellerId(e.target.value)} />
          </label>
          <label><input type="checkbox" checked={orders} onChange={e => setOrders(e.target.checked)} />
            {tr('عرض الطلبات', 'View orders')}</label>
          <label><input type="checkbox" checked={stock} onChange={e => setStock(e.target.checked)} />
            {tr('عرض المخزون', 'View inventory')}</label>
          <button type="submit" disabled={busy || (!orders && !stock)}>{tr('إضافة أدمن', 'Assign Admin')}</button>
        </div>
      </form>
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      {items.length === 0 && <p>{tr('لا توجد حسابات إدارية معينة بعد.', 'No Admin assignments yet.')}</p>}
      {items.map(item => (
        <div key={item.id} style={panel}>
          <strong>{item.name || item.email || '#' + item.user_id}</strong>
          <p style={{ margin: '8px 0', opacity: 0.8 }}>
            {item.email} · {ar ? item.seller_name_ar : item.seller_name_en} (#{item.seller_id})
          </p>
          <div style={wrap}>
            <label><input type="checkbox" disabled={busy} checked={item.can_view_orders}
              onChange={e => void change(item.id, { can_view_orders: e.target.checked })} />
              {tr('الطلبات', 'Orders')}</label>
            <label><input type="checkbox" disabled={busy} checked={item.can_view_inventory}
              onChange={e => void change(item.id, { can_view_inventory: e.target.checked })} />
              {tr('المخزون', 'Inventory')}</label>
            <button type="button" disabled={busy} onClick={() => void change(item.id, { is_active: !item.is_active })}>
              {item.is_active ? tr('تعطيل', 'Deactivate') : tr('تفعيل', 'Activate')}
            </button>
          </div>
        </div>
      ))}
    </section>
  );
}

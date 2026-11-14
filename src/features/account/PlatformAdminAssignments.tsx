import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  adminAssignments, adminSellerChoices, addAdminAssignment, updateAdminAssignment,
  type PlatformAdminAccess, type AdminSellerChoice,
} from './platformAdminApi';
import styles from './PlatformAdminAssignments.module.css';

export function PlatformAdminAssignments() {
  const { i18n } = useTranslation();
  const ar = i18n.language.startsWith('ar');
  const tr = (a: string, en: string) => ar ? a : en;
  const [items, setItems] = useState<PlatformAdminAccess[]>([]);
  const [sellerChoices, setSellerChoices] = useState<AdminSellerChoice[]>([]);
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

  useEffect(() => {
    let active = true;
    void adminSellerChoices().then(response => {
      if (active) setSellerChoices(response.data);
    }).catch(() => { if (active) setSellerChoices([]); });
    return () => { active = false; };
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
    <section aria-labelledby="admin-access-heading" className={styles.section}>
      <header className={styles.header}>
        <div>
          <h2 id="admin-access-heading">{tr('حسابات الإدارة والصلاحيات', 'Admin Accounts & Permissions')}</h2>
          <p>{tr('إدارة صلاحيات حسابات الإدارة الموجودة والمفعلة.', 'Assign and manage access for existing verified accounts.')}</p>
        </div>
        <button type="button" onClick={() => setRevision(x => x + 1)} disabled={busy} className={styles.refresh}>↻ {tr('تحديث', 'Refresh')}</button>
      </header>
      {error && <p role="alert" className={styles.error}>{error}</p>}
      {notice && <p role="status" className={styles.success}>{notice}</p>}
      <div className={styles.layout}>
        <form onSubmit={save} className={styles.form}>
          <label className={styles.field}>
            <span>{tr('البريد الإلكتروني للحساب', 'Account email')} *</span>
            <input type="email" required maxLength={255} placeholder={tr('أدخل بريد الإداري', 'Enter admin email')} value={email} onChange={e => setEmail(e.target.value)} />
          </label>
          {sellerChoices.length > 0 && (
            <label className={styles.field}>
              <span>{tr('اختر البائع', 'Select seller')} *</span>
              <select className={styles.sellerSelect} aria-label={tr('اختر البائع', 'Select seller')} required value={sellerId} onChange={e => setSellerId(e.target.value)}>
                <option value="">{tr('اختر المتجر...', 'Choose a seller...')}</option>
                {sellerChoices.map(seller => (
                  <option key={seller.id} value={seller.id}>{ar ? seller.name_ar : seller.name_en} (#{seller.id})</option>
                ))}
              </select>
            </label>
          )}
          {sellerChoices.length === 0 && (
            <label className={styles.field}>
              <span>{tr('رقم البائع', 'Seller ID')} *</span>
              <input type="number" required min={1} step={1} placeholder={tr('رقم البائع الموجود', 'Existing seller ID')} value={sellerId} onChange={e => setSellerId(e.target.value)} />
            </label>
          )}
          <div className={styles.permissions} role="group" aria-label={tr('الصلاحيات', 'Permissions')}>
            <label><input type="checkbox" checked={orders} onChange={e => setOrders(e.target.checked)} />{tr('عرض الطلبات', 'View orders')}</label>
            <label><input type="checkbox" checked={stock} onChange={e => setStock(e.target.checked)} />{tr('عرض المخزون', 'View inventory')}</label>
          </div>
          <button type="submit" className={styles.submit} disabled={busy || (!orders && !stock)}>{busy ? tr('جارٍ الحفظ...', 'Saving...') : tr('تعيين إداري', 'Assign Admin')}</button>
        </form>
        <div className={styles.list}>
          <h3>{tr('الإسنادات الحالية', 'Existing Admin Assignments')} ({items.length})</h3>
          {items.length === 0 && <p>{tr('لا توجد حسابات إدارية معينة بعد.', 'No Admin assignments yet.')}</p>}
          {items.length > 0 && <div className={styles.tableScroll}>
            <table>
              <thead><tr>
                <th scope="col">{tr('الحساب', 'Account')}</th>
                <th scope="col">{tr('البائع', 'Seller')}</th>
                <th scope="col">{tr('الصلاحيات', 'Permissions')}</th>
                <th scope="col">{tr('الحالة', 'Status')}</th>
                <th scope="col">{tr('الإجراءات', 'Actions')}</th>
              </tr></thead>
              <tbody>{items.map(item => <tr key={item.id}>
                <td><strong>{item.name || item.email || '#' + item.user_id}</strong><div className={styles.muted}>{item.email}</div></td>
                <td>{(ar ? item.seller_name_ar : item.seller_name_en) || '#' + item.seller_id} (#{item.seller_id})</td>
                <td><div className={styles.permissions}>
                  <label><input type="checkbox" disabled={busy} checked={item.can_view_orders} onChange={e => void change(item.id, { can_view_orders: e.target.checked })} />{tr('الطلبات', 'Orders')}</label>
                  <label><input type="checkbox" disabled={busy} checked={item.can_view_inventory} onChange={e => void change(item.id, { can_view_inventory: e.target.checked })} />{tr('المخزون', 'Inventory')}</label>
                </div></td>
                <td><span className={item.is_active ? styles.active : styles.inactive}>{item.is_active ? tr('نشط', 'Active') : tr('موقوف', 'Inactive')}</span></td>
                <td><button type="button" className={styles.action} disabled={busy} onClick={() => void change(item.id, { is_active: !item.is_active })}>{item.is_active ? tr('تعطيل', 'Deactivate') : tr('تفعيل', 'Activate')}</button></td>
              </tr>)}</tbody>
            </table>
          </div>}
        </div>
      </div>
    </section>
  );
}

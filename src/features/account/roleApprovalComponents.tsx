import type { PendingRoleApplication, DeliveryZoneChoice } from './roleApplicationsApi';
import type { AdminSellerChoice } from './platformAdminApi';

type Translate = (a: string, en: string, fr: string) => string;

export function RoleApplicationTable({
  items, tr, begin,
}: {
  items: PendingRoleApplication[];
  tr: Translate;
  begin: (id: number) => void;
}) {
  return (
        <div className="admin-family-table" style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>{tr('الاسم', 'Name', 'Nom')}</th>
                <th>{tr('البريد الإلكتروني', 'Email', 'E-mail')}</th>
                <th>{tr('النوع', 'Role', 'Rôle')}</th>
                <th>{tr('الجوال', 'Phone', 'Téléphone')}</th>
                <th>{tr('المدينة', 'City', 'Ville')}</th>
                <th>{tr('المؤهل / المنطقة', 'Qualification / area', 'Qualification / zone')}</th>
                <th>{tr('المركبة', 'Vehicle', 'Véhicule')}</th>
                <th>{tr('سبب التقديم', 'Motivation', 'Motivation')}</th>
                <th>{tr('الحالة', 'Status', 'Statut')}</th>
                <th>{tr('الإجراء', 'Action', 'Action')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.email}</td>
                  <td>
                    {item.requested_role === 'admin'
                      ? tr('إدارة', 'Admin', 'Administrateur')
                      : tr('توصيل', 'Courier', 'Livreur')}
                  </td>
                  <td dir="ltr">{item.contact_phone ?? '—'}</td>
                  <td>{item.city ?? '—'}</td>
                  <td>
                    {item.requested_role === 'admin'
                      ? (item.qualification ?? '—')
                      : (item.service_area ?? '—')}
                  </td>
                  <td>{item.vehicle_type ?? '—'}</td>
                  <td style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                    {item.motivation}
                  </td>
                  <td>
                    {item.activated
                      ? tr('مفعّل', 'Activated', 'Activé')
                      : item.status === 'approved'
                        ? tr(
                            'معتمد بانتظار التفعيل',
                            'Approved; awaiting activation',
                            'Approuvé ; activation en attente',
                          )
                        : tr('قيد المراجعة', 'Pending review', 'En attente')}
                  </td>
                  <td>
                    {item.activated ? (
                      '✓'
                    ) : (
                      <button
                        type="button"
                        className="admin-family-secondary"
                        onClick={() => { begin(item.id); }}
                      >
                        {item.status === 'approved'
                          ? tr('تفعيل الصلاحية', 'Activate access', 'Activer')
                          : tr('مراجعة الطلب', 'Review', 'Examiner')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
  );
}

export function RoleApplicationDecision({
  selected, tr, ar, note, setNote, busy, decide, activate, sellers, zones,
  sellerId, setSellerId, zoneId, setZoneId, orders, setOrders, inventory, setInventory, close,
}: {
  selected: PendingRoleApplication;
  tr: Translate;
  ar: boolean;
  note: string;
  setNote: (value: string) => void;
  busy: boolean;
  decide: (decision: 'approved' | 'rejected') => Promise<void>;
  activate: () => Promise<void>;
  sellers: AdminSellerChoice[];
  zones: DeliveryZoneChoice[];
  sellerId: string;
  setSellerId: (value: string) => void;
  zoneId: string;
  setZoneId: (value: string) => void;
  orders: boolean;
  setOrders: (value: boolean) => void;
  inventory: boolean;
  setInventory: (value: boolean) => void;
  close: () => void;
}) {
  return (
        <section
          className="admin-family-panel"
          aria-label={tr('مراجعة الطلب', 'Review application', 'Examiner')}
          style={{ padding: 16, marginBlock: 16 }}
        >
          <h3>
            {selected.name} — #{selected.id}
          </h3>
          {selected.status === 'pending' ? (
            <>
              <label style={{ display: 'grid', gap: 8, marginBlock: 12 }}>
                {tr('ملاحظة / سبب الرفض', 'Note / rejection reason', 'Note / motif du refus')}
                <textarea
                  rows={3}
                  maxLength={1000}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                <button
                  type="button"
                  className="admin-family-primary"
                  disabled={busy}
                  onClick={() => void decide('approved')}
                >
                  {tr('موافقة', 'Approve', 'Approuver')}
                </button>
                <button
                  type="button"
                  className="admin-family-secondary"
                  disabled={busy || !note.trim()}
                  onClick={() => void decide('rejected')}
                >
                  {tr('رفض', 'Reject', 'Refuser')}
                </button>
              </div>
            </>
          ) : (
            <>
              {selected.requested_role === 'admin' ? (
                <>
                  <label style={{ display: 'grid', gap: 8, marginBlock: 12 }}>
                    {tr('المتجر الذي سيُسند إليه المسؤول', 'Assigned seller', 'Vendeur attribué')}
                    <select
                      value={sellerId}
                      onChange={(event) => setSellerId(event.target.value)}
                      required
                    >
                      <option value="">
                        {tr('اختر المتجر', 'Select seller', 'Choisir un vendeur')}
                      </option>
                      {sellers.map((seller) => (
                        <option key={seller.id} value={seller.id}>
                          {ar ? seller.name_ar : seller.name_en} (#{seller.id})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={orders}
                      onChange={(event) => setOrders(event.target.checked)}
                    />{' '}
                    {tr('عرض الطلبات', 'View orders', 'Voir les commandes')}
                  </label>
                  <label style={{ marginInlineStart: 12 }}>
                    <input
                      type="checkbox"
                      checked={inventory}
                      onChange={(event) => setInventory(event.target.checked)}
                    />{' '}
                    {tr('عرض المخزون', 'View inventory', 'Voir le stock')}
                  </label>
                </>
              ) : (
                <label style={{ display: 'grid', gap: 8, marginBlock: 12 }}>
                  {tr('منطقة التوصيل', 'Delivery zone', 'Zone de livraison')}
                  <select
                    value={zoneId}
                    onChange={(event) => setZoneId(event.target.value)}
                    required
                  >
                    <option value="">
                      {tr('اختر المنطقة', 'Select zone', 'Choisir une zone')}
                    </option>
                    {zones.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {ar ? zone.name_ar : zone.name_en} (#{zone.id})
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <p>
                {tr(
                  'سيُنشأ الإسناد للمستخدم المعتمد فقط بعد اختيار النطاق.',
                  'Only the approved applicant receives access to the selected scope.',
                  'Seul le candidat approuvé recevra cet accès.',
                )}
              </p>
              <button
                type="button"
                className="admin-family-primary"
                disabled={
                  busy ||
                  (selected.requested_role === 'admin'
                    ? !sellerId || (!orders && !inventory)
                    : !zoneId)
                }
                onClick={() => void activate()}
              >
                {tr('تفعيل الحساب', 'Activate account', 'Activer le compte')}
              </button>
            </>
          )}
          <button
            type="button"
            className="admin-family-secondary"
            style={{ marginInlineStart: 10 }}
            disabled={busy}
            onClick={close}
          >
            {tr('إلغاء', 'Cancel', 'Annuler')}
          </button>
        </section>
  );
}

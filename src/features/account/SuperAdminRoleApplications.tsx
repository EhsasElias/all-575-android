import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { isApiError } from '@/shared/api';
import { adminSellerChoices, type AdminSellerChoice } from './platformAdminApi';
import {
  activateRoleApplication,
  decideRoleApplication,
  reviewRoleApplications,
  superAdminDeliveryZones,
  type DeliveryZoneChoice,
  type PendingRoleApplication,
  type RequestedRole,
} from './roleApplicationsApi';

export function SuperAdminRoleApplications() {
  const { i18n } = useTranslation();
  const { hash } = useLocation();
  const ar = i18n.language.startsWith('ar');
  const fr = i18n.language.startsWith('fr');
  const tr = (a: string, e: string, f: string) => (ar ? a : fr ? f : e);
  const role: RequestedRole | null =
    hash === '#admin-applications' ? 'admin' : hash === '#courier-applications' ? 'courier' : null;
  const [items, setItems] = useState<PendingRoleApplication[]>([]);
  const [sellers, setSellers] = useState<AdminSellerChoice[]>([]);
  const [zones, setZones] = useState<DeliveryZoneChoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [revision, setRevision] = useState(0);
  const [decisionId, setDecisionId] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [sellerId, setSellerId] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [orders, setOrders] = useState(true);
  const [inventory, setInventory] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    // Optional lookup failures must never hide the applications themselves.
    void Promise.allSettled([reviewRoleApplications(), adminSellerChoices(), superAdminDeliveryZones()])
      .then(([applications, sellerOptions, zoneOptions]) => {
        if (!active) return;
        if (applications.status === 'rejected') {
          throw applications.reason;
        }
        setItems(applications.value.data);
        setSellers(sellerOptions.status === 'fulfilled'
          ? sellerOptions.value.data.filter((item) => item.status === 'approved')
          : []);
        setZones(zoneOptions.status === 'fulfilled' ? zoneOptions.value.data : []);
        setError('');
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(
          isApiError(cause)
            ? tr(
                'تعذر تحميل طلبات الانضمام أو الخيارات.',
                'Unable to load applications or options.',
                'Impossible de charger les candidatures ou les options.',
              ) + ` (HTTP ${cause.status})`
            : tr(
                'تعذر الاتصال بالخادم.',
                'Could not connect to the server.',
                'Connexion au serveur impossible.',
              ),
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revision]);

  const selected = items.find((item) => item.id === decisionId);
  const visible = role ? items.filter((item) => item.requested_role === role) : items;
  const refresh = () => {
    setLoading(true);
    setRevision((current) => current + 1);
  };
  const begin = (id: number) => {
    setDecisionId(id);
    setNote('');
    setSellerId('');
    setZoneId('');
    setOrders(true);
    setInventory(false);
    setError('');
    setNotice('');
  };
  const decide = async (decision: 'approved' | 'rejected') => {
    if (decisionId === null || busy || (decision === 'rejected' && !note.trim())) return;
    setBusy(true);
    setError('');
    try {
      await decideRoleApplication(decisionId, decision, note.trim());
      setDecisionId(null);
      setNote('');
      setNotice(
        tr(
          'تم حفظ قرار المراجعة. التفعيل يتطلب تحديد المتجر أو منطقة التوصيل.',
          'Review saved. Activation requires a seller or delivery zone.',
          'Décision enregistrée. L’activation nécessite un vendeur ou une zone.',
        ),
      );
      refresh();
    } catch (cause) {
      setError(
        isApiError(cause)
          ? tr('فشل تسجيل القرار.', 'Review decision failed.', 'Échec de la décision.') +
              ` (HTTP ${cause.status})`
          : tr('تعذر الاتصال بالخادم.', 'Connection failed.', 'Connexion impossible.'),
      );
    } finally {
      setBusy(false);
    }
  };
  const activate = async () => {
    if (selected?.status !== 'approved' || busy) return;
    if (selected.requested_role === 'admin' && (!sellerId || (!orders && !inventory))) return;
    if (selected.requested_role === 'courier' && !zoneId) return;
    setBusy(true);
    setError('');
    try {
      await activateRoleApplication(
        selected.id,
        selected.requested_role === 'admin'
          ? { seller_id: Number(sellerId), can_view_orders: orders, can_view_inventory: inventory }
          : { service_zone_id: Number(zoneId) },
      );
      setDecisionId(null);
      setNotice(
        tr(
          'تم تفعيل صلاحية العمل وإشعار صاحب الطلب.',
          'Workspace access activated and applicant notified.',
          'Accès activé et candidat informé.',
        ),
      );
      refresh();
    } catch (cause) {
      setError(
        isApiError(cause)
          ? tr(
              'تعذر التفعيل. تحقق من صلاحيات المستخدم والخيارات.',
              'Activation failed. Verify user eligibility and selections.',
              'Activation impossible. Vérifiez le compte et les options.',
            ) + ` (HTTP ${cause.status})`
          : tr('تعذر الاتصال بالخادم.', 'Connection failed.', 'Connexion impossible.'),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      id="role-applications"
      className="admin-family-panel"
      style={{ padding: 16, marginBlock: 18 }}
    >
      <span id="admin-applications" style={{ display: 'block', scrollMarginTop: 20 }} />
      <span id="courier-applications" style={{ display: 'block', scrollMarginTop: 20 }} />
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h2>
            {role === 'admin'
              ? tr('اعتماد طلبات الإدارة', 'Admin applications', 'Candidatures administrateur')
              : role === 'courier'
                ? tr('طلبات انضمام المندوبين', 'Courier applications', 'Candidatures livreur')
                : tr(
                    'طلبات الانضمام للإدارة والتوصيل',
                    'Admin & courier applications',
                    'Candidatures administrateur et livreur',
                  )}
          </h2>
          <p>
            {tr(
              'الموافقة على الطلب لا تُفعّل الصلاحيات تلقائيًا؛ التفعيل إجراء منفصل ومحدد النطاق.',
              'Application approval is separate from activating scoped workspace access.',
              'La validation et l’activation des accès sont distinctes.',
            )}
          </p>
        </div>
        <button
          type="button"
          className="admin-family-primary"
          onClick={refresh}
          disabled={loading || busy}
        >
          ↻ {tr('تحديث', 'Refresh', 'Actualiser')}
        </button>
      </header>
      {loading && <p role="status">{tr('جارٍ التحميل...', 'Loading...', 'Chargement...')}</p>}
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      {!loading && !error && visible.length === 0 && (
        <p>
          {tr(
            'لا توجد طلبات بانتظار إجراء.',
            'No applications awaiting action.',
            'Aucune candidature en attente.',
          )}
        </p>
      )}
      {!loading && visible.length > 0 && (
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
              {visible.map((item) => (
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
      )}
      {selected && !selected.activated && (
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
            onClick={() => setDecisionId(null)}
          >
            {tr('إلغاء', 'Cancel', 'Annuler')}
          </button>
        </section>
      )}
    </section>
  );
}

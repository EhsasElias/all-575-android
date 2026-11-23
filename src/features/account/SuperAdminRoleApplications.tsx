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
import { RoleApplicationTable, RoleApplicationDecision } from './roleApprovalComponents';

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
    void Promise.allSettled([
      reviewRoleApplications(),
      adminSellerChoices(),
      superAdminDeliveryZones(),
    ])
      .then(([applications, sellerOptions, zoneOptions]) => {
        if (!active) return;
        if (applications.status === 'rejected') {
          throw applications.reason;
        }
        setItems(applications.value.data);
        setSellers(
          sellerOptions.status === 'fulfilled'
            ? sellerOptions.value.data.filter((item) => item.status === 'approved')
            : [],
        );
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
        <RoleApplicationTable items={visible} tr={tr} begin={begin} />
      )}
      {selected && !selected.activated && (
        <RoleApplicationDecision
          selected={selected}
          tr={tr}
          ar={ar}
          note={note}
          setNote={setNote}
          busy={busy}
          decide={decide}
          activate={activate}
          sellers={sellers}
          zones={zones}
          sellerId={sellerId}
          setSellerId={setSellerId}
          zoneId={zoneId}
          setZoneId={setZoneId}
          orders={orders}
          setOrders={setOrders}
          inventory={inventory}
          setInventory={setInventory}
          close={() => {
            setDecisionId(null);
          }}
        />
      )}
    </section>
  );
}

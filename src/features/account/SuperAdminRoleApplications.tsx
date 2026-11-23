import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { reviewRoleApplications, type PendingRoleApplication } from './roleApplicationsApi';

export function SuperAdminRoleApplications() {
  const { i18n } = useTranslation();
  const ar = i18n.language.startsWith('ar');
  const fr = i18n.language.startsWith('fr');
  const tr = (a: string, e: string, f: string) => ar ? a : fr ? f : e;
  const [items, setItems] = useState<PendingRoleApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    void reviewRoleApplications()
      .then((result) => setItems(result.data))
      .catch(() => setError(tr(
        'تعذر تحميل طلبات الانضمام.',
        'Unable to load role applications.',
        'Impossible de charger les candidatures.',
      )))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;
    void reviewRoleApplications()
      .then((result) => { if (active) setItems(result.data); })
      .catch(() => {
        if (active) setError(tr(
          'تعذر تحميل طلبات الانضمام.',
          'Unable to load role applications.',
          'Impossible de charger les candidatures.',
        ));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
    // Reload only when the panel is mounted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section id="role-applications" className="admin-family-panel" style={{ padding: 16, marginBlock: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2>{tr('طلبات الانضمام للإدارة والتوصيل', 'Admin & courier applications', 'Candidatures administrateur et livreur')}</h2>
          <p>{tr(
            'طلبات العملاء الموثقين بانتظار مراجعة السوبر أدمن. لا يمنح إرسال الطلب أي صلاحيات.',
            'Verified customers waiting for Super Admin review. Applying does not grant access.',
            'Demandes en attente de revue. Une candidature ne confère aucun accès.',
          )}</p>
        </div>
        <button type="button" onClick={load} disabled={loading}>
          {tr('تحديث', 'Refresh', 'Actualiser')}
        </button>
      </div>
      {loading && <p role="status">{tr('جارٍ تحميل الطلبات...', 'Loading applications...', 'Chargement des demandes...')}</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p>{tr('لا توجد طلبات معلقة.', 'No pending applications.', 'Aucune candidature en attente.')}</p>
      )}
      {!loading && items.length > 0 && (
        <div className="admin-family-table" style={{ overflowX: 'auto' }}>
          <table>
            <thead><tr>
              <th>{tr('الاسم', 'Name', 'Nom')}</th>
              <th>{tr('البريد الإلكتروني', 'Email', 'E-mail')}</th>
              <th>{tr('نوع الطلب', 'Requested role', 'Rôle demandé')}</th>
              <th>{tr('الجوال', 'Phone', 'Téléphone')}</th>
              <th>{tr('المدينة', 'City', 'Ville')}</th>
              <th>{tr('سنوات الخبرة', 'Experience', 'Expérience')}</th>
              <th>{tr('المؤهل / المنطقة', 'Qualification / area', 'Qualification / zone')}</th>
              <th>{tr('وسيلة التوصيل', 'Vehicle', 'Véhicule')}</th>
              <th>{tr('سبب التقديم', 'Motivation', 'Motivation')}</th>
              <th>{tr('تاريخ الطلب', 'Submitted', 'Date')}</th>
              <th>{tr('الحالة', 'Status', 'Statut')}</th>
            </tr></thead>
            <tbody>{items.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.email}</td>
                <td>{item.requested_role === 'admin'
                  ? tr('مسؤول', 'Admin', 'Administrateur')
                  : tr('مندوب توصيل', 'Courier', 'Livreur')}</td>
                <td dir="ltr">{item.contact_phone ?? '—'}</td>
                <td>{item.city ?? '—'}</td>
                <td>{item.experience_years ?? '—'}</td>
                <td>{item.requested_role === 'admin' ? (item.qualification ?? '—') : (item.service_area ?? '—')}</td>
                <td>{item.vehicle_type ?? '—'}{item.vehicle_plate_number ? ` · ${item.vehicle_plate_number}` : ''}</td>
                <td style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{item.motivation}</td>
                <td>{new Date(item.created_at).toLocaleString(ar ? 'ar-SA' : fr ? 'fr-FR' : 'en-GB')}</td>
                <td>{tr('قيد المراجعة', 'Pending review', 'En attente')}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      <p>{tr(
        'منح صلاحيات المسؤول يتم من إدارة المسؤولين، واعتماد المندوب من قسم اعتماد المندوبين بعد استكمال بياناته.',
        'Assign admin permissions in Admin assignments, or approve an eligible courier in Courier approvals after their profile is set up.',
        'Attribuez les droits administrateur ou approuvez un livreur après la configuration de son profil.',
      )}</p>
    </section>
  );
}

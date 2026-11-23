import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { decideRoleApplication, reviewRoleApplications, reviewServiceZones, type ServiceZoneChoice, type PendingRoleApplication } from './roleApplicationsApi';

export function SuperAdminRoleApplications() {
  const { i18n } = useTranslation();
  const ar = i18n.language.startsWith('ar');
  const fr = i18n.language.startsWith('fr');
  const tr = (a: string, e: string, f: string) => ar ? a : fr ? f : e;
  const [items, setItems] = useState<PendingRoleApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [decisionId, setDecisionId] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [zones, setZones] = useState<ServiceZoneChoice[]>([]);
  const selectedApplication = items.find((item) => item.id === decisionId);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const load = () => {
    setNotice('');
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

  const decide = async (decision: 'approved' | 'rejected') => {
    if (decisionId === null || saving) return;
    if (decision === 'approved' && selectedApplication?.requested_role === 'courier' && !zoneId) {
      setError(tr('اختر منطقة التوصيل قبل الموافقة.', 'Select a service zone before approval.', 'Sélectionnez une zone de livraison.'));
      return;
    }
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await decideRoleApplication(decisionId, decision, note.trim(), decision === 'approved' && selectedApplication?.requested_role === 'courier' ? Number(zoneId) : undefined);
      setItems((previous) => previous.filter((item) => item.id !== decisionId));
      setDecisionId(null);
      setNote('');
      setZoneId('');
      setNotice(tr(
        'تم حفظ قرار المراجعة. لن تُمنح الصلاحيات تلقائيًا.',
        'Review decision saved. Permissions are not granted automatically.',
        'Décision enregistrée. Aucun droit n’est attribué automatiquement.',
      ));
    } catch {
      setError(tr(
        'تعذر حفظ القرار. تحقق من حالة الطلب وحاول مجددًا.',
        'Could not save the decision. Check the application status and retry.',
        'Impossible d’enregistrer la décision. Vérifiez le statut et réessayez.',
      ));
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    let active = true;
    void reviewServiceZones()
      .then((result) => { if (active) setZones(result.data); })
      .catch(() => { if (active) setError(tr('تعذر تحميل مناطق التوصيل.', 'Could not load service zones.', 'Impossible de charger les zones.')); });
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
        <button
          type="button"
          className="admin-family-primary"
          onClick={load}
          disabled={loading}
        >
          ↻ {loading
            ? tr('جارٍ التحديث...', 'Refreshing...', 'Actualisation...')
            : tr('تحديث', 'Refresh', 'Actualiser')}
        </button>
      </div>
      {loading && <p role="status">{tr('جارٍ تحميل الطلبات...', 'Loading applications...', 'Chargement des demandes...')}</p>}
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
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
              <th>{tr('الإجراءات', 'Actions', 'Actions')}</th>
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
                <td><button type="button" className="admin-family-secondary" onClick={() => { setDecisionId(item.id); setNote(''); setZoneId(''); setError(''); }}>{tr('مراجعة الطلب', 'Review application', 'Examiner')}</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {decisionId !== null && (
        <section className="admin-family-panel" aria-label={tr('مراجعة الطلب', 'Review application', 'Examiner la candidature')} style={{ marginBlock: 16, padding: 16 }}>
          <h3>{tr('قرار مراجعة الطلب', 'Application review decision', 'Décision de révision')} #{decisionId}</h3>
          <p>{tr(
            'الموافقة على الطلب لا تمنح صلاحيات المسؤول ولا تُفعّل مندوب التوصيل. يتم ذلك بشكل مستقل من الأقسام المخصصة.',
            'Approving the request does not grant admin permissions or activate a courier. Complete those steps separately.',
            'Approuver la demande ne donne aucun droit administrateur et n’active pas le livreur.',
          )}</p>
          {selectedApplication?.requested_role === 'courier' && (
            <label style={{ display: 'grid', gap: 8, marginBlock: 12 }}>
              {tr('منطقة التوصيل (مطلوبة للموافقة)', 'Service zone (required for approval)', 'Zone de livraison (obligatoire)')}
              <select value={zoneId} onChange={(event) => setZoneId(event.target.value)}>
                <option value="">{tr('اختر المنطقة', 'Select zone', 'Choisir une zone')}</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {ar ? zone.name_ar : zone.name_en}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label style={{ display: 'grid', gap: 8, marginBlock: 12 }}>
            {tr('ملاحظات المراجعة (اختياري)', 'Review note (optional)', 'Note de révision (facultative)')}
            <textarea value={note} maxLength={1000} rows={3} onChange={(event) => setNote(event.target.value)} />
          </label>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" className="admin-family-primary" disabled={saving} onClick={() => void decide('approved')}>{tr('موافقة', 'Approve', 'Approuver')}</button>
            <button type="button" className="admin-family-secondary" disabled={saving || !note.trim()} onClick={() => void decide('rejected')}>{tr('رفض', 'Reject', 'Refuser')}</button>
            <button type="button" className="admin-family-secondary" disabled={saving} onClick={() => setDecisionId(null)}>{tr('إلغاء', 'Cancel', 'Annuler')}</button>
          </div>
          {!note.trim() && <small>{tr('يرجى كتابة سبب الرفض قبل الرفض.', 'Enter a reason before rejecting.', 'Indiquez un motif avant de refuser.')}</small>}
        </section>
      )}
      <p>{tr(
        'منح صلاحيات المسؤول يتم من إدارة المسؤولين، واعتماد المندوب من قسم اعتماد المندوبين بعد استكمال بياناته.',
        'Assign admin permissions in Admin assignments, or approve an eligible courier in Courier approvals after their profile is set up.',
        'Attribuez les droits administrateur ou approuvez un livreur après la configuration de son profil.',
      )}</p>
    </section>
  );
}

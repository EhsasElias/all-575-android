import { useEffect, useState, type SubmitEvent } from 'react';
import { Link, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { isApiError } from '@/shared/api';
import { routePaths } from '@/shared/lib';
import {
  applyForRole,
  myRoleApplications,
  type RequestedRole,
  type RoleApplication,
} from './roleApplicationsApi';
import './adminWorkspaceFamily.css';

const isRequestedRole = (role: string | undefined): role is RequestedRole =>
  role === 'admin' || role === 'courier';

export function RoleApplicationScreen() {
  const { role } = useParams();
  const { i18n } = useTranslation();
  const ar = i18n.language.startsWith('ar');
  const fr = i18n.language.startsWith('fr');
  const tr = (arabic: string, english: string, french: string): string =>
    ar ? arabic : fr ? french : english;
  const requestedRole = isRequestedRole(role) ? role : null;
  const [applications, setApplications] = useState<RoleApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [motivation, setMotivation] = useState('');
  const [vehicleType, setVehicleType] = useState<'car' | 'motorcycle' | 'van' | 'bicycle'>('car');

  useEffect(() => {
    let active = true;
    void myRoleApplications()
      .then((response) => {
        if (active) setApplications(response.data);
      })
      .catch(() => {
        if (active)
          setError(
            tr(
              'تعذر تحميل طلباتك.',
              'Unable to load your applications.',
              'Impossible de charger vos demandes.',
            ),
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // The request is tied to the active session, not a language change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!requestedRole) {
    return (
      <main className="admin-workspace-family">
        <p role="alert">
          {tr('نوع الطلب غير معروف.', 'Unknown application type.', 'Type de demande inconnu.')}
        </p>
        <Link to={routePaths.account}>
          {tr('العودة إلى الحساب', 'Back to account', 'Retour au compte')}
        </Link>
      </main>
    );
  }

  const existing = applications.find((item) => item.requested_role === requestedRole);

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || existing || motivation.trim().length < 10) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await applyForRole({
        requested_role: requestedRole,
        motivation: motivation.trim(),
        ...(requestedRole === 'courier' ? { vehicle_type: vehicleType } : {}),
      });
      setApplications((previous) => [...previous, result.data]);
      setNotice(
        tr(
          'تم إرسال طلبك للمراجعة. لم يتم منح أي صلاحيات بعد.',
          'Your application was submitted for review. No permissions have been granted.',
          'Votre demande est soumise à examen. Aucun accès n’a été accordé.',
        ),
      );
    } catch (cause) {
      const message = isApiError(cause)
        ? cause.status === 409
          ? tr(
              'لديك طلب سابق لهذه الصلاحية.',
              'You already have an application for this role.',
              'Vous avez déjà une demande pour ce rôle.',
            )
          : cause.status === 403
            ? tr(
                'يتطلب التقديم حسابًا نشطًا وموثقًا.',
                'An active, verified account is required.',
                'Un compte actif et vérifié est requis.',
              )
            : cause.status === 422
              ? tr(
                  'تحقق من صحة البيانات المطلوبة.',
                  'Check the required information.',
                  'Vérifiez les informations obligatoires.',
                )
              : tr(
                  'تعذر إرسال الطلب.',
                  'Unable to submit application.',
                  'Impossible de soumettre la demande.',
                )
        : tr(
            'تعذر الاتصال بالخادم.',
            'Unable to connect to the server.',
            'Connexion au serveur impossible.',
          );
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="admin-workspace-family" dir={ar ? 'rtl' : 'ltr'} style={{ padding: 16 }}>
      <section
        className="admin-family-panel"
        style={{ padding: 20, maxWidth: 680, marginInline: 'auto' }}
      >
        <h1>
          {requestedRole === 'admin'
            ? tr('طلب الانضمام كمسؤول', 'Become an Admin', 'Devenir administrateur')
            : tr('طلب الانضمام كمندوب توصيل', 'Become a Delivery Courier', 'Devenir livreur')}
        </h1>
        <p>
          {tr(
            'يتم مراجعة الطلب من الإدارة. الموافقة وحدها وإسناد الصلاحيات المطلوبة تتيح الوصول إلى لوحة العمل.',
            'Applications are reviewed by management. Access requires a separate approved role assignment.',
            'Les demandes sont examinées par l’administration. L’accès nécessite une attribution de rôle approuvée.',
          )}
        </p>
        {requestedRole === 'admin' && (
          <p>
            {tr(
              'يحدد السوبر أدمن المتجر والصلاحيات المسموحة بعد المراجعة.',
              'A Super Admin chooses the assigned store and permissions after review.',
              'Un super administrateur choisit le magasin et les autorisations après examen.',
            )}
          </p>
        )}
        {requestedRole === 'courier' && (
          <p>
            {tr(
              'يتم تحديد منطقة الخدمة واعتماد حساب المندوب من الإدارة قبل استقبال مهام التوصيل.',
              'Your service zone and courier approval must be configured by management before receiving jobs.',
              'La zone de service et le compte livreur doivent être approuvés avant toute livraison.',
            )}
          </p>
        )}
        {loading ? (
          <p role="status">
            {tr(
              'جارٍ تحميل حالة الطلب...',
              'Loading application status...',
              'Chargement de la demande...',
            )}
          </p>
        ) : existing ? (
          <p role="status">
            {tr('حالة الطلب:', 'Application status:', 'État de la demande :')}{' '}
            <strong>
              {existing.status === 'pending'
                ? tr('قيد المراجعة', 'Pending review', 'En attente')
                : existing.status === 'rejected'
                  ? tr('مرفوض', 'Rejected', 'Refusée')
                  : existing.status}
            </strong>
          </p>
        ) : (
          <form onSubmit={(event) => void submit(event)} style={{ display: 'grid', gap: 12 }}>
            {requestedRole === 'courier' && (
              <label>
                {tr('وسيلة التوصيل', 'Delivery vehicle', 'Véhicule de livraison')}
                <select
                  value={vehicleType}
                  onChange={(event) => {
                    const value = event.target.value;
                    if (
                      value === 'car' ||
                      value === 'motorcycle' ||
                      value === 'van' ||
                      value === 'bicycle'
                    )
                      setVehicleType(value);
                  }}
                  required
                >
                  <option value="car">{tr('سيارة', 'Car', 'Voiture')}</option>
                  <option value="motorcycle">{tr('دراجة نارية', 'Motorcycle', 'Moto')}</option>
                  <option value="van">{tr('فان', 'Van', 'Fourgonnette')}</option>
                  <option value="bicycle">{tr('دراجة', 'Bicycle', 'Vélo')}</option>
                </select>
              </label>
            )}
            <label>
              {tr(
                'لماذا ترغب في الانضمام؟',
                'Why would you like to apply?',
                'Pourquoi souhaitez-vous postuler ?',
              )}
              <textarea
                required
                minLength={10}
                maxLength={1000}
                rows={4}
                value={motivation}
                onChange={(event) => setMotivation(event.target.value)}
              />
            </label>
            <button
              className="admin-family-primary"
              type="submit"
              disabled={busy || motivation.trim().length < 10}
            >
              {busy
                ? tr('جارٍ الإرسال...', 'Submitting...', 'Envoi...')
                : tr('إرسال طلب الانضمام', 'Submit application', 'Soumettre la demande')}
            </button>
          </form>
        )}
        {error && <p role="alert">{error}</p>}
        {notice && <p role="status">{notice}</p>}
        <p>
          <Link to={routePaths.account}>
            {tr('العودة إلى الحساب', 'Back to account', 'Retour au compte')}
          </Link>
        </p>
      </section>
    </main>
  );
}

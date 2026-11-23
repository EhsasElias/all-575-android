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
import { Page } from './components/Page';
import { PageHeader } from './components/PageHeader';
import styles from './RoleApplicationScreen.module.css';

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
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [motivation, setMotivation] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [city, setCity] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [qualification, setQualification] = useState('');
  const [serviceArea, setServiceArea] = useState('');
  const [vehiclePlateNumber, setVehiclePlateNumber] = useState('');
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
  const isCourier = requestedRole === 'courier';
  const phoneInvalid = !/^05[0-9]{8}$/.test(contactPhone);
  const cityInvalid = !city.trim();
  const years = Number(experienceYears);
  const experienceInvalid =
    experienceYears.trim() === '' || !Number.isInteger(years) || years < 0 || years > 60;
  const qualificationInvalid = !isCourier && !qualification.trim();
  const serviceAreaInvalid = isCourier && !serviceArea.trim();
  const motivationInvalid = motivation.trim().length < 10;
  const hasValidationErrors =
    phoneInvalid ||
    cityInvalid ||
    experienceInvalid ||
    qualificationInvalid ||
    serviceAreaInvalid ||
    motivationInvalid;

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || existing) return;
    setAttemptedSubmit(true);
    if (hasValidationErrors) {
      setError(
        tr(
          'يرجى تصحيح الحقول الموضحة أدناه قبل إرسال الطلب.',
          'Please correct the highlighted fields before submitting.',
          'Veuillez corriger les champs indiqués avant l’envoi.',
        ),
      );
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await applyForRole({
        requested_role: requestedRole,
        motivation: motivation.trim(),
        contact_phone: contactPhone,
        city: city.trim(),
        experience_years: Number(experienceYears),
        ...(requestedRole === 'admin'
          ? { qualification: qualification.trim() }
          : {
              vehicle_type: vehicleType,
              service_area: serviceArea.trim(),
              ...(vehiclePlateNumber.trim()
                ? { vehicle_plate_number: vehiclePlateNumber.trim() }
                : {}),
            }),
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

  const title = isCourier
    ? tr('طلب الانضمام كمندوب توصيل', 'Delivery courier application', 'Candidature livreur')
    : tr('طلب الانضمام كمسؤول', 'Admin application', 'Candidature administrateur');

  return (
    <Page>
      <div className={styles.application} dir={ar ? 'rtl' : 'ltr'}>
        <PageHeader
          title={title}
          lead={tr(
            'أكمل بيانات الطلب وأرسله إلى السوبر أدمن للمراجعة. لا تُمنح صلاحيات العمل تلقائيًا.',
            'Complete your application for Super Admin review. Access is not granted automatically.',
            'Complétez votre candidature pour examen par le super administrateur. Aucun accès automatique.',
          )}
          back={
            <Link to={routePaths.account}>
              {tr('العودة إلى حسابي', 'Back to account', 'Retour au compte')}
            </Link>
          }
        />
        <div className={styles.intro}>
          <div className={styles.introIcon} aria-hidden="true">
            {isCourier ? '🚚' : '🛡'}
          </div>
          <div>
            <h2>{tr('مراجعة طلب الانضمام', 'Application review', 'Examen de la candidature')}</h2>
            <p>
              {isCourier
                ? tr(
                    'يراجع السوبر أدمن طلبك، ثم تُستكمل منطقة الخدمة واعتماد المندوب قبل استقبال مهام التوصيل.',
                    'The Super Admin reviews your request. Your service area and courier profile must be approved before deliveries.',
                    'Le super administrateur examine votre demande. La zone de service et le profil doivent être approuvés.',
                  )
                : tr(
                    'يراجع السوبر أدمن الطلب، ثم يحدد المتجر والصلاحيات المسموحة قبل تفعيل لوحة الإدارة.',
                    'The Super Admin reviews your request and assigns the store and permitted permissions before access.',
                    'Le super administrateur examine votre demande et attribue le magasin et les autorisations.',
                  )}
            </p>
          </div>
        </div>

        {loading ? (
          <div className={styles.status} role="status">
            {tr(
              'جارٍ تحميل حالة الطلب...',
              'Loading application status...',
              'Chargement du statut...',
            )}
          </div>
        ) : existing ? (
          <div className={styles.status} role="status">
            <strong>
              {tr('حالة الطلب:', 'Application status:', 'Statut de la candidature :')}
            </strong>{' '}
            {existing.status === 'pending'
              ? tr('قيد المراجعة', 'Pending review', 'En attente')
              : existing.status === 'rejected'
                ? tr('مرفوض', 'Rejected', 'Refusée')
                : existing.status === 'approved'
                  ? tr('معتمد', 'Approved', 'Approuvée')
                  : existing.status}
            <p>
              {tr(
                'يمكنك متابعة الطلب من هذه الصفحة. إرسال الطلب لا يفعّل صلاحيات العمل.',
                'You can track the request here. Submission does not activate workplace permissions.',
                'Vous pouvez suivre votre demande ici. Aucune autorisation n’est activée automatiquement.',
              )}
            </p>
          </div>
        ) : (
          <form className={styles.form} noValidate onSubmit={(event) => void submit(event)}>
            <fieldset className={styles.group} disabled={busy}>
              <legend className={styles.legend}>
                <span className={styles.stepNumber}>1</span>
                {tr('بيانات طلب الانضمام', 'Application details', 'Détails de la demande')}
              </legend>
              <p className={styles.hint}>
                {tr(
                  'الحقول المميزة بعلامة * مطلوبة لمراجعة الطلب.',
                  'Fields marked * are required for review.',
                  'Les champs marqués * sont obligatoires.',
                )}
              </p>
              <div className={styles.fieldGrid}>
                <label className={styles.field}>
                  <span>
                    {tr('رقم الجوال السعودي', 'Saudi mobile number', 'Numéro mobile saoudien')}{' '}
                    <span className={styles.required}>*</span>
                  </span>
                  <input
                    dir="ltr"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    required
                    maxLength={10}
                    pattern="05[0-9]{8}"
                    placeholder="05XXXXXXXX"
                    aria-invalid={attemptedSubmit && phoneInvalid}
                    value={contactPhone}
                    onChange={(event) => setContactPhone(event.target.value)}
                  />
                  {attemptedSubmit && phoneInvalid && (
                    <small className={styles.fieldError}>
                      {tr(
                        'أدخل رقم جوال سعودي صحيحًا يبدأ بـ 05 ويتكون من 10 أرقام.',
                        'Enter a valid 10-digit Saudi mobile number starting with 05.',
                        'Saisissez un numéro saoudien valide de 10 chiffres commençant par 05.',
                      )}
                    </small>
                  )}
                </label>
                <label className={styles.field}>
                  <span>
                    {tr('المدينة', 'City', 'Ville')} <span className={styles.required}>*</span>
                  </span>
                  <input
                    required
                    maxLength={120}
                    autoComplete="address-level2"
                    aria-invalid={attemptedSubmit && cityInvalid}
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                  />
                  {attemptedSubmit && cityInvalid && (
                    <small className={styles.fieldError}>
                      {tr('يرجى إدخال المدينة.', 'Enter your city.', 'Indiquez votre ville.')}
                    </small>
                  )}
                </label>
                <label className={styles.field}>
                  <span>
                    {tr('سنوات الخبرة', 'Years of experience', "Années d'expérience")}{' '}
                    <span className={styles.required}>*</span>
                  </span>
                  <input
                    dir="ltr"
                    type="number"
                    min="0"
                    max="60"
                    step="1"
                    required
                    aria-invalid={attemptedSubmit && experienceInvalid}
                    value={experienceYears}
                    onChange={(event) => setExperienceYears(event.target.value)}
                  />
                  {attemptedSubmit && experienceInvalid && (
                    <small className={styles.fieldError}>
                      {tr(
                        'أدخل سنوات خبرة صحيحة من 0 إلى 60.',
                        'Enter a whole number of years from 0 to 60.',
                        'Indiquez un nombre entier d’années entre 0 et 60.',
                      )}
                    </small>
                  )}
                </label>
                {!isCourier && (
                  <label className={styles.field}>
                    <span>
                      {tr(
                        'المؤهل أو مجال الخبرة',
                        'Qualification or area of expertise',
                        'Qualification ou domaine de compétence',
                      )}{' '}
                      <span className={styles.required}>*</span>
                    </span>
                    <input
                      required
                      maxLength={180}
                      aria-invalid={attemptedSubmit && qualificationInvalid}
                      value={qualification}
                      onChange={(event) => setQualification(event.target.value)}
                    />
                    {attemptedSubmit && qualificationInvalid && (
                      <small className={styles.fieldError}>
                        {tr(
                          'يرجى إدخال المؤهل أو مجال الخبرة.',
                          'Enter your qualification or area of expertise.',
                          'Indiquez votre qualification ou domaine de compétence.',
                        )}
                      </small>
                    )}
                  </label>
                )}
              </div>
              {isCourier && (
                <div className={styles.fieldGrid}>
                  <label className={styles.field}>
                    <span>
                      {tr('وسيلة التوصيل', 'Delivery vehicle', 'Véhicule de livraison')}{' '}
                      <span className={styles.required}>*</span>
                    </span>
                    <select
                      value={vehicleType}
                      required
                      onChange={(event) => {
                        const value = event.target.value;
                        if (
                          value === 'car' ||
                          value === 'motorcycle' ||
                          value === 'van' ||
                          value === 'bicycle'
                        ) {
                          setVehicleType(value);
                        }
                      }}
                    >
                      <option value="car">{tr('سيارة', 'Car', 'Voiture')}</option>
                      <option value="motorcycle">{tr('دراجة نارية', 'Motorcycle', 'Moto')}</option>
                      <option value="van">{tr('فان', 'Van', 'Fourgonnette')}</option>
                      <option value="bicycle">{tr('دراجة هوائية', 'Bicycle', 'Vélo')}</option>
                    </select>
                  </label>
                  <label className={styles.field}>
                    <span>
                      {tr(
                        'منطقة الخدمة المقترحة',
                        'Preferred delivery area',
                        'Zone de livraison souhaitée',
                      )}{' '}
                      <span className={styles.required}>*</span>
                    </span>
                    <input
                      required
                      maxLength={180}
                      aria-invalid={attemptedSubmit && serviceAreaInvalid}
                      value={serviceArea}
                      onChange={(event) => setServiceArea(event.target.value)}
                    />
                    {attemptedSubmit && serviceAreaInvalid && (
                      <small className={styles.fieldError}>
                        {tr(
                          'يرجى إدخال منطقة الخدمة.',
                          'Enter your delivery area.',
                          'Indiquez votre zone de livraison.',
                        )}
                      </small>
                    )}
                  </label>
                  <label className={styles.field}>
                    <span>
                      {tr(
                        'رقم لوحة المركبة (اختياري)',
                        'Vehicle plate number (optional)',
                        'Immatriculation (facultatif)',
                      )}
                    </span>
                    <input
                      maxLength={32}
                      value={vehiclePlateNumber}
                      onChange={(event) => setVehiclePlateNumber(event.target.value)}
                    />
                  </label>
                </div>
              )}
              <label className={styles.field}>
                <span>
                  {tr(
                    'لماذا ترغب في الانضمام؟',
                    'Why would you like to join?',
                    'Pourquoi souhaitez-vous nous rejoindre ?',
                  )}{' '}
                  <span className={styles.required}>*</span>
                </span>
                <textarea
                  required
                  minLength={10}
                  maxLength={1000}
                  rows={5}
                  aria-invalid={(attemptedSubmit || motivation.length > 0) && motivationInvalid}
                  value={motivation}
                  onChange={(event) => setMotivation(event.target.value)}
                  placeholder={tr(
                    'اكتب خبرتك وسبب رغبتك في الانضمام (10 أحرف على الأقل).',
                    'Describe your experience and motivation (at least 10 characters).',
                    'Décrivez votre expérience et votre motivation (10 caractères minimum).',
                  )}
                />
                <small>{motivation.trim().length} / 1000</small>
                {(attemptedSubmit || motivation.length > 0) && motivationInvalid && (
                  <small className={styles.fieldError}>
                    {tr(
                      'يجب كتابة 10 أحرف على الأقل.',
                      'Write at least 10 characters.',
                      'Veuillez saisir au moins 10 caractères.',
                    )}
                  </small>
                )}
              </label>
            </fieldset>
            <section className={styles.group}>
              <h2 className={styles.reviewHeading}>
                <span className={styles.stepNumber}>2</span>
                {tr('الإقرار وإرسال الطلب', 'Review and submit', 'Vérifier et soumettre')}
              </h2>
              <p className={styles.hint}>
                {tr(
                  'سيصل الطلب إلى السوبر أدمن بحالة «قيد المراجعة». الموافقة وإسناد الصلاحيات إجراءان منفصلان.',
                  'Your request will reach the Super Admin as pending. Approval and permission assignment are separate steps.',
                  'La demande sera transmise au super administrateur. L’approbation et les autorisations sont distinctes.',
                )}
              </p>
              {error && (
                <p className={styles.error} role="alert">
                  {error}
                </p>
              )}
              {notice && (
                <p className={styles.status} role="status">
                  {notice}
                </p>
              )}
              <div className={styles.actions}>
                <button className={styles.primaryButton} type="submit" disabled={busy}>
                  {busy
                    ? tr('جارٍ الإرسال...', 'Submitting...', 'Envoi...')
                    : tr('إرسال طلب الانضمام', 'Submit application', 'Soumettre la demande')}
                </button>
                <Link className={styles.secondaryButton} to={routePaths.account}>
                  {tr('إلغاء والعودة للحساب', 'Cancel and return', 'Annuler et revenir')}
                </Link>
              </div>
            </section>
          </form>
        )}
        {(error || notice) && (loading || existing) && (
          <p className={error ? styles.error : styles.status} role={error ? 'alert' : 'status'}>
            {error || notice}
          </p>
        )}
      </div>
    </Page>
  );
}

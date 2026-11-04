import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { isApiError } from '@/shared/api';
import { Link } from 'react-router';
import { routePaths } from '@/shared/lib';
import { Page } from './components/Page';
import { PageHeader } from './components/PageHeader';
import styles from './SellerApplicationScreen.module.css';
import {
  getSellerApplication,
  getSellerApplicationDocuments,
  uploadSellerApplicationDocument,
  type SellerApplicationDocument,
  saveSellerApplication,
  submitSellerApplication,
  type SellerApplicationInput,
} from './sellerApplicationApi';

const empty: SellerApplicationInput = {
  legal_name: '', commercial_registration: '', national_unified_number: null,
  vat_number: null, contact_name: '', contact_email: '', contact_phone: '', city: '',
  entity_type: null, commercial_registration_status: null,
  commercial_registration_issue_date: null, commercial_registration_expiry_date: null,
  chamber_of_commerce_number: null, building_number: null, postal_code: null,
  additional_number: null, street: null, district: null, iban: null,
};

const fields = [
  ['legal_name', 'Company legal name', 'الاسم القانوني للشركة'],
  ['commercial_registration', 'Commercial registration', 'السجل التجاري'],
  ['national_unified_number', '700 number (optional)', 'الرقم الموحد 700 (اختياري)'],
  ['vat_number', 'VAT number (optional)', 'الرقم الضريبي (اختياري)'],
  ['contact_name', 'Contact name', 'اسم المسؤول'],
  ['contact_email', 'Contact email', 'البريد الإلكتروني'],
  ['contact_phone', 'Contact phone', 'رقم الهاتف'],
  ['city', 'City', 'المدينة'],
  ['entity_type', 'Entity type (optional)', 'نوع المنشأة (اختياري)'],
  ['commercial_registration_status', 'CR status (optional)', 'حالة السجل التجاري (اختياري)'],
  ['commercial_registration_issue_date', 'CR issue date (optional)', 'تاريخ إصدار السجل (اختياري)'],
  ['commercial_registration_expiry_date', 'CR expiry date (optional)', 'تاريخ انتهاء السجل (اختياري)'],
  ['chamber_of_commerce_number', 'Chamber of Commerce No. (optional)', 'رقم الغرفة التجارية (اختياري)'],
  ['building_number', 'Building number (optional)', 'رقم المبنى (اختياري)'],
  ['postal_code', 'Postal code (optional)', 'الرمز البريدي (اختياري)'],
  ['additional_number', 'Additional number (optional)', 'الرقم الإضافي (اختياري)'],
  ['street', 'Street (optional)', 'الشارع (اختياري)'],
  ['district', 'District (optional)', 'الحي (اختياري)'],
  ['iban', 'IBAN (optional)', 'الآيبان (اختياري)'],
] as const;

const frenchFields: Partial<Record<keyof SellerApplicationInput, string>> = {
  legal_name: "Raison sociale", commercial_registration: "Registre du commerce",
  national_unified_number: "Numéro national unifié 700 (facultatif)",
  vat_number: "Numéro de TVA (facultatif)",
  contact_name: "Nom du responsable", contact_email: "Adresse e-mail",
  contact_phone: "Téléphone", city: "Ville",
  entity_type: "Type d'entreprise (facultatif)",
  commercial_registration_status: "Statut du registre (facultatif)",
  commercial_registration_issue_date: "Date de délivrance (facultatif)",
  commercial_registration_expiry_date: "Date d'expiration (facultatif)",
  chamber_of_commerce_number: "Numéro de chambre de commerce (facultatif)",
  building_number: "Numéro du bâtiment (facultatif)",
  postal_code: "Code postal (facultatif)",
  additional_number: "Numéro supplémentaire (facultatif)",
  street: "Rue (facultatif)", district: "Quartier (facultatif)",
  iban: "IBAN (facultatif)",
};

const statusLabels = {
  draft: { ar: 'مسودة', en: 'Draft', fr: 'Brouillon' },
  correction: { ar: 'يحتاج تصحيحًا', en: 'Needs changes', fr: 'Corrections requises' },
  submitted: { ar: 'قيد المراجعة', en: 'Under review', fr: 'En cours d’examen' },
  reviewed: { ar: 'تمت المراجعة', en: 'Reviewed', fr: 'Examinée' },
  approved: { ar: 'تم الاعتماد', en: 'Approved', fr: 'Approuvée' },
  rejected: { ar: 'مرفوض', en: 'Rejected', fr: 'Refusée' },
} as const;

const formGroups = [
  { id: 'company', title: { ar: 'بيانات الشركة', en: 'Company details', fr: "Informations de l’entreprise" },
    keys: ['legal_name', 'commercial_registration', 'national_unified_number', 'vat_number', 'entity_type', 'commercial_registration_status', 'commercial_registration_issue_date', 'commercial_registration_expiry_date', 'chamber_of_commerce_number'] },
  { id: 'contact', title: { ar: 'بيانات التواصل', en: 'Contact details', fr: 'Coordonnées' },
    keys: ['contact_name', 'contact_email', 'contact_phone'] },
  { id: 'address', title: { ar: 'العنوان الوطني', en: 'National address', fr: 'Adresse nationale' },
    keys: ['city', 'district', 'street', 'building_number', 'additional_number', 'postal_code'] },
  { id: 'bank', title: { ar: 'البيانات البنكية', en: 'Bank details', fr: 'Coordonnées bancaires' },
    keys: ['iban'] },
] as const;

export function SellerApplicationScreen() {
  const { i18n } = useTranslation();
  const ar = i18n.language.startsWith('ar');
  const fr = i18n.language.startsWith('fr');
  const localized = (arLabel: string, enLabel: string, frLabel?: string) => ar ? arLabel : fr ? (frLabel ?? enLabel) : enLabel;
  const [form, setForm] = useState<SellerApplicationInput>(empty);
  const [status, setStatus] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [documents, setDocuments] = useState<SellerApplicationDocument[]>([]);
  const [documentType, setDocumentType] = useState<SellerApplicationDocument['document_type']>('commercial_registration');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentsBusy, setDocumentsBusy] = useState(false);

  useEffect(() => {
    let live = true;
    void Promise.all([getSellerApplication(), getSellerApplicationDocuments()]).then(([result, uploaded]) => {
      if (live) setDocuments(uploaded);
      if (!live) return;
      if (result) {
        setStatus(result.status);
        setReviewNote(result.review_note ?? null);
        setForm({
          legal_name: result.legal_name,
          commercial_registration: result.commercial_registration,
          national_unified_number: result.national_unified_number,
          vat_number: result.vat_number,
          contact_name: result.contact_name,
          contact_email: result.contact_email,
          contact_phone: result.contact_phone,
          city: result.city,
          entity_type: result.entity_type ?? null,
          commercial_registration_status: result.commercial_registration_status ?? null,
          commercial_registration_issue_date: result.commercial_registration_issue_date ?? null,
          commercial_registration_expiry_date: result.commercial_registration_expiry_date ?? null,
          chamber_of_commerce_number: result.chamber_of_commerce_number ?? null,
          building_number: result.building_number ?? null,
          postal_code: result.postal_code ?? null,
          additional_number: result.additional_number ?? null,
          street: result.street ?? null,
          district: result.district ?? null,
          iban: result.iban ?? null,
        });
      }
    }).catch(() => { if (live) setError(ar ? 'تعذر تحميل طلب البائع.' : 'Could not load seller application.'); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy || status === 'submitted' || status === 'reviewed') return;
    setBusy(true); setError(''); setSaved(false);
    try {
      const result = await saveSellerApplication(form);
      setStatus(result.status);
      setReviewNote(result.review_note ?? null);
      setSaved(true);
    } catch (cause) {
      const fieldError = isApiError(cause) ? Object.values(cause.fieldErrors).flat()[0] : null;
      setError(fieldError ?? (ar ? 'تعذر حفظ الطلب. تحققي من الحقول.' : 'Could not save application. Check the fields.'));
    }
    finally { setBusy(false); }
  };

  const sendForReview = async () => {
    if (busy || status !== 'draft') return;
    setBusy(true); setError('');
    try {
      const result = await submitSellerApplication();
      setStatus(result.status);
      setReviewNote(result.review_note ?? null);
      setSaved(false);
    } catch (cause) {
      setError(isApiError(cause) && cause.status === 409
        ? (ar ? 'الطلب مُرسل بالفعل. حدّثي الصفحة.' : 'Application already submitted. Refresh this page.')
        : (ar ? 'تعذر إرسال الطلب للمراجعة.' : 'Could not submit application.'));
    }
    finally { setBusy(false); }
  };

  const uploadDocument = async () => {
    if (!documentFile || documentsBusy || busy || status !== 'draft' && status !== 'correction') return;
    if (documentFile.size > 10 * 1024 * 1024 ||
      !['application/pdf', 'image/jpeg', 'image/png'].includes(documentFile.type)) {
      setError(ar ? 'اختاري ملف PDF أو JPG أو PNG لا يتجاوز 10 ميجابايت.' : 'Choose a PDF, JPG or PNG under 10 MB.');
      return;
    }
    setDocumentsBusy(true); setError(''); setSaved(false);
    try {
      await uploadSellerApplicationDocument(documentType, documentFile);
      setDocuments(await getSellerApplicationDocuments());
      setDocumentFile(null);
      setSaved(true);
    } catch (cause) {
      const fieldError = isApiError(cause) ? Object.values(cause.fieldErrors).flat()[0] : null;
      setError(fieldError ?? (ar ? 'تعذر رفع المستند. تحققي من نوع الملف والصلاحيات.' : 'Document upload failed. Check file type and permissions.'));
    } finally { setDocumentsBusy(false); }
  };

  const readonly = status !== null && status !== 'draft' && status !== 'correction';
  return (
    <Page>
      <div className={styles.application}>
      <PageHeader title={localized('طلب التسجيل كبائع', 'Seller application', 'Demande de compte vendeur')}
        lead={localized('احفظ البيانات أولًا ثم أرسل الطلب للمراجعة. لا يتم تفعيل المتجر تلقائيًا.', 'Save your details before submitting for review. Store activation requires approval.', 'Enregistrez vos informations avant de soumettre votre demande à validation.')}
        back={<Link to={routePaths.account}>{localized('العودة إلى حسابي', 'Back to account', 'Retour au compte')}</Link>} />
      {loading ? <p role="status">{ar ? 'جار التحميل…' : 'Loading…'}</p> : (
        <>
          {status && <p className={styles.status} role="status">{localized('حالة الطلب: ', 'Application status: ', 'Statut de la demande : ')}{statusLabels[status as keyof typeof statusLabels]?.[ar ? 'ar' : fr ? 'fr' : 'en'] ?? status}</p>}
          {status === 'correction' && reviewNote && <p role="status" style={{ padding: 12, border: '1px solid #d8e1db', borderRadius: 8 }}>
            <strong>{ar ? 'ملاحظات الإدارة للتصحيح:' : 'Administrator correction request:'}</strong>{' '}{reviewNote}
          </p>}
          {status === 'correction' && <p>{ar ? 'عدّلي البيانات واحفظي المسودة ثم أرسليها للمراجعة مرة أخرى.' : 'Edit the information, save a draft, then submit it for review again.'}</p>}
          {error && <p className={styles.error} role="alert">{error}</p>}
          {saved && <p className={styles.success} role="status">{ar ? 'تم حفظ المسودة.' : 'Draft saved.'}</p>}
          <form onSubmit={(event) => void submit(event)} className={styles.form}>
            {formGroups.map((group, index) => (
              <fieldset key={group.id} className={styles.group} disabled={busy || readonly}>
                <legend className={styles.legend}>
                  <span className={styles.stepNumber}>{index + 1}</span>
                  {group.title[ar ? 'ar' : fr ? 'fr' : 'en']}
                </legend>
                <div className={styles.fieldGrid}>
                  {group.keys.map((key) => {
                    const field = fields.find(([name]) => name === key);
                    if (!field) return null;
                    const [, en, arabic] = field;
                    const required = ['legal_name', 'commercial_registration', 'contact_name', 'contact_email', 'contact_phone', 'city'].includes(key);
                    return (
                      <label key={key} className={styles.field}>
                        <span>{ar ? arabic : fr ? frenchFields[key] ?? en : en}{required && <span aria-hidden="true" className={styles.required}> *</span>}</span>
                        <input
                          required={required}
                          type={key === 'contact_email' ? 'email' : key.endsWith('_date') ? 'date' : key === 'contact_phone' ? 'tel' : 'text'}
                          inputMode={key === 'contact_phone' ? 'tel' : 'text'}
                          autoComplete={key === 'contact_email' ? 'email' : key === 'contact_phone' ? 'tel' : undefined}
                          dir={key === 'contact_email' || key === 'iban' || key === 'contact_phone' || key.endsWith('_date') ? 'ltr' : undefined}
                          maxLength={key === 'legal_name' || key === 'contact_email' || key === 'street' ? 180 : key === 'contact_name' ? 120 : 100}
                          value={form[key] ?? ''}
                          onChange={(event) => setForm((previous) => ({ ...previous, [key]: event.target.value || null }))}
                        />
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ))}
            {!readonly && <button type="submit" className={styles.primaryButton} disabled={busy}>
              {localized('حفظ المسودة', 'Save draft', 'Enregistrer le brouillon')}
            </button>}
          </form>
          <section className={styles.documents}>
            <h2>{ar ? 'مستندات البائع' : 'Seller documents'}</h2>
            <p>{ar ? 'تُحفظ المستندات في التخزين الخاص ولا تُنشر للعامة. ارفعي المستندات بعد حفظ مسودة الطلب وقبل إرسالها للمراجعة.' :
              'Documents are stored privately, not published. Save the application first, then upload documents before submitting for review.'}</p>
            <ul>{documents.map((document) => <li key={document.document_type}>
              {document.document_type.replace(/_/g, ' ')} — {document.original_name} ({(document.size_bytes / 1024).toFixed(0)} KB)
            </li>)}</ul>
            {documents.length === 0 && <p>{ar ? 'لم تُرفع مستندات بعد.' : 'No documents uploaded yet.'}</p>}
            {(status === 'draft' || status === 'correction') && (
              <div className={styles.uploadFields}>
                <label>{ar ? 'نوع المستند' : 'Document type'}
                  <select style={{ display: 'block' }} value={documentType}
                    disabled={documentsBusy} onChange={(event) => setDocumentType(event.target.value as SellerApplicationDocument['document_type'])}>
                    <option value="commercial_registration">{ar ? 'السجل التجاري' : 'Commercial registration'}</option>
                    <option value="vat_certificate">{ar ? 'شهادة ضريبة القيمة المضافة' : 'VAT certificate'}</option>
                    <option value="national_address">{ar ? 'العنوان الوطني' : 'National address'}</option>
                    <option value="iban_certificate">{ar ? 'شهادة الآيبان' : 'IBAN certificate'}</option>
                  </select>
                </label>
                <label>{ar ? 'ملف PDF أو صورة حتى 10 ميجابايت' : 'PDF or image up to 10 MB'}
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    onChange={(event) => setDocumentFile(event.target.files?.[0] ?? null)} />
                </label>
                <button type="button" className={styles.secondaryButton} disabled={documentsBusy || busy || !documentFile}
                  onClick={() => void uploadDocument()}>{ar ? 'رفع المستند' : 'Upload document'}</button>
              </div>
            )}
          </section>
          {status === 'draft' && <button type="button" className={styles.primaryButton} disabled={busy} onClick={() => void sendForReview()}>
            {ar ? 'إرسال للمراجعة' : 'Submit for review'}
          </button>}
        </>
      )}
      </div>
    </Page>
  );
}

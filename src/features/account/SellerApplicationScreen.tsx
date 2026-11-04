import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { isApiError } from '@/shared/api';
import { Link } from 'react-router';
import { routePaths } from '@/shared/lib';
import { Page } from './components/Page';
import { PageHeader } from './components/PageHeader';
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
] as const;

export function SellerApplicationScreen() {
  const { i18n } = useTranslation();
  const ar = i18n.language.startsWith('ar');
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
      <PageHeader title={ar ? 'طلب التسجيل كبائع' : 'Seller application'}
        lead={ar ? 'احفظ البيانات أولًا ثم أرسل الطلب للمراجعة. لا يتم تفعيل المتجر تلقائيًا.' : 'Save your details before submitting for review. Store activation requires approval.'}
        back={<Link to={routePaths.account}>{ar ? 'العودة إلى حسابي' : 'Back to account'}</Link>} />
      {loading ? <p role="status">{ar ? 'جار التحميل…' : 'Loading…'}</p> : (
        <>
          {status && <p role="status">{ar ? 'حالة الطلب: ' : 'Application status: '}{status}</p>}
          {status === 'correction' && reviewNote && <p role="status" style={{ padding: 12, border: '1px solid #d8e1db', borderRadius: 8 }}>
            <strong>{ar ? 'ملاحظات الإدارة للتصحيح:' : 'Administrator correction request:'}</strong>{' '}{reviewNote}
          </p>}
          {status === 'correction' && <p>{ar ? 'عدّلي البيانات واحفظي المسودة ثم أرسليها للمراجعة مرة أخرى.' : 'Edit the information, save a draft, then submit it for review again.'}</p>}
          {error && <p role="alert">{error}</p>}
          {saved && <p role="status">{ar ? 'تم حفظ المسودة.' : 'Draft saved.'}</p>}
          <form onSubmit={(event) => void submit(event)} style={{ display: 'grid', gap: 12 }}>
            {fields.map(([key, en, arabic]) => (
              <label key={key} style={{ display: 'grid', gap: 4 }}>
                <span>{ar ? arabic : en}</span>
                <input
                  required={key !== 'vat_number' && key !== 'national_unified_number'}
                  type={key === 'contact_email' ? 'email' : 'text'}
                  maxLength={key === 'legal_name' ? 180 : key === 'contact_name' ? 120 : key === 'city' ? 100 : key === 'contact_email' ? 180 : 30}
                  value={form[key] ?? ''}
                  disabled={busy || readonly}
                  onChange={(event) => setForm((previous) => ({ ...previous, [key]: event.target.value || null }))}
                />
              </label>
            ))}
            {!readonly && <button type="submit" disabled={busy}>{ar ? 'حفظ المسودة' : 'Save draft'}</button>}
          </form>
          <section style={{ padding: 14, border: '1px solid #d8e1db', borderRadius: 12, marginTop: 16 }}>
            <h2>{ar ? 'مستندات البائع' : 'Seller documents'}</h2>
            <p>{ar ? 'تُحفظ المستندات في التخزين الخاص ولا تُنشر للعامة. ارفعي المستندات بعد حفظ مسودة الطلب وقبل إرسالها للمراجعة.' :
              'Documents are stored privately, not published. Save the application first, then upload documents before submitting for review.'}</p>
            <ul>{documents.map((document) => <li key={document.document_type}>
              {document.document_type.replace(/_/g, ' ')} — {document.original_name} ({(document.size_bytes / 1024).toFixed(0)} KB)
            </li>)}</ul>
            {documents.length === 0 && <p>{ar ? 'لم تُرفع مستندات بعد.' : 'No documents uploaded yet.'}</p>}
            {(status === 'draft' || status === 'correction') && (
              <div style={{ display: 'grid', gap: 10 }}>
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
                <button type="button" disabled={documentsBusy || busy || !documentFile}
                  onClick={() => void uploadDocument()}>{ar ? 'رفع المستند' : 'Upload document'}</button>
              </div>
            )}
          </section>
          {status === 'draft' && <button type="button" disabled={busy} onClick={() => void sendForReview()}>
            {ar ? 'إرسال للمراجعة' : 'Submit for review'}
          </button>}
        </>
      )}
    </Page>
  );
}

import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { routePaths } from '@/shared/lib';
import { Page } from './components/Page';
import { PageHeader } from './components/PageHeader';
import {
  getSellerApplication,
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
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let live = true;
    void getSellerApplication().then((result) => {
      if (!live) return;
      if (result) {
        setStatus(result.status);
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
    }).catch(() => { if (live) setError(true); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy || status === 'submitted' || status === 'reviewed') return;
    setBusy(true); setError(false); setSaved(false);
    try {
      const result = await saveSellerApplication(form);
      setStatus(result.status);
      setSaved(true);
    } catch { setError(true); }
    finally { setBusy(false); }
  };

  const sendForReview = async () => {
    if (busy || status !== 'draft') return;
    setBusy(true); setError(false);
    try {
      const result = await submitSellerApplication();
      setStatus(result.status);
      setSaved(false);
    } catch { setError(true); }
    finally { setBusy(false); }
  };

  const readonly = status !== null && status !== 'draft';
  return (
    <Page>
      <PageHeader title={ar ? 'طلب التسجيل كبائع' : 'Seller application'}
        lead={ar ? 'احفظ البيانات أولًا ثم أرسل الطلب للمراجعة. لا يتم تفعيل المتجر تلقائيًا.' : 'Save your details before submitting for review. Store activation requires approval.'}
        back={<Link to={routePaths.account}>{ar ? 'العودة إلى حسابي' : 'Back to account'}</Link>} />
      {loading ? <p role="status">{ar ? 'جار التحميل…' : 'Loading…'}</p> : (
        <>
          {status && <p role="status">{ar ? 'حالة الطلب: ' : 'Application status: '}{status}</p>}
          {error && <p role="alert">{ar ? 'تعذر إتمام العملية. تحقق من البيانات وحاول مجددًا.' : 'Could not complete your request. Check the fields and retry.'}</p>}
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
          {status === 'draft' && <button type="button" disabled={busy} onClick={() => void sendForReview()}>
            {ar ? 'إرسال للمراجعة' : 'Submit for review'}
          </button>}
        </>
      )}
    </Page>
  );
}

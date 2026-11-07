import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { routePaths } from '@/shared/lib';
import { isApiError } from '@/shared/api';
import { Page } from './components/Page';
import { PageHeader } from './components/PageHeader';
import {
  reviewSellerApplications,
  reviewSellerApplication,
  reviewSellerProducts,
  reviewSellerBranches,
  activateSellerBranch,
  type SellerBranchReview,
  decideSellerApplication,
  decideSellerProduct,
  downloadReviewDocument,
  type SellerReviewApplication,
  type SellerReviewDocument,
  type PendingSellerProduct,
} from './sellerReviewApi';

const panel: React.CSSProperties = {
  padding: 14,
  border: '1px solid #d8e1db',
  borderRadius: 12,
  marginBottom: 12,
};
const fields: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
  alignItems: 'center',
};

export function SellerReviewScreen() {
  const { i18n } = useTranslation();
  const ar = i18n.language.startsWith('ar');
  const tr = (a: string, en: string) => (ar ? a : en);
  const statusLabels: Record<string, string> = {
    draft: tr('مسودة', 'Draft'),
    submitted: tr('مُرسل للمراجعة', 'Submitted for review'),
    pending: tr('بانتظار المراجعة', 'Pending review'),
    pending_review: tr('بانتظار المراجعة', 'Pending review'),
    reviewed: tr('تمت المراجعة', 'Reviewed'),
    correction: tr('بحاجة إلى تعديل', 'Changes requested'),
    approved: tr('معتمد', 'Approved'),
    published: tr('منشور', 'Published'),
    rejected: tr('مرفوض', 'Rejected'),
  };
  const [tab, setTab] = useState<'applications' | 'products' | 'branches'>('applications');
  const [applications, setApplications] = useState<SellerReviewApplication[]>([]);
  const [products, setProducts] = useState<PendingSellerProduct[]>([]);
  const [branches, setBranches] = useState<SellerBranchReview[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [documents, setDocuments] = useState<SellerReviewDocument[]>([]);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    void (
      tab === 'applications'
        ? reviewSellerApplications()
        : tab === 'products'
          ? reviewSellerProducts()
          : reviewSellerBranches()
    )
      .then((reply) => {
        if (!active) return;
        if (tab === 'applications') setApplications(reply.data as SellerReviewApplication[]);
        else if (tab === 'products') setProducts(reply.data as PendingSellerProduct[]);
        else setBranches(reply.data as SellerBranchReview[]);
      })
      .catch((cause) => {
        if (!active) return;
        if (isApiError(cause) && (cause.status === 403 || cause.status === 401))
          setUnauthorized(true);
        else setError(tr('تعذر جلب قائمة المراجعة.', 'Could not load review queue.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // Explicit refresh/tab change controls calls.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, revision]);

  const inspect = async (id: number) => {
    if (busy) return;
    if (selected === id) {
      setSelected(null);
      setDocuments([]);
      return;
    }
    setBusy(true);
    setError('');
    setReason('');
    try {
      const reply = await reviewSellerApplication(id);
      setSelected(id);
      setDocuments(reply.data.documents);
    } catch {
      setError(tr('تعذر جلب تفاصيل طلب البائع.', 'Unable to load application details.'));
    } finally {
      setBusy(false);
    }
  };

  const saveApplicationDecision = async (
    applicationId: number,
    decision: 'approve' | 'correction' | 'reject',
  ) => {
    if (busy || (decision !== 'approve' && reason.trim().length < 10)) return;
    if (!window.confirm(tr('تأكيد قرار مراجعة البائع؟', 'Confirm seller review decision?'))) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await decideSellerApplication(applicationId, decision, reason);
      setSelected(null);
      setDocuments([]);
      setReason('');
      setRevision((v) => v + 1);
      setNotice(tr('تم تسجيل القرار بنجاح.', 'Review decision recorded.'));
    } catch (cause) {
      setError(
        isApiError(cause) && cause.status === 422
          ? tr(
              'اعتماد المتجر يتطلب المستندات الرسمية الأساسية.',
              'Approval requires the essential official documents.',
            )
          : tr(
              'تعذر تسجيل القرار. تحققي من الصلاحيات والحالة الحالية.',
              'Could not record decision. Verify permissions and current status.',
            ),
      );
    } finally {
      setBusy(false);
    }
  };

  const saveProductDecision = async (productId: number, decision: 'publish' | 'reject') => {
    if (busy || (decision === 'reject' && reason.trim().length < 10)) return;
    if (!window.confirm(tr('تأكيد قرار مراجعة المنتج؟', 'Confirm product review decision?')))
      return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await decideSellerProduct(productId, decision, reason);
      setReason('');
      setRevision((v) => v + 1);
      setNotice(tr('تم تسجيل قرار المنتج.', 'Product review recorded.'));
    } catch {
      setError(
        tr(
          'تعذر اعتماد المنتج. تأكدي من الصورة والتصنيف وSKU.',
          'Could not publish product. Check image, category and SKU.',
        ),
      );
    } finally {
      setBusy(false);
    }
  };

  const approveBranch = async (branchId: number) => {
    if (
      busy ||
      !window.confirm(
        tr(
          'تفعيل الفرع بعد التحقق من الموقع؟',
          'Activate this branch after verifying its physical location?',
        ),
      )
    )
      return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await activateSellerBranch(branchId);
      setRevision((value) => value + 1);
      setNotice(tr('تم تفعيل الفرع وتسجيل القرار.', 'Branch activated and review recorded.'));
    } catch {
      setError(
        tr(
          'تعذر تفعيل الفرع. تحققي من الموقع ومنطقة التوصيل.',
          'Could not activate branch. Check location and delivery zone.',
        ),
      );
    } finally {
      setBusy(false);
    }
  };

  const downloadDoc = async (applicationId: number, file: SellerReviewDocument) => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const result = await downloadReviewDocument(applicationId, file.id);
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename ?? 'review-document-' + file.id;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError(tr('تعذر تنزيل المستند الخاص.', 'Unable to download private document.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page>
      <PageHeader
        title={tr('مراجعة البائعين والمنتجات', 'Seller & product approvals')}
        lead={tr(
          'للمراجعين المخولين فقط. تُسجل جميع القرارات للمراجعة اللاحقة.',
          'For authorized reviewers only. Decisions are audited.',
        )}
        back={<Link to={routePaths.account}>{tr('العودة للحساب', 'Back to account')}</Link>}
      />
      {unauthorized ? (
        <p role="alert">
          {tr(
            'ليس لديك صلاحية مراجعة طلبات البائعين. يجب منح صلاحية المراجع من الإدارة.',
            'You do not have Seller reviewer permission. Access must be explicitly granted by an administrator.',
          )}
        </p>
      ) : (
        <>
          <nav
            style={{ ...fields, marginBottom: 12 }}
            aria-label={tr('نوع المراجعة', 'Review type')}
          >
            <button
              type="button"
              onClick={() => {
                setTab('applications');
                setSelected(null);
              }}
              disabled={busy}
            >
              {tr('طلبات البائعين', 'Seller applications')}
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('branches');
                setSelected(null);
              }}
              disabled={busy}
            >
              {tr('الفروع الجديدة', 'New branches')}
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('products');
                setSelected(null);
              }}
              disabled={busy}
            >
              {tr('المنتجات', 'Products')}
            </button>
            <button
              type="button"
              onClick={() => setRevision((v) => v + 1)}
              disabled={busy || loading}
            >
              {tr('تحديث', 'Refresh')}
            </button>
          </nav>
          {error && (
            <p role="alert" style={{ color: '#a52e2e' }}>
              {error}
            </p>
          )}
          {notice && <p role="status">{notice}</p>}
          {loading && <p role="status">{tr('جار التحميل…', 'Loading…')}</p>}
          {!loading && tab === 'applications' && (
            <>
              {applications.length === 0 && (
                <p>{tr('لا توجد طلبات معلقة.', 'No submitted applications.')}</p>
              )}
              {applications.map((item) => (
                <article key={item.id} style={panel}>
                  <h3>{item.legal_name}</h3>
                  <p>
                    {tr('السجل', 'CR')}: {item.commercial_registration} · {tr('المدينة', 'City')}:{' '}
                    {item.city}
                  </p>
                  <p>
                    {tr('الحالة', 'Status')}: {statusLabels[item.status] ?? item.status}
                  </p>
                  <button type="button" disabled={busy} onClick={() => void inspect(item.id)}>
                    {selected === item.id
                      ? tr('إغلاق التفاصيل', 'Close details')
                      : tr('مراجعة المستندات', 'Review documents')}
                  </button>
                  {selected === item.id && (
                    <div style={{ marginTop: 12 }}>
                      <h4>{tr('المستندات', 'Documents')}</h4>
                      {documents.length === 0 && (
                        <p>{tr('لم تُرفع مستندات.', 'No documents uploaded.')}</p>
                      )}
                      <ul>
                        {documents.map((document) => (
                          <li key={document.id}>
                            {document.document_type}: {document.original_name}{' '}
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void downloadDoc(item.id, document)}
                            >
                              {tr('تنزيل آمن', 'Secure download')}
                            </button>
                          </li>
                        ))}
                      </ul>
                      <label style={{ display: 'grid', gap: 6 }}>
                        {tr(
                          'سبب التصحيح أو الرفض (10 أحرف على الأقل)',
                          'Correction/rejection reason (at least 10 characters)',
                        )}
                        <textarea
                          rows={3}
                          maxLength={2000}
                          value={reason}
                          onChange={(event) => setReason(event.target.value)}
                        />
                      </label>
                      <div style={{ ...fields, marginTop: 10 }}>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void saveApplicationDecision(item.id, 'approve')}
                        >
                          {tr('اعتماد البائع', 'Approve seller')}
                        </button>
                        <button
                          type="button"
                          disabled={busy || reason.trim().length < 10}
                          onClick={() => void saveApplicationDecision(item.id, 'correction')}
                        >
                          {tr('طلب تصحيح', 'Request correction')}
                        </button>
                        <button
                          type="button"
                          disabled={busy || reason.trim().length < 10}
                          onClick={() => void saveApplicationDecision(item.id, 'reject')}
                        >
                          {tr('رفض الطلب', 'Reject')}
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </>
          )}
          {!loading && tab === 'branches' && (
            <>
              {branches.length === 0 && (
                <p>{tr('لا توجد فروع قيد الاعتماد.', 'No branches awaiting activation.')}</p>
              )}
              {branches.map((branch) => (
                <article key={branch.id} style={panel}>
                  <h3>{ar ? branch.name_ar : branch.name_en}</h3>
                  <p>
                    {tr('المتجر', 'Store')} #{branch.seller_id} · {tr('رمز الفرع', 'Code')}:{' '}
                    {branch.code}
                  </p>
                  <p>
                    {tr('المنطقة', 'Zone')} #{branch.service_zone_id} ·{' '}
                    {tr('الموقع', 'Coordinates')}: {branch.lat}, {branch.lng}
                  </p>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void approveBranch(branch.id)}
                  >
                    {tr('اعتماد وتفعيل الفرع', 'Approve & activate')}
                  </button>
                </article>
              ))}
            </>
          )}
          {!loading && tab === 'products' && (
            <>
              {products.length === 0 && (
                <p>{tr('لا توجد منتجات قيد المراجعة.', 'No pending products.')}</p>
              )}
              {products.map((item) => (
                <article key={item.id} style={panel}>
                  <h3>{ar ? item.name_ar : item.name_en}</h3>
                  <p>
                    {tr('البائع', 'Seller')} #{item.seller_id} · {tr('السعر', 'Price')}:{' '}
                    {(item.price_halalas / 100).toFixed(2)} SAR
                  </p>
                  <p>
                    {item.image_path
                      ? tr('صورة الغلاف موجودة', 'Cover image attached')
                      : tr('صورة الغلاف مفقودة', 'Cover image missing')}
                  </p>
                  <label style={{ display: 'grid', gap: 6 }}>
                    {tr('سبب الرفض', 'Rejection reason')}
                    <textarea
                      rows={2}
                      maxLength={2000}
                      value={selected === item.id ? reason : ''}
                      onFocus={() => {
                        if (selected !== item.id) {
                          setSelected(item.id);
                          setReason('');
                        }
                      }}
                      onChange={(event) => {
                        setSelected(item.id);
                        setReason(event.target.value);
                      }}
                    />
                  </label>
                  <div style={{ ...fields, marginTop: 10 }}>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void saveProductDecision(item.id, 'publish')}
                    >
                      {tr('نشر المنتج', 'Publish')}
                    </button>
                    <button
                      type="button"
                      disabled={busy || selected !== item.id || reason.trim().length < 10}
                      onClick={() => void saveProductDecision(item.id, 'reject')}
                    >
                      {tr('رفض المنتج', 'Reject')}
                    </button>
                  </div>
                </article>
              ))}
            </>
          )}
        </>
      )}
    </Page>
  );
}

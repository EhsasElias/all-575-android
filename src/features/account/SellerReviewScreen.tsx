import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { isApiError } from '@/shared/api';
import { Page } from './components/Page';
import { PageHeader } from './components/PageHeader';
import styles from './SellerReviewScreen.module.css';
import './adminWorkspaceFamily.css';
import {
  reviewOverview,
  type ReviewOverview,
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
  reviewCategories,
  createManagedCategory,
  updateManagedCategory,
  deleteManagedCategory,
  reviewCategoryRequests,
  decideCategoryRequest,
  type ManagedCategory,
  type CategoryRequestReview,
} from './sellerReviewApi';

const panel: React.CSSProperties = {
  padding: 18,
  background: 'var(--color-surface, #fff)',
  border: '1px solid var(--color-border, #d8e1db)',
  borderRadius: 14,
  boxShadow: '0 2px 10px rgba(10, 60, 31, 0.04)',
  marginBottom: 14,
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
  const [overview, setOverview] = useState<ReviewOverview | null>(null);
  const [query, setQuery] = useState('');
  const [applicationStatus, setApplicationStatus] = useState('submitted');
  const [recordDate, setRecordDate] = useState('');
  const [categoryStatus, setCategoryStatus] = useState('pending');
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab');
  const tab = (['applications','products','branches','categories'].includes(currentTab ?? '')
    ? currentTab : 'applications') as 'applications' | 'products' | 'branches' | 'categories';
  const [applications, setApplications] = useState<SellerReviewApplication[]>([]);
  const [products, setProducts] = useState<PendingSellerProduct[]>([]);
  const [branches, setBranches] = useState<SellerBranchReview[]>([]);
  const [categories, setCategories] = useState<ManagedCategory[]>([]);
  const [categoryRequests, setCategoryRequests] = useState<CategoryRequestReview[]>([]);
  const [categoryFormId, setCategoryFormId] = useState<number | null>(null);
  const [categoryParent, setCategoryParent] = useState('');
  const [categoryAr, setCategoryAr] = useState('');
  const [categoryEn, setCategoryEn] = useState('');
  const [categorySort, setCategorySort] = useState('0');
  const [categoryReviewNotes, setCategoryReviewNotes] = useState<Record<number, string>>({});

  const [selected, setSelected] = useState<number | null>(null);
  const [documents, setDocuments] = useState<SellerReviewDocument[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<SellerReviewApplication | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    void reviewOverview().then(result => {
      if (active) setOverview(result.data);
    }).catch(() => {
      if (active) setOverview(null);
    });
    return () => { active = false; };
  }, [revision]);

  useEffect(() => {
    if (tab === 'categories') return;
    let active = true;
    setLoading(true);
    setError('');
    void (
      tab === 'applications'
        ? reviewSellerApplications(applicationStatus)
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
  }, [tab, revision, applicationStatus]);

  useEffect(() => {
    if (tab !== 'categories') return;
    let active = true;
    setLoading(true);
    setError('');
    void Promise.all([reviewCategories(), reviewCategoryRequests()])
      .then(([categoryResult, requestsResult]) => {
        if (!active) return;
        setCategories(categoryResult.data);
        setCategoryRequests(requestsResult.data);
      })
      .catch((cause) => {
        if (!active) return;
        if (isApiError(cause) && (cause.status === 401 || cause.status === 403)) setUnauthorized(true);
        else setError(tr('تعذر تحميل التصنيفات وطلباتها.', 'Could not load categories and requests.'));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
    // Explicit refresh/tab change controls requests.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, revision]);

  const matched = (value: unknown) => String(value ?? '').toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
  const matchesDate = (date?: string | null) => !recordDate || Boolean(date?.startsWith(recordDate));
  const shownApplications = useMemo(() => applications.filter(item =>
    (matched(item.legal_name) || matched(item.commercial_registration) || matched(item.city) || matched(item.contact_name))
    && matchesDate(item.submitted_at)
  ), [applications, query, recordDate]);
  const shownProducts = useMemo(() => products.filter(item =>
    (matched(item.name_ar) || matched(item.name_en) || matched(item.seller_id) || matched(item.category_id))
    && matchesDate(item.created_at)
  ), [products, query, recordDate]);
  const shownBranches = useMemo(() => branches.filter(item =>
    (matched(item.name_ar) || matched(item.name_en) || matched(item.code) || matched(item.seller_id))
    && matchesDate(item.created_at)
  ), [branches, query, recordDate]);
  const shownCategories = useMemo(() => categories.filter(item =>
    matched(item.name_ar) || matched(item.name_en) || matched(item.id)
  ), [categories, query]);
  const shownRequests = useMemo(() => categoryRequests.filter(item =>
    (categoryStatus === 'all' || item.status === categoryStatus)
    && (matched(item.name_ar) || matched(item.name_en) || matched(item.seller_id))
    && matchesDate(item.created_at)
  ), [categoryRequests, query, recordDate, categoryStatus]);

  const displayDate = (date?: string | null) => date
    ? new Date(date).toLocaleDateString(ar ? 'ar-SA' : 'en-GB')
    : '—';

  const saveCategory = async () => {
    if (busy || !categoryAr.trim() || !categoryEn.trim()) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const input = {
        parent_id: categoryParent ? Number(categoryParent) : null,
        name_ar: categoryAr.trim(), name_en: categoryEn.trim(),
        sort_order: Number(categorySort) || 0,
      };
      if (categoryFormId !== null) await updateManagedCategory(categoryFormId, input);
      else await createManagedCategory(input);
      setCategoryFormId(null); setCategoryParent(''); setCategoryAr(''); setCategoryEn(''); setCategorySort('0');
      setNotice(tr('تم حفظ التصنيف.', 'Category saved.'));
      setRevision((v) => v + 1);
    } catch {
      setError(tr('تعذر حفظ التصنيف. تحقق من الأسماء والتصنيف الرئيسي.', 'Could not save category. Check names and parent category.'));
    } finally { setBusy(false); }
  };

  const categoryAction = async (id: number, action: 'delete' | 'disable' | 'enable') => {
    if (busy || !window.confirm(tr('تأكيد تعديل حالة التصنيف؟', 'Confirm category change?'))) return;
    setBusy(true); setError(''); setNotice('');
    try {
      if (action === 'delete') await deleteManagedCategory(id);
      else await updateManagedCategory(id, { is_active: action === 'enable' });
      setNotice(tr('تم تحديث التصنيف.', 'Category updated.'));
      setRevision((v) => v + 1);
    } catch {
      setError(tr('تعذر حذف أو تعطيل التصنيف لأنه قد يحتوي منتجات أو تصنيفات فرعية.', 'Category may have products or children. Move them before removing or disabling it.'));
    } finally { setBusy(false); }
  };

  const categoryRequestDecision = async (id: number, decision: 'approve' | 'reject') => {
    if (busy || !window.confirm(tr('تأكيد قرار طلب التصنيف؟', 'Confirm category request decision?'))) return;
    const note = categoryReviewNotes[id]?.trim();
    if (decision === 'reject' && !note) {
      setError(tr('اكتب سبب الرفض.', 'Enter a rejection reason.'));
      return;
    }
    setBusy(true); setError(''); setNotice('');
    try {
      await decideCategoryRequest(id, decision, note);
      setNotice(tr('تم تسجيل قرار طلب التصنيف.', 'Category request decision recorded.'));
      setRevision((v) => v + 1);
    } catch {
      setError(tr('تعذر تنفيذ الطلب، ربما الاسم مكرر أو تمت مراجعته سابقًا.', 'Could not process request. The name may be duplicated or already reviewed.'));
    } finally { setBusy(false); }
  };

  const inspect = async (id: number) => {
    if (busy) return;
    if (selected === id) {
      setSelected(null);
      setDocuments([]);
      setSelectedApplication(null);
      return;
    }
    setBusy(true);
    setError('');
    setReason('');
    try {
      const reply = await reviewSellerApplication(id);
      setSelected(id);
      setDocuments(reply.data.documents);
      setSelectedApplication(reply.data.application);
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
      setSelectedApplication(null);
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
          'تعذر اعتماد المنتج. تأكد من الصورة والتصنيف وSKU.',
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
      <div className={styles.review + ' admin-workspace-family'} dir={ar ? 'rtl' : 'ltr'}>
      <PageHeader
        title={tr('مراجعة البائعين والمنتجات', 'Seller & product approvals')}
        lead={tr(
          'للمراجعين المخولين فقط. تُسجل جميع القرارات للمراجعة اللاحقة.',
          'For authorized reviewers only. Decisions are audited.',
        )}
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
          <div className={styles.summary + ' admin-family-metrics'}>
            <div><span>{tr('طلبات البائعين', 'Seller applications')}</span><strong>{overview?.pending_applications ?? '—'}</strong></div>
            <div><span>{tr('الفروع', 'Branches')}</span><strong>{overview?.pending_branches ?? '—'}</strong></div>
            <div><span>{tr('المنتجات', 'Products')}</span><strong>{overview?.pending_products ?? '—'}</strong></div>
            <div><span>{tr('طلبات التصنيفات', 'Category requests')}</span><strong>{overview?.pending_categories ?? '—'}</strong></div>
          </div>
          <div className={styles.reviewToolbar}>
            <h2>{tr(tab === 'applications' ? 'طلبات البائعين' : tab === 'branches' ? 'الفروع الجديدة' : tab === 'products' ? 'مراجعة المنتجات' : 'إدارة التصنيفات',
              tab === 'applications' ? 'Seller applications' : tab === 'branches' ? 'New branches' : tab === 'products' ? 'Product approvals' : 'Manage categories')}</h2>
            <button type="button" className="admin-family-primary" disabled={busy || loading} onClick={() => setRevision(value => value + 1)}>↻ {tr('تحديث', 'Refresh')}</button>
          </div>
          <div className={styles.filters + ' admin-family-filters'} role="search">
            <label>{tr('بحث', 'Search')}
              <input value={query} onChange={event => setQuery(event.target.value)}
                placeholder={tr('اسم أو رقم أو سجل تجاري...', 'Name, ID, registration...')}/>
            </label>
            {tab === 'applications' && (
              <label>{tr('حالة الطلب', 'Application status')}
                <select value={applicationStatus} onChange={event => { setApplicationStatus(event.target.value); setSelected(null); }}>
                  <option value="submitted">{tr('قيد المراجعة', 'Submitted')}</option>
                  <option value="correction">{tr('تحتاج تصحيح', 'Needs correction')}</option>
                  <option value="approved">{tr('معتمد', 'Approved')}</option>
                  <option value="rejected">{tr('مرفوض', 'Rejected')}</option>
                </select>
              </label>
            )}
            {tab === 'categories' && (
              <label>{tr('حالة طلب التصنيف', 'Category request status')}
                <select value={categoryStatus} onChange={event => setCategoryStatus(event.target.value)}>
                  <option value="pending">{tr('قيد المراجعة', 'Pending')}</option>
                  <option value="approved">{tr('معتمد', 'Approved')}</option>
                  <option value="rejected">{tr('مرفوض', 'Rejected')}</option>
                  <option value="all">{tr('الكل', 'All')}</option>
                </select>
              </label>
            )}
            <label>{tr('تاريخ التقديم', 'Submitted date')}
              <input type="date" value={recordDate} onChange={event => setRecordDate(event.target.value)}/>
            </label>
            <button type="button" onClick={() => { setQuery(''); setRecordDate(''); setApplicationStatus('submitted'); setCategoryStatus('pending'); }}>
              {tr('مسح الفلاتر', 'Clear filters')}
            </button>
          </div>
          {error && (
            <p role="alert" style={{ color: '#a52e2e' }}>
              {error}
            </p>
          )}
          {notice && <p role="status">{notice}</p>}
          {loading && <p role="status">{tr('جار التحميل…', 'Loading…')}</p>}
          {!loading && <p className={styles.resultCount}>{tr('النتائج المعروضة', 'Displayed results')}: {tab === 'applications' ? shownApplications.length : tab === 'branches' ? shownBranches.length : tab === 'products' ? shownProducts.length : shownRequests.length}</p>}
          {!loading && tab === 'applications' && (
            <>
              {shownApplications.length === 0 && (
                <p>{tr('لا توجد طلبات معلقة.', 'No submitted applications.')}</p>
              )}
              {shownApplications.map((item) => (
                <article key={item.id} style={panel} className="admin-family-card">
                  <div className={styles.itemHeading}><h3>{item.legal_name}</h3><span className={styles.statusBadge} data-status={item.status}>{statusLabels[item.status] ?? item.status}</span></div>
                  <p>
                    {tr('السجل', 'CR')}: {item.commercial_registration} · {tr('المدينة', 'City')}:{' '}
                    {item.city}
                  </p>
                  <p>{tr('تاريخ التقديم', 'Submitted')}: {displayDate(item.submitted_at)} · {tr('رقم الطلب', 'Application')} #{item.id}</p>
                  <button type="button" disabled={busy} onClick={() => void inspect(item.id)}>
                    {selected === item.id
                      ? tr('إغلاق التفاصيل', 'Close details')
                      : tr('مراجعة المستندات', 'Review documents')}
                  </button>
                  {selected === item.id && (
                    <div className={styles.expandedDetails}>
                      <h4>{tr('تفاصيل الطلب', 'Application details')}</h4>
                      <dl className={styles.detailGrid}>
                        <div><dt>{tr('الاسم القانوني', 'Legal name')}</dt><dd>{selectedApplication?.legal_name || '—'}</dd></div>
                        <div><dt>{tr('المسؤول', 'Contact person')}</dt><dd>{selectedApplication?.contact_name || '—'}</dd></div>
                        <div><dt>{tr('السجل التجاري', 'Commercial registration')}</dt><dd>{selectedApplication?.commercial_registration || '—'}</dd></div>
                        <div><dt>{tr('المدينة', 'City')}</dt><dd>{selectedApplication?.city || '—'}</dd></div>
                      </dl>
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
                      {item.status === 'submitted' && <div style={{ ...fields, marginTop: 10 }}>
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
                      </div>}
                      {item.status !== 'submitted' && <p>{tr('تمت معالجة هذا الطلب؛ الإجراءات متاحة للطلبات المرسلة فقط.', 'This application has already been reviewed; decisions are available only for submitted requests.')}</p>}
                    </div>
                  )}
                </article>
              ))}
            </>
          )}
          {!loading && tab === 'branches' && (
            <>
              {shownBranches.length === 0 && (
                <p>{tr('لا توجد فروع قيد الاعتماد.', 'No branches awaiting activation.')}</p>
              )}
              {shownBranches.map((branch) => (
                <article key={branch.id} style={panel} className="admin-family-card">
                  <div className={styles.itemHeading}><h3>{ar ? branch.name_ar : branch.name_en}</h3><span className={styles.statusBadge} data-status="pending">{tr('بانتظار التفعيل', 'Awaiting activation')}</span></div>
                  <p>
                    {tr('المتجر', 'Store')} #{branch.seller_id} · {tr('رمز الفرع', 'Code')}:{' '}
                    {branch.code}
                  </p>
                  <p>
                    {tr('المنطقة', 'Zone')} #{branch.service_zone_id} ·{' '}
                    {tr('الموقع', 'Coordinates')}: {branch.lat}, {branch.lng}
                  </p>
                  <p>{tr('تاريخ الإنشاء', 'Created')}: {displayDate(branch.created_at)}</p>
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
              {shownProducts.length === 0 && (
                <p>{tr('لا توجد منتجات قيد المراجعة.', 'No pending products.')}</p>
              )}
              {shownProducts.map((item) => (
                <article key={item.id} style={panel} className="admin-family-card">
                  <div className={styles.itemHeading}><h3>{ar ? item.name_ar : item.name_en}</h3><span className={styles.statusBadge} data-status="pending_review">{tr('بانتظار المراجعة', 'Pending review')}</span></div>
                  <p>
                    {tr('البائع', 'Seller')} #{item.seller_id} · {tr('السعر', 'Price')}:{' '}
                    {(item.price_halalas / 100).toFixed(2)} SAR
                  </p>
                  <p>{tr('التصنيف', 'Category')} #{item.category_id} · {tr('تاريخ الإرسال', 'Submitted')}: {displayDate(item.created_at)}</p>
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
          {!loading && tab === 'categories' && (
            <section>
              <article style={panel} className="admin-family-card">
                <h3>{categoryFormId === null
                  ? tr('إضافة تصنيف رئيسي أو فرعي', 'Add parent category or subcategory')
                  : tr('تعديل التصنيف', 'Edit category')}</h3>
                <div style={fields}>
                  <label style={{ display: 'grid', gap: 4, flex: 1 }}>
                    {tr('التصنيف الرئيسي', 'Parent category')}
                    <select value={categoryParent} onChange={(event) => setCategoryParent(event.target.value)}>
                      <option value="">{tr('تصنيف رئيسي', 'Top-level category')}</option>
                      {categories.filter((item) => item.parent_id === null && item.id !== categoryFormId && item.is_active)
                        .map((item) => <option key={item.id} value={item.id}>{ar ? item.name_ar : item.name_en}</option>)}
                    </select>
                  </label>
                  <label style={{ display: 'grid', gap: 4, flex: 1 }}>
                    {tr('الاسم بالعربية', 'Arabic name')}
                    <input value={categoryAr} maxLength={180} onChange={(event) => setCategoryAr(event.target.value)}/>
                  </label>
                  <label style={{ display: 'grid', gap: 4, flex: 1 }}>
                    {tr('الاسم بالإنجليزية', 'English name')}
                    <input value={categoryEn} maxLength={180} onChange={(event) => setCategoryEn(event.target.value)}/>
                  </label>
                  <label style={{ display: 'grid', gap: 4, flex: 1 }}>
                    {tr('الترتيب', 'Sort order')}
                    <input type="number" min={0} max={10000} value={categorySort}
                      onChange={(event) => setCategorySort(event.target.value)}/>
                  </label>
                </div>
                <div style={{ ...fields, marginTop: 10 }}>
                  <button type="button" disabled={busy || !categoryAr.trim() || !categoryEn.trim()}
                    onClick={() => void saveCategory()}>
                    {categoryFormId === null ? tr('إضافة التصنيف', 'Add category') : tr('حفظ التعديلات', 'Save changes')}
                  </button>
                  {categoryFormId !== null && <button type="button" onClick={() => {
                    setCategoryFormId(null); setCategoryParent(''); setCategoryAr(''); setCategoryEn(''); setCategorySort('0');
                  }}>{tr('إلغاء التعديل', 'Cancel edit')}</button>}
                </div>
              </article>
              <article style={panel} className="admin-family-card">
                <h3>{tr('التصنيفات الحالية', 'Current categories')}</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', textAlign: ar ? 'right' : 'left' }}>
                    <thead><tr><th>{tr('التصنيف', 'Category')}</th><th>{tr('النوع', 'Type')}</th>
                      <th>{tr('الحالة', 'Status')}</th><th>{tr('الإجراءات', 'Actions')}</th></tr></thead>
                    <tbody>
                      {shownCategories.map((item) => (
                        <tr key={item.id}>
                          <td>{ar ? item.name_ar : item.name_en}</td>
                          <td>{item.parent_id === null ? tr('رئيسي', 'Parent') : tr('فرعي', 'Subcategory')}</td>
                          <td>{item.is_active ? tr('نشط', 'Active') : tr('معطل', 'Inactive')}</td>
                          <td>
                            <div style={fields}>
                              <button type="button" disabled={busy} onClick={() => {
                                setCategoryFormId(item.id); setCategoryParent(String(item.parent_id ?? ''));
                                setCategoryAr(item.name_ar); setCategoryEn(item.name_en);
                                setCategorySort(String(item.sort_order));
                              }}>{tr('تعديل', 'Edit')}</button>
                              <button type="button" disabled={busy} onClick={() =>
                                void categoryAction(item.id, item.is_active ? 'disable' : 'enable')}>
                                {item.is_active ? tr('تعطيل', 'Disable') : tr('تفعيل', 'Enable')}
                              </button>
                              <button type="button" disabled={busy} onClick={() => void categoryAction(item.id, 'delete')}>
                                {tr('حذف', 'Delete')}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
              <article style={panel} className="admin-family-card">
                <h3>{tr('طلبات التصنيفات من البائعين', 'Seller category requests')}</h3>
                {shownRequests.length === 0
                  && <p>{tr('لا توجد طلبات معلقة.', 'No pending requests.')}</p>}
                {shownRequests.map((item) => (
                  <div key={item.id} style={{ ...panel, marginTop: 8 }}>
                    <div className={styles.itemHeading}><strong>{ar ? item.name_ar : item.name_en}</strong><span className={styles.statusBadge} data-status={item.status}>{statusLabels[item.status] ?? item.status}</span></div>
                    <p>{tr('المتجر', 'Store')} #{item.seller_id} · {item.parent_id === null
                      ? tr('تصنيف رئيسي', 'Parent category') : tr('تصنيف فرعي', 'Subcategory')} ·
                      {item.reason ?? ''}</p>
                    <p>{tr('تاريخ الطلب', 'Requested')}: {displayDate(item.created_at)}</p>
                    <label style={{ display: 'grid', gap: 4 }}>
                      {tr('ملاحظة / سبب الرفض', 'Review note / rejection reason')}
                      <textarea rows={2} maxLength={1000} value={categoryReviewNotes[item.id] ?? ''}
                        onChange={(event) => setCategoryReviewNotes((old) => ({ ...old, [item.id]: event.target.value }))}/>
                    </label>
                    {item.status === 'pending' && <div style={{ ...fields, marginTop: 8 }}>
                      <button type="button" disabled={busy} onClick={() => void categoryRequestDecision(item.id, 'approve')}>
                        {tr('اعتماد وإضافة التصنيف', 'Approve & create category')}
                      </button>
                      <button type="button" disabled={busy || !(categoryReviewNotes[item.id]?.trim())}
                        onClick={() => void categoryRequestDecision(item.id, 'reject')}>
                        {tr('رفض الطلب', 'Reject')}
                      </button>
                    </div>}
                  </div>
                ))}
              </article>
            </section>
          )}
          {overview && overview.recent_decisions.length > 0 && (
            <section className={styles.audit}>
              <h2>{tr('آخر قرارات المراجعة', 'Recent review decisions')}</h2>
              <div className={styles.auditItems}>
                {overview.recent_decisions.map(entry => (
                  <div key={entry.id} className={styles.auditRow}>
                    <div><strong>{entry.subject_type} #{entry.subject_id}</strong>
                      <span>{entry.previous_status} → {entry.new_status}</span>
                    </div>
                    <time>{displayDate(entry.created_at)}</time>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
      </div>
    </Page>
  );
}

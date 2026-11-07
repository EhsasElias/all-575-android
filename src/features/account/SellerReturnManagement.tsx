import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { isApiError } from '@/shared/api';
import { respondSellerReturn, sellerReturns, type SellerReturnCase } from './sellerWorkspaceApi';


type ReturnFilter = 'all' | 'submitted' | 'in_review' | 'resolved' | 'rejected';

export function SellerReturnManagement() {
  const { i18n } = useTranslation();
  const ar = i18n.language.startsWith('ar');
  const tr = (arabic: string, english: string) => (ar ? arabic : english);
  const [filter, setFilter] = useState<ReturnFilter>('all');
  const [cases, setCases] = useState<SellerReturnCase[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [position, setPosition] = useState<'accept' | 'dispute'>('accept');
  const [explanation, setExplanation] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    void sellerReturns({ limit: 50, ...(filter !== 'all' ? { status: filter } : {}) })
      .then((response) => {
        if (!active) return;
        setCases(response.data);
        setHasMore(response.data.length === 50);
      })
      .catch(() => {
        if (active) setError(tr('تعذر تحميل طلبات الإرجاع.', 'Could not load return cases.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // Requests depend on the selected filter and explicit refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, revision]);

  const loadMore = async () => {
    const last = cases[cases.length - 1];
    if (!last || loading || busy) return;
    setBusy(true);
    setError('');
    try {
      const result = await sellerReturns({
        limit: 50,
        before_id: last.id,
        ...(filter !== 'all' ? { status: filter } : {}),
      });
      setCases((current) => {
        const seen = new Set(current.map((item) => item.id));
        return [...current, ...result.data.filter((item) => !seen.has(item.id))];
      });
      setHasMore(result.data.length === 50);
    } catch {
      setError(tr('تعذر تحميل المزيد.', 'Could not load more cases.'));
    } finally {
      setBusy(false);
    }
  };

  const respond = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected || busy || explanation.trim().length < 10) return;
    if (
      !window.confirm(
        tr(
          'تأكيد إرسال رد البائع؟ لا يمكن تعديل الرد بعد الإرسال.',
          'Submit your seller response? It cannot be edited afterward.',
        ),
      )
    )
      return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await respondSellerReturn(selected, position, explanation.trim());
      setSelected(null);
      setExplanation('');
      setNotice(
        tr(
          'تم تسجيل رد البائع. القرار النهائي للجهة المختصة وليس هنا.',
          'Seller response recorded. The final return decision remains with the authorized aftercare team.',
        ),
      );
      setRevision((value) => value + 1);
    } catch (cause) {
      const conflict = isApiError(cause) && (cause.status === 409 || cause.status === 404);
      setError(
        conflict
          ? tr(
              'ربما تم الرد مسبقًا أو تغيرت حالة الطلب. حدّث القائمة.',
              'A response may already exist or the case changed. Refresh the list.',
            )
          : tr(
              'تعذر إرسال الرد. تحققي من الصلاحيات والبيانات.',
              'Could not send response. Check permissions and input.',
            ),
      );
    } finally {
      setBusy(false);
    }
  };

  const labels: Record<string, string> = {
    submitted: tr('جديد', 'Submitted'),
    in_review: tr('قيد المراجعة', 'In review'),
    resolved: tr('تمت المعالجة', 'Resolved'),
    rejected: tr('مرفوض', 'Rejected'),
  };

  return (
    <section className="seller-returns-section" aria-labelledby="seller-returns-title">
      <header className="seller-returns-header">
        <div>
          <span className="seller-returns-eyebrow">{tr('متابعة ما بعد البيع', 'After-sales management')}</span>
          <h2 id="seller-returns-title">{tr('طلبات الإرجاع', 'Return requests')}</h2>
          <p>{tr(
            'راجع الطلبات وسجّل رد المتجر. اعتماد الإرجاع والاسترداد المالي يتمان من الجهة المختصة.',
            'Review requests and record your store response. Final approval and refunds are handled by the authorized team.',
          )}</p>
        </div>
      </header>

      <div className="seller-returns-toolbar">
        <label htmlFor="seller-return-status">
          {tr('تصفية حسب الحالة', 'Filter by status')}
          <select id="seller-return-status" value={filter} disabled={busy}
            onChange={(event) => {
              setFilter(event.target.value as ReturnFilter);
              setSelected(null);
            }}>
            <option value="all">{tr('كل الحالات', 'All statuses')}</option>
            {(['submitted', 'in_review', 'resolved', 'rejected'] as const).map((status) => (
              <option key={status} value={status}>{labels[status]}</option>
            ))}
          </select>
        </label>
        <button type="button" className="seller-returns-refresh" disabled={loading || busy}
          onClick={() => setRevision((value) => value + 1)}>
          {tr('تحديث القائمة', 'Refresh list')}
        </button>
      </div>

      {error && <p role="alert" className="seller-returns-error">{error}</p>}
      {notice && <p role="status" className="seller-form-success">{notice}</p>}
      {loading && <p role="status" className="seller-returns-loading">{tr('جار تحميل طلبات الإرجاع…', 'Loading return requests…')}</p>}

      {!loading && cases.length === 0 && (
        <div className="seller-returns-empty" role="status">
          <svg aria-hidden="true" width="42" height="42" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="16" rx="3" />
            <path d="M8 10h8M8 14h5"/>
          </svg>
          <h3>{tr('لا توجد طلبات إرجاع مطابقة', 'No matching return requests')}</h3>
          <p>{tr(
            filter === 'all' ? 'ستظهر طلبات الإرجاع الجديدة هنا عند وصولها.' : 'لا توجد طلبات بهذه الحالة. يمكنك اختيار كل الحالات.',
            filter === 'all' ? 'New return requests will appear here.' : 'No requests have this status. Try All statuses.',
          )}</p>
          {filter !== 'all' && (
            <button type="button" onClick={() => setFilter('all')}>
              {tr('عرض كل الحالات', 'Show all statuses')}
            </button>
          )}
        </div>
      )}

      {!loading && cases.length > 0 && (
        <div className="seller-returns-grid">
          {cases.map((item) => (
            <article key={item.id} className="seller-return-card">
              <div className="seller-return-card-head">
                <div className="seller-return-product">
                  <span className="seller-returns-eyebrow">{tr('منتج الإرجاع', 'Returned product')}</span>
                  <h3>{ar ? item.name_ar : item.name_en}</h3>
                </div>
                <span className={'seller-return-status seller-return-status-' + item.status}>
                  {labels[item.status] ?? item.status}
                </span>
              </div>

              <div className="seller-return-details">
                <div>
                  <span>{tr('الكمية', 'Quantity')}</span>
                  <strong>{item.quantity}</strong>
                </div>
                <div>
                  <span>{tr('الفرع', 'Branch')}</span>
                  <strong>#{item.branch_id}</strong>
                </div>
                <div className="seller-return-date">
                  <span>{tr('تاريخ الطلب', 'Requested')}</span>
                  <bdi>{item.created_at}</bdi>
                </div>
              </div>
              <div className="seller-return-reason">
                <span>{tr('سبب الإرجاع', 'Return reason')}</span>
                <p>{item.subject}</p>
              </div>

              {Boolean(item.seller_responded) && (
                <p role="status" className="seller-return-responded">
                  {tr('تم تسجيل رد المتجر مسبقًا.', 'Store response already recorded.')}
                </p>
              )}

              {!Boolean(item.seller_responded) &&
                (item.status === 'submitted' || item.status === 'in_review') && (
                  <div className="seller-return-response-area">
                    <button type="button" className="seller-return-response-toggle"
                      aria-expanded={selected === item.id} disabled={busy}
                      onClick={() => {
                        setSelected(selected === item.id ? null : item.id);
                        setExplanation('');
                        setPosition('accept');
                      }}>
                      {selected === item.id ? tr('إغلاق الرد', 'Close response') : tr('الرد على طلب الإرجاع', 'Respond to request')}
                    </button>
                    {selected === item.id && (
                      <form className="seller-return-response-form"
                        onSubmit={(event) => void respond(event)}>
                        <p className="seller-return-form-help">{tr(
                          'اختر موقف المتجر وأضف توضيحًا قبل إرسال الرد. لا يمكن تعديل الرد بعد الإرسال.',
                          'Choose the store position and add an explanation. A submitted response cannot be edited.',
                        )}</p>
                        <label>
                          {tr('موقف المتجر *', 'Store position *')}
                          <select value={position} disabled={busy}
                            onChange={(event) => setPosition(event.target.value as 'accept' | 'dispute')}>
                            <option value="accept">{tr('موافقة مبدئية', 'Preliminary acceptance')}</option>
                            <option value="dispute">{tr('اعتراض مع التوضيح', 'Dispute with explanation')}</option>
                          </select>
                        </label>
                        <label>
                          {tr('التوضيح *', 'Explanation *')}
                          <textarea required minLength={10} maxLength={2000} rows={4}
                            value={explanation} disabled={busy}
                            onChange={(event) => setExplanation(event.target.value)}
                            placeholder={tr('اكتب تفاصيل رد المتجر بوضوح (10 أحرف على الأقل)', 'Describe the store response (at least 10 characters)')}/>
                        </label>
                        <div className="seller-return-form-actions">
                          <button type="button" disabled={busy} onClick={() => setSelected(null)}>
                            {tr('إلغاء', 'Cancel')}
                          </button>
                          <button type="submit" className="seller-return-submit"
                            disabled={busy || explanation.trim().length < 10}>
                            {busy ? tr('جار الإرسال…', 'Submitting…') : tr('تأكيد إرسال الرد', 'Submit response')}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
            </article>
          ))}
        </div>
      )}
      {!loading && hasMore && (
        <button type="button" className="seller-returns-more" disabled={busy}
          onClick={() => void loadMore()}>
          {busy ? tr('جار التحميل…', 'Loading…') : tr('عرض المزيد', 'Load more')}
        </button>
      )}
    </section>
  );
}

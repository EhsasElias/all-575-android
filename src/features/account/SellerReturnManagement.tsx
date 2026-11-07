import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { isApiError } from '@/shared/api';
import { respondSellerReturn, sellerReturns, type SellerReturnCase } from './sellerWorkspaceApi';

const card: React.CSSProperties = {
  padding: 14,
  border: '1px solid #d8e1db',
  borderRadius: 12,
  marginBottom: 12,
};
const action: React.CSSProperties = { padding: '9px 12px', borderRadius: 9 };

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
    <section>
      <h2>{tr('طلبات الإرجاع', 'Return requests')}</h2>
      <p>
        {tr(
          'يمكن للمالك أو مدير الفرع تسجيل موقفه من طلب الإرجاع. لا يتم إصدار استرداد مالي أو اعتماد قرار نهائي من هنا.',
          'Owners and branch managers may record a response. This screen does not approve refunds or make final return decisions.',
        )}
      </p>
      <div
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: 12,
        }}
      >
        <label>
          {tr('الحالة', 'Status')}{' '}
          <select
            value={filter}
            onChange={(event) => {
              setFilter(event.target.value as ReturnFilter);
              setSelected(null);
            }}
          >
            <option value="all">{tr('كل الحالات', 'All statuses')}</option>
            {(['submitted', 'in_review', 'resolved', 'rejected'] as const).map((status) => (
              <option key={status} value={status}>
                {labels[status]}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          style={action}
          disabled={loading || busy}
          onClick={() => setRevision((value) => value + 1)}
        >
          {tr('تحديث', 'Refresh')}
        </button>
      </div>
      {error && (
        <p role="alert" style={{ color: '#a52e2e' }}>
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      {loading && <p role="status">{tr('جار التحميل…', 'Loading…')}</p>}
      {!loading && cases.length === 0 && (
        <p>{tr('لا توجد طلبات إرجاع مطابقة.', 'No return cases match.')}</p>
      )}
      {!loading &&
        cases.map((item) => (
          <article key={item.id} style={card}>
            <strong>{ar ? item.name_ar : item.name_en}</strong>
            <p>
              {tr('الحالة', 'Status')}: {labels[item.status] ?? item.status} ·{' '}
              {tr('الكمية', 'Quantity')}: {item.quantity}
            </p>
            <p>
              {tr('السبب', 'Reason')}: {item.subject}
            </p>
            <small>
              {tr('الفرع', 'Branch')} #{item.branch_id} · {item.created_at}
            </small>
            {Boolean(item.seller_responded) && (
              <p role="status" className="seller-form-success">
                {tr('تم تسجيل رد البائع مسبقًا، ولا يمكن إرسال رد آخر.', 'Seller response already recorded; another reply cannot be submitted.')}
              </p>
            )}
            {!Boolean(item.seller_responded) &&
              (item.status === 'submitted' || item.status === 'in_review') && (
              <div style={{ marginTop: 12 }}>
                <button
                  type="button"
                  style={action}
                  disabled={busy}
                  onClick={() => {
                    setSelected(selected === item.id ? null : item.id);
                    setExplanation('');
                    setPosition('accept');
                  }}
                >
                  {selected === item.id
                    ? tr('إغلاق الرد', 'Close reply')
                    : tr('إرسال رد البائع', 'Respond as seller')}
                </button>
                {selected === item.id && (
                  <form
                    onSubmit={(event) => void respond(event)}
                    style={{ display: 'grid', gap: 10, marginTop: 12 }}
                  >
                    <label>
                      {tr('القرار *', 'Position *')}
                      <select
                        style={{ display: 'block' }}
                        value={position}
                        onChange={(event) =>
                          setPosition(event.target.value as 'accept' | 'dispute')
                        }
                      >
                        <option value="accept">{tr('موافقة مبدئية', 'Accept')}</option>
                        <option value="dispute">{tr('اعتراض مع التوضيح', 'Dispute')}</option>
                      </select>
                    </label>
                    <label>
                      {tr('التوضيح *', 'Explanation *')}
                      <textarea
                        style={{ display: 'block', width: '100%' }}
                        required
                        minLength={10}
                        maxLength={2000}
                        rows={3}
                        value={explanation}
                        onChange={(event) => setExplanation(event.target.value)}
                      />
                    </label>
                    <button
                      type="submit"
                      style={action}
                      disabled={busy || explanation.trim().length < 10}
                    >
                      {tr('تأكيد الرد', 'Confirm response')}
                    </button>
                  </form>
                )}
              </div>
            )}
          </article>
        ))}
      {!loading && hasMore && (
        <button type="button" style={action} disabled={busy} onClick={() => void loadMore()}>
          {tr('عرض المزيد', 'Load more')}
        </button>
      )}
    </section>
  );
}

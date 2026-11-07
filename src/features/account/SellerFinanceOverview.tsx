import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  sellerFinanceLedger,
  sellerFinanceSummary,
  sellerSettlementReadiness,
  type SellerFinanceLedgerRow,
  type SellerFinanceSummary,
  type SellerMembership,
  type SellerSettlementReadiness,
} from './sellerWorkspaceApi';

type Props = { memberships: SellerMembership[] };
const money = (halalas: number) => (halalas / 100).toFixed(2);

function dateInput(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

export function SellerFinanceOverview({ memberships }: Props) {
  const { i18n } = useTranslation();
  const ar = i18n.language.startsWith('ar');
  const tr = (arabic: string, english: string) => (ar ? arabic : english);
  const readinessLabels: Record<string, string> = {
    ready: tr('جاهزة', 'Ready'),
    pending: tr('بانتظار الاستكمال', 'Pending completion'),
    blocked: tr('غير جاهزة', 'Not ready'),
    not_ready: tr('غير جاهزة', 'Not ready'),
    incomplete: tr('بيانات ناقصة', 'Incomplete'),
    awaiting_finance_configuration: tr('بانتظار استكمال إعدادات التسوية المالية', 'Awaiting finance configuration'),
    awaiting_refund_allocation_verification: tr('بانتظار مراجعة توزيع المرتجعات', 'Awaiting refund allocation review'),
    awaiting_finance_approval: tr('بانتظار موافقة الإدارة المالية', 'Awaiting finance approval'),
  };
  const owners = memberships.filter(
    (item) =>
      item.is_active &&
      item.seller_status === 'approved' &&
      item.role === 'owner' &&
      item.branch_id === null,
  );
  const [sellerId, setSellerId] = useState('');
  const [from, setFrom] = useState(() => dateInput(30));
  const [to, setTo] = useState(() => dateInput(0));
  const [summary, setSummary] = useState<SellerFinanceSummary | null>(null);
  const [ledger, setLedger] = useState<SellerFinanceLedgerRow[]>([]);
  const [readiness, setReadiness] = useState<SellerSettlementReadiness | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const selected = Number(sellerId || owners[0]?.seller_id);

  const load = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setError('');
    setSummary(null);
    setLedger([]);
    setReadiness(null);
    if (!owners.some((item) => item.seller_id === selected) || from > to) {
      setError(
        tr('اختر متجرًا وفترة زمنية صحيحة.', 'Choose an authorized store and valid date range.'),
      );
      return;
    }
    setBusy(true);
    try {
      const [sales, transactions, status] = await Promise.all([
        sellerFinanceSummary(selected, from, to),
        sellerFinanceLedger(selected, from, to),
        sellerSettlementReadiness(selected),
      ]);
      setSummary(sales.data);
      setLedger(transactions.data);
      setReadiness(status.data);
    } catch {
      setError(
        tr(
          'تعذر تحميل التقرير المالي. تحققي من صلاحية مالك المتجر والاتصال.',
          'Could not load finance report. Check owner permissions and connectivity.',
        ),
      );
    } finally {
      setBusy(false);
    }
  };

  if (owners.length === 0) {
    return (
      <p>
        {tr(
          'التقارير المالية متاحة لمالك المتجر المعتمد فقط.',
          'Finance reports are available only to approved store owners.',
        )}
      </p>
    );
  }


  const completedChecks = readiness
    ? [readiness.commission_configured, readiness.refund_allocation_verified,
        readiness.finance_approval_verified].filter(Boolean).length
    : 0;
  const checklist = readiness ? [
    {
      label: tr('إعداد عمولات المنصة', 'Configure platform commissions'),
      description: tr('اعتماد آلية احتساب عمولات الطلبات', 'Confirm how order commissions are calculated'),
      complete: readiness.commission_configured,
    },
    {
      label: tr('مراجعة توزيع المرتجعات', 'Verify refund allocation'),
      description: tr('مراجعة أثر الاستردادات على التسوية', 'Review how refunds affect settlements'),
      complete: readiness.refund_allocation_verified,
    },
    {
      label: tr('موافقة الإدارة المالية', 'Finance team approval'),
      description: tr('إكمال اعتماد إدارة المالية', "Complete the finance team's approval"),
      complete: readiness.finance_approval_verified,
    },
  ] : [];
  const formatDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(ar ? 'ar-SA' : 'en-GB', {
      year: 'numeric', month: 'short', day: 'numeric',
    }).format(date);
  };

  return (
    <section className="seller-finance-section" dir={ar ? 'rtl' : 'ltr'}>
      <header className="seller-finance-header">
        <div>
          <span className="seller-finance-eyebrow">{tr('التقارير المالية', 'Financial reporting')}</span>
          <h2>{tr('الملخص المالي', 'Finance overview')}</h2>
          <p>{tr('تابع المبيعات المسلّمة، الخصومات، وحالة اعتماد التسويات المالية.',
            'Review delivered sales, discounts and the status of settlement approvals.')}</p>
        </div>
        <span className="seller-finance-readonly">{tr('تقرير للعرض فقط', 'Read-only report')}</span>
      </header>

      <form className="seller-finance-filters" onSubmit={(event) => void load(event)}>
        <label>
          <span>{tr('المتجر', 'Store')}</span>
          <select value={sellerId || String(owners[0]?.seller_id ?? '')}
            onChange={(event) => {
              setSellerId(event.target.value);
              setSummary(null);
              setLedger([]);
              setReadiness(null);
            }}>
            {[...new Map(owners.map((item) => [item.seller_id, item])).values()].map((item) => (
              <option key={item.seller_id} value={item.seller_id}>
                {(ar ? item.name_ar : item.name_en) || (ar ? item.name_en : item.name_ar)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{tr('من تاريخ', 'From date')}</span>
          <input type="date" required value={from} onChange={(event) => {
            setFrom(event.target.value);
            setSummary(null);
            setLedger([]);
            setReadiness(null);
          }}/>
        </label>
        <label>
          <span>{tr('إلى تاريخ', 'To date')}</span>
          <input type="date" required min={from} value={to} onChange={(event) => {
            setTo(event.target.value);
            setSummary(null);
            setLedger([]);
            setReadiness(null);
          }}/>
        </label>
        <button className="seller-finance-load" type="submit" disabled={busy}>
          {busy ? tr('جار تحميل التقرير…', 'Loading report…') : tr('عرض التقرير', 'View report')}
        </button>
      </form>

      {error && <div className="seller-finance-error" role="alert">{error}</div>}
      {!summary && !busy && !error && (
        <div className="seller-finance-empty">
          {tr('اختر المتجر والفترة ثم اضغط «عرض التقرير» للاطلاع على النتائج.',
            'Select a store and date range, then choose View report.')}
        </div>
      )}
      {busy && <p className="seller-finance-loading" role="status">
        {tr('جار تحميل بيانات المبيعات والتسوية…', 'Loading sales and settlement data…')}
      </p>}

      {summary && (
        <div className="seller-finance-results">
          <div className="seller-finance-kpis" aria-label={tr('مؤشرات المبيعات', 'Sales indicators')}>
            <article className="seller-finance-kpi">
              <span>{tr('الطلبات المسلّمة', 'Delivered orders')}</span>
              <strong>{summary.delivered_orders.toLocaleString(ar ? 'ar-SA' : 'en-GB')}</strong>
              <small>{tr('خلال الفترة المختارة', 'During selected period')}</small>
            </article>
            <article className="seller-finance-kpi">
              <span>{tr('المبيعات بعد الخصم', 'Sales after discounts')}</span>
              <strong><bdi dir="ltr">{money(summary.merchandise_total_halalas)} {tr('ر.س', 'SAR')}</bdi></strong>
              <small>{tr('قيمة البضاعة، وليست مستحقات نهائية', 'Merchandise value, not final payout')}</small>
            </article>
            <article className="seller-finance-kpi">
              <span>{tr('الخصومات', 'Discounts')}</span>
              <strong><bdi dir="ltr">{money(summary.discount_halalas)} {tr('ر.س', 'SAR')}</bdi></strong>
              <small>{tr('الخصومات على الطلبات المسلّمة', 'Discounts on delivered orders')}</small>
            </article>
          </div>

          <div className="seller-finance-note" role="note">
            <span aria-hidden="true">ⓘ</span>
            <p>{tr(
              'الأرقام المعروضة تخص قيمة البضاعة بعد الخصومات. لم تُحتسب عمولات المنصة أو المستحقات النهائية، ولا يمكن إجراء تحويلات مالية من هذا التقرير.',
              'Figures show merchandise value after discounts. Platform commissions and final payouts are not calculated, and transfers cannot be made from this report.',
            )}</p>
          </div>

          {readiness && (
            <section className="seller-finance-readiness" aria-labelledby="seller-finance-readiness-heading">
              <div className="seller-finance-readiness-head">
                <div>
                  <span className="seller-finance-eyebrow">{tr('متابعة الاعتمادات', 'Approval progress')}</span>
                  <h3 id="seller-finance-readiness-heading">{tr('جاهزية التسوية المالية', 'Settlement readiness')}</h3>
                </div>
                <span className={`seller-finance-status ${readiness.transfer_enabled ? 'is-ready' : 'is-pending'}`}>
                  {readinessLabels[readiness.state] ??
                    tr('بانتظار استكمال متطلبات التسوية', 'Settlement requirements pending')}
                </span>
              </div>
              <div className="seller-finance-progress-label">
                <span>{tr('الخطوات المكتملة', 'Completed checks')}</span>
                <strong>{completedChecks} / 3</strong>
              </div>
              <div className="seller-finance-progress" role="progressbar"
                aria-valuenow={completedChecks} aria-valuemin={0} aria-valuemax={3}
                aria-label={tr('تقدم جاهزية التسوية', 'Settlement progress')}>
                <span style={{ width: `${completedChecks / 3 * 100}%` }}/>
              </div>
              <div className="seller-finance-checks">
                {checklist.map((item) => (
                  <div key={item.label} className={`seller-finance-check ${item.complete ? 'is-complete' : ''}`}>
                    <span className="seller-finance-check-icon" aria-hidden="true">{item.complete ? '✓' : '○'}</span>
                    <div>
                      <strong>{item.label}</strong>
                      <small>{item.description}</small>
                    </div>
                    <span className="seller-finance-check-state">
                      {item.complete ? tr('مكتمل', 'Complete') : tr('قيد الاستكمال', 'Pending')}
                    </span>
                  </div>
                ))}
              </div>
              <p className="seller-finance-readiness-foot">
                {readiness.transfer_enabled
                  ? tr('متطلبات التسوية مستوفاة. هذا التقرير للعرض فقط ولا يتيح إجراء تحويل.',
                      'Settlement requirements are complete. This read-only report cannot initiate transfers.')
                  : tr('التحويلات معلّقة إلى حين استكمال المتطلبات والاعتمادات أعلاه.',
                      'Transfers remain unavailable until the requirements above are completed.')}
              </p>
            </section>
          )}

          <section className="seller-finance-transactions">
            <div className="seller-finance-transactions-head">
              <div>
                <h3>{tr('آخر 20 عملية', 'Latest 20 transactions')}</h3>
                <p>{tr('الطلبات المسلّمة ضمن الفترة المختارة', 'Delivered orders in the selected period')}</p>
              </div>
              <span>{ledger.length} {tr('عملية', 'transactions')}</span>
            </div>
            {ledger.length === 0 ? (
              <div className="seller-finance-empty">
                {tr('لا توجد عمليات مالية في الفترة المحددة. جرب فترة زمنية أخرى.',
                  'No transactions in this date range. Try a different period.')}
              </div>
            ) : (
              <div className="seller-finance-table-wrap">
                <table>
                  <thead><tr>
                    <th scope="col">{tr('رقم الطلب', 'Order')}</th>
                    <th scope="col">{tr('الفرع', 'Branch')}</th>
                    <th scope="col">{tr('التاريخ', 'Date')}</th>
                    <th scope="col">{tr('قيمة البضاعة', 'Merchandise value')}</th>
                  </tr></thead>
                  <tbody>{ledger.map((row) => (
                    <tr key={row.suborder_id}>
                      <td><bdi dir="ltr">{row.order_number}</bdi></td>
                      <td>{tr('فرع رقم', 'Branch #')} {row.branch_id}</td>
                      <td>{formatDate(row.placed_at)}</td>
                      <td><bdi dir="ltr">{money(row.merchandise_halalas)} {tr('ر.س', 'SAR')}</bdi></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  );
}

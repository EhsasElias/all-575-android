import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  sellerFinanceLedger, sellerFinanceSummary, sellerSettlementReadiness,
  type SellerFinanceLedgerRow, type SellerFinanceSummary, type SellerMembership, type SellerSettlementReadiness,
} from './sellerWorkspaceApi';

type Props = { memberships: SellerMembership[] };
const box: React.CSSProperties = { padding: 14, border: '1px solid #d8e1db', borderRadius: 12, marginBottom: 12 };
const money = (halalas: number) => (halalas / 100).toFixed(2);

function dateInput(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

export function SellerFinanceOverview({ memberships }: Props) {
  const { i18n } = useTranslation();
  const ar = i18n.language.startsWith('ar');
  const tr = (arabic: string, english: string) => ar ? arabic : english;
  const owners = memberships.filter((item) => item.is_active && item.seller_status === 'approved' &&
    item.role === 'owner' && item.branch_id === null);
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
      setError(tr('اختاري متجرًا وفترة زمنية صحيحة.', 'Choose an authorized store and valid date range.'));
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
      setError(tr('تعذر تحميل التقرير المالي. تحققي من صلاحية مالك المتجر والاتصال.', 'Could not load finance report. Check owner permissions and connectivity.'));
    } finally { setBusy(false); }
  };

  if (owners.length === 0) {
    return <p>{tr('التقارير المالية متاحة لمالك المتجر المعتمد فقط.', 'Finance reports are available only to approved store owners.')}</p>;
  }

  return (
    <section style={box}>
      <h2>{tr('ملخص المبيعات والعمليات المالية', 'Sales and financial activity')}</h2>
      <p>{tr('للعرض فقط. لا يمثل هذا التقرير رصيدًا قابلًا للتحويل.', 'Read-only report. These amounts are not an available payout balance.')}</p>
      <form onSubmit={(event) => void load(event)} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'end' }}>
        <label>{tr('المتجر', 'Store')}
          <select style={{ display: 'block' }} value={sellerId || String(owners[0].seller_id)}
            onChange={(event) => { setSellerId(event.target.value); setSummary(null); setLedger([]); setReadiness(null); }}>
            {[...new Map(owners.map((item) => [item.seller_id, item])).values()].map((item) => (
              <option key={item.seller_id} value={item.seller_id}>{ar ? item.name_ar : item.name_en}</option>
            ))}
          </select>
        </label>
        <label>{tr('من', 'From')}<input style={{ display: 'block' }} type="date" required value={from}
          onChange={(event) => { setFrom(event.target.value); setSummary(null); setReadiness(null); }} /></label>
        <label>{tr('إلى', 'To')}<input style={{ display: 'block' }} type="date" required value={to}
          onChange={(event) => { setTo(event.target.value); setSummary(null); setReadiness(null); }} /></label>
        <button type="submit" disabled={busy}>{busy ? tr('جار التحميل…', 'Loading…') : tr('عرض التقرير', 'View report')}</button>
      </form>
      {error && <p role="alert" style={{ color: '#a52e2e' }}>{error}</p>}
      {summary && (
        <>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
            <div style={box}><strong>{summary.delivered_orders}</strong><div>{tr('طلبات مسلّمة', 'Delivered orders')}</div></div>
            <div style={box}><strong>{money(summary.merchandise_total_halalas)} SAR</strong><div>{tr('مبيعات البضاعة بعد الخصم', 'Merchandise after discounts')}</div></div>
            <div style={box}><strong>{money(summary.discount_halalas)} SAR</strong><div>{tr('الخصومات', 'Discounts')}</div></div>
          </div>
          <p>{tr('لم تُحسب عمولات المنصة أو المبالغ النهائية المستحقة بعد. لا يمكن تنفيذ تحويلات من هذا التقرير.',
            'Platform commission and final seller payouts have not been calculated. No transfers can be initiated here.')}</p>
          {readiness && (
            <div style={box}>
              <h3>{tr('جاهزية التسوية المالية', 'Settlement readiness')}</h3>
              <p>{tr('الحالة: ', 'Status: ')}{readiness.state}</p>
              <ul>
                <li>{tr('إعداد العمولات', 'Commission configuration')}: {readiness.commission_configured ? tr('مكتمل', 'Complete') : tr('غير مكتمل', 'Pending')}</li>
                <li>{tr('مراجعة توزيع المرتجعات', 'Refund allocation verification')}: {readiness.refund_allocation_verified ? tr('مكتمل', 'Complete') : tr('غير مكتمل', 'Pending')}</li>
                <li>{tr('موافقة الإدارة المالية', 'Finance approval')}: {readiness.finance_approval_verified ? tr('مكتمل', 'Complete') : tr('غير مكتمل', 'Pending')}</li>
              </ul>
              <p>{readiness.transfer_enabled
                ? tr('النظام يشير إلى الجاهزية. التحويلات غير متاحة عبر هذه الشاشة.', 'Readiness indicated. Transfers cannot be initiated from this page.')
                : tr('التحويلات المالية معطلة حتى استكمال الاعتمادات.', 'Financial transfers are disabled until all approvals are complete.')}</p>
            </div>
          )}
          <h3>{tr('آخر 20 عملية مسلّمة', 'Latest 20 delivered transactions')}</h3>
          {ledger.length === 0 ? <p>{tr('لا توجد عمليات في هذه الفترة.', 'No transactions for this period.')}</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', textAlign: 'start' }}>
                <thead><tr><th>{tr('الطلب', 'Order')}</th><th>{tr('الفرع', 'Branch')}</th><th>{tr('التاريخ', 'Date')}</th><th>{tr('قيمة البضاعة', 'Merchandise')}</th></tr></thead>
                <tbody>{ledger.map((row) => <tr key={row.suborder_id}>
                  <td>{row.order_number}</td><td>{row.branch_id}</td><td>{row.placed_at}</td><td>{money(row.merchandise_halalas)} SAR</td>
                </tr>)}</tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}

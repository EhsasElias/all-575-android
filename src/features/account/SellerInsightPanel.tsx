import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  sellerInsightDetails, sellerInsightTrend, exportSellerInsight,
  type SellerInsightMetric, type SellerInsightDetails, type SellerDailyTrend,
  type SellerBranch,
} from './sellerWorkspaceApi';

type Props = {
  metric: SellerInsightMetric;
  branches: SellerBranch[];
  onClose: () => void;
};

const pad = (n: number) => String(n).padStart(2, '0');
const dateAt = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join('-');
};
const arabicColumns: Record<string, string> = {
  'Order': 'رقم الطلب',
  'Date': 'تاريخ الطلب',
  'Branch': 'الفرع',
  'Status': 'الحالة',
  'Subtotal SAR': 'السعر قبل الخصم (ر.س)',
  'Discount SAR': 'الخصم (ر.س)',
  'Merchandise SAR': 'قيمة البضاعة (ر.س)',
  'Product ID': 'رقم المنتج',
  'Arabic name': 'اسم المنتج بالعربية',
  'English name': 'اسم المنتج بالإنجليزية',
  'Units': 'الوحدات المباعة',
  'Branch ID': 'رقم الفرع',
  'Orders': 'عدد الطلبات',
  'Delivered merchandise SAR': 'المبيعات المسلّمة (ر.س)',
  'SKU': 'رمز SKU',
  'Product': 'المنتج',
  'On hand': 'المخزون الفعلي',
  'Reserved': 'الكمية المحجوزة',
  'Available': 'المتاح للبيع',
};
const arabicStatuses: Record<string, string> = {
  awaiting_seller: 'بانتظار البائع',
  preparing: 'قيد التجهيز',
  ready: 'جاهز',
  on_the_way: 'في الطريق',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
};
const metricNames: Record<SellerInsightMetric, [string, string]> = {
  orders: ['كل الطلبات', 'All orders'],
  awaiting_seller: ['طلبات بانتظار البائع', 'Awaiting seller'],
  preparing: ['طلبات قيد التجهيز', 'Preparing'],
  ready: ['الطلبات الجاهزة', 'Ready'],
  on_the_way: ['الطلبات في الطريق', 'On the way'],
  delivered: ['الطلبات المسلّمة', 'Delivered orders'],
  sales: ['تفاصيل المبيعات المسلّمة', 'Delivered merchandise sales'],
  products: ['المنتجات الأكثر مبيعًا', 'Top selling products'],
  branches: ['أداء الفروع', 'Branch performance'],
  stock: ['حالة المخزون', 'Stock status'],
};

function saveDownload(blob: Blob, filename: string) {
  const uri = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = uri;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(uri), 30000);
}

export function SellerInsightPanel({ metric, branches, onClose }: Props) {
  const { i18n } = useTranslation();
  const ar = i18n.language.startsWith('ar');
  const tr = (a: string, b: string) => ar ? a : b;
  const [from, setFrom] = useState(() => dateAt(29));
  const [to, setTo] = useState(() => dateAt(0));
  const [branch, setBranch] = useState('');
  const [details, setDetails] = useState<SellerInsightDetails | null>(null);
  const [trend, setTrend] = useState<SellerDailyTrend[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const filters = {
    metric, from, to, ...(branch ? { branch_id: Number(branch) } : {}),
  };

  useEffect(() => {
    if (!from || !to || from > to) {
      setDetails(null);
      setError(ar ? 'تحقق من الفترة الزمنية.' : 'Choose a valid date range.');
      return;
    }
    let active = true;
    setLoading(true);
    setError('');
    setDetails(null);
    void sellerInsightDetails(filters).then(({ data }) => {
      if (active) setDetails(data);
    }).catch(() => {
      if (active) setError(ar
        ? 'تعذر تحميل التفاصيل. تأكد من الاتصال والصلاحيات.'
        : 'Could not load details. Check connectivity and permissions.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
    // All filter primitives are dependencies, not the constructed object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metric, from, to, branch, ar]);

  useEffect(() => {
    if (metric !== 'sales' && metric !== 'delivered') {
      setTrend([]);
      return;
    }
    if (!from || !to || from > to) return;
    let active = true;
    setTrend([]);
    void sellerInsightTrend(filters).then((result) => {
      if (active) setTrend(result.data);
    }).catch(() => {
      if (active) setTrend([]);
    });
    return () => { active = false; };
    // Primitive filter fields are watched to avoid repeated fetches.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metric, from, to, branch]);

  const download = async (format: 'csv' | 'xlsx') => {
    if (!details || downloading || loading) return;
    setDownloading(true);
    setError('');
    try {
      const result = await exportSellerInsight(filters, format);
      saveDownload(result.blob, result.filename ??
        `seller-${metric}-${from}-${to}.${format}`);
    } catch {
      setError(tr('تعذر تصدير التقرير. تحقق من الاتصال أو الصلاحيات.',
        'Export failed. Check permissions or connectivity.'));
    } finally {
      setDownloading(false);
    }
  };

  const presets = [
    { label: tr('اليوم', 'Today'), days: 0 },
    { label: tr('7 أيام', '7 days'), days: 6 },
    { label: tr('30 يومًا', '30 days'), days: 29 },
    { label: tr('90 يومًا', '90 days'), days: 89 },
  ];

  return (
    <section className="seller-insight" aria-label={tr(...metricNames[metric])}>
      <div className="seller-insight-head">
        <div>
          <span className="seller-insight-eyebrow">{tr('تفاصيل المؤشر', 'Metric detail')}</span>
          <h2>{tr(...metricNames[metric])}</h2>
        </div>
        <button type="button" onClick={onClose}>{tr('إغلاق التفاصيل', 'Close details')}</button>
      </div>
      <div className="seller-insight-presets">
        {presets.map((preset) => (
          <button type="button" key={preset.days}
            aria-pressed={from === dateAt(preset.days) && to === dateAt(0)}
            onClick={() => { setFrom(dateAt(preset.days)); setTo(dateAt(0)); }}>
            {preset.label}
          </button>
        ))}
      </div>
      <div className="seller-insight-filters">
        <label>{tr('من تاريخ', 'From date')}
          <input type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value)}/>
        </label>
        <label>{tr('إلى تاريخ', 'To date')}
          <input type="date" value={to} min={from} onChange={(event) => setTo(event.target.value)}/>
        </label>
        <label>{tr('الفرع', 'Branch')}
          <select value={branch} onChange={(event) => setBranch(event.target.value)}>
            <option value="">{tr('كل الفروع المسموحة', 'All assigned branches')}</option>
            {branches.map((item) => (
              <option value={item.id} key={item.id}>{ar ? item.name_ar : item.name_en}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="seller-insight-actions">
        <button type="button" disabled={!details || downloading || loading} onClick={() => void download('csv')}>
          {tr('تصدير CSV', 'Export CSV')}
        </button>
        <button type="button" disabled={!details || downloading || loading} onClick={() => void download('xlsx')}>
          {tr('تصدير Excel', 'Export Excel')}
        </button>
      </div>
      {error && <p role="alert" className="seller-insight-error">{error}</p>}
      {loading && <p role="status">{tr('جار تحميل التقرير…', 'Loading report…')}</p>}
      {details && (
        <>
          {(metric === 'sales' || metric === 'delivered') && trend.length > 0 && (
            <div className="seller-insight-trend">
              <h3>{tr('اتجاه المبيعات حسب تاريخ الطلب', 'Delivered merchandise by order date')}</h3>
              <p className="seller-insight-note">
                {tr('يُعرض تاريخ إنشاء الطلب الذي وصل إلى حالة مسلّم، وليس تاريخ تحويل المستحقات.',
                  'Grouped by the placement date of orders now delivered, not the payout date.')}
              </p>
              <div className="seller-insight-trend-bars" role="img"
                aria-label={tr('مخطط قيمة المبيعات حسب اليوم', 'Daily merchandise sales chart')}>
                {trend.slice(-30).map((row) => {
                  const maximum = Math.max(1, ...trend.slice(-30).map((item) => item.merchandise_halalas));
                  const ratio = row.merchandise_halalas / maximum;
                  return (
                    <div className="seller-insight-trend-row" key={row.day}>
                      <time dateTime={row.day}>{row.day.slice(5)}</time>
                      <div className="seller-insight-trend-track">
                        <span style={{ inlineSize: `${Math.max(1, ratio * 100)}%` }} />
                      </div>
                      <strong>{(row.merchandise_halalas / 100).toFixed(2)}</strong>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {metric === 'stock' && (
            <p className="seller-insight-note">
              {tr('المخزون يعرض الكميات الحالية، ولا يمثل حركة المخزون التاريخية حسب التواريخ المحددة.',
                'Inventory is a current snapshot, not historic stock movements for the selected dates.')}
            </p>
          )}
          <p className="seller-insight-note">
            {tr('النتائج المعروضة: ', 'Rows shown: ')}{details.returned_rows}
            {details.returned_rows >= details.max_rows
              ? tr(' — المعاينة تعرض أول 200 سجل، والتصدير يشمل حتى 5000 سجل.',
                  ' — Preview shows 200 rows; export includes up to 5000 records.')
              : ''}
          </p>
          {details.rows.length === 0
            ? <p>{tr('لا توجد بيانات في الفترة المختارة.', 'No data for the selected period.')}</p>
            : (
              <div className="seller-insight-table-scroll" role="region" tabIndex={0}
                aria-label={tr('جدول تفاصيل المؤشر', 'Metric breakdown table')}>
                <table>
                  <thead><tr>{details.columns.map((column, i) =>
                    <th key={i} scope="col">{ar ? (arabicColumns[column] ?? column) : column}</th>)}</tr></thead>
                  <tbody>{details.rows.map((row, index) => (
                    <tr key={index}>{row.map((cell, i) =>
                      <td key={i} dir="auto">
                        {ar && typeof cell === 'string' ? (arabicStatuses[cell] ?? cell) : cell}
                      </td>)}</tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          <p className="seller-insight-note">
            {tr('المبالغ الظاهرة هي قيمة البضاعة وليست صافي الربح أو المستحقات. لا توجد تكلفة شراء مكتملة لحساب الربح.',
              'Amounts represent merchandise values, not net profit or payouts. Cost data is not yet available for profit calculations.')}
          </p>
        </>
      )}
    </section>
  );
}

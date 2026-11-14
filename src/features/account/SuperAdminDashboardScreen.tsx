import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isApiError } from '@/shared/api';
import { Page } from './components/Page';
import { PlatformAdminAssignments } from './PlatformAdminAssignments';
import {
  exportSuperAdminMetric, superAdminDashboard, superAdminMetric,
  type SuperAdminDashboard, type SuperAdminMetricKey, type SuperAdminMetricPage,
} from './superAdminApi';
import styles from './SuperAdminDashboardScreen.module.css';
import './adminWorkspaceFamily.css';

type Metric = { key: SuperAdminMetricKey; label: string; value: string; icon: string };
type DownloadFormat = 'csv' | 'xls';

function saveFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function SuperAdminDashboardScreen() {
  const { i18n } = useTranslation();
  const ar = i18n.language.startsWith('ar');
  const tr = (arabic: string, english: string) => ar ? arabic : english;
  const [data, setData] = useState<SuperAdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState<SuperAdminMetricKey | null>(null);
  const [details, setDetails] = useState<SuperAdminMetricPage | null>(null);
  const [detailsPage, setDetailsPage] = useState(1);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');
  const [exporting, setExporting] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const detailSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setUnauthorized(false);
    void superAdminDashboard()
      .then(response => { if (active) setData(response.data); })
      .catch((cause: unknown) => {
        if (!active) return;
        setData(null);
        if (isApiError(cause) && (cause.status === 401 || cause.status === 403)) setUnauthorized(true);
        else setError(tr('تعذر تحميل لوحة التحكم. حاول مرة أخرى.', 'Unable to load dashboard. Please retry.'));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revision]);

  useEffect(() => {
    if (!selected) return;
    let active = true;
    setDetails(null);
    setDetailsError('');
    setDetailsLoading(true);
    void superAdminMetric(selected, detailsPage)
      .then(response => { if (active) setDetails(response); })
      .catch(() => {
        if (active) setDetailsError(tr('تعذر تحميل التفاصيل.', 'Unable to load details.'));
      })
      .finally(() => { if (active) setDetailsLoading(false); });
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, detailsPage, revision]);

  const number = (value: number) => value.toLocaleString(ar ? 'ar-SA' : 'en-US');
  const money = (value: number) => (value / 100).toLocaleString(ar ? 'ar-SA' : 'en-US', { style: 'currency', currency: 'SAR' });
  const metrics = useMemo<Metric[]>(() => data ? [
    { key: 'customers', label: tr('إجمالي الحسابات', 'Total accounts'), value: number(data.customers), icon: '♙' },
    { key: 'sellers', label: tr('البائعون', 'Sellers'), value: number(data.sellers), icon: '▤' },
    { key: 'active_sellers', label: tr('البائعون المعتمدون', 'Approved sellers'), value: number(data.active_sellers), icon: '✓' },
    { key: 'products', label: tr('المنتجات', 'Products'), value: number(data.products), icon: '◇' },
    { key: 'published_products', label: tr('المنتجات المنشورة', 'Published products'), value: number(data.published_products), icon: '▧' },
    { key: 'orders', label: tr('الطلبات', 'Orders'), value: number(data.orders), icon: '▣' },
    { key: 'paid_order_value', label: tr('قيمة الطلبات المدفوعة', 'Paid order value'), value: money(data.sales.paid_total_halalas), icon: '﷼' },
    { key: 'paid_orders', label: tr('الطلبات المدفوعة', 'Paid orders'), value: number(data.sales.paid_orders), icon: '✓' },
    { key: 'awaiting_payment', label: tr('بانتظار الدفع', 'Awaiting payment'), value: number(data.order_statuses.pending_payment ?? 0), icon: '◷' },
    { key: 'confirmed_orders', label: tr('الطلبات المؤكدة', 'Confirmed orders'), value: number(data.order_statuses.confirmed ?? 0), icon: '✓' },
    { key: 'completed_orders', label: tr('الطلبات المكتملة', 'Completed orders'), value: number(data.order_statuses.completed ?? 0), icon: '✓' },
    { key: 'ready_for_delivery', label: tr('جاهزة للتوصيل', 'Ready for delivery'), value: number(data.suborder_statuses.ready ?? 0), icon: '↗' },
    { key: 'pending_seller_applications', label: tr('طلبات البائعين المعلقة', 'Pending seller applications'), value: number(data.pending_seller_applications), icon: '!' },
    { key: 'pending_product_reviews', label: tr('المنتجات بانتظار المراجعة', 'Pending product reviews'), value: number(data.pending_product_reviews), icon: '!' },
    { key: 'pending_category_requests', label: tr('طلبات التصنيفات المعلقة', 'Pending category requests'), value: number(data.pending_category_requests), icon: '!' },
  ] : [], [data, ar]);
  const selectedMetric = metrics.find(metric => metric.key === selected);

  const openDetails = (key: SuperAdminMetricKey) => {
    setSearch('');
    setDetailsPage(1);
    setSelected(key);
  };

  useEffect(() => {
    if (selected && typeof detailSectionRef.current?.scrollIntoView === 'function') {
      detailSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selected]);

  const downloadMetric = async (key: SuperAdminMetricKey, format: DownloadFormat) => {
    const action = key + format;
    setExporting(action);
    setDetailsError('');
    try {
      const result = await exportSuperAdminMetric(key, format);
      saveFile(result.blob, result.filename ?? ('all575-' + key + '.' + format));
    } catch {
      setDetailsError(tr('تعذر تصدير الملف. حاول مرة أخرى.', 'Export failed. Please retry.'));
      setSelected(key);
    } finally { setExporting(null); }
  };

  const metricCard = (metric: Metric) => (
    <button
      key={metric.key}
      type="button"
      className={styles.statCard + ' admin-family-card ' + styles.metricButton + (selected === metric.key ? ' ' + styles.activeCard : '')}
      aria-pressed={selected === metric.key}
      aria-label={tr('عرض تفاصيل', 'View details for') + ' ' + metric.label}
      onClick={() => openDetails(metric.key)}
    >
      <span className={styles.statMain}>
        <span aria-hidden="true" className={styles.statIcon}>{metric.icon}</span>
        <span className={styles.statCopy}>
          <span className={styles.statLabel}>{metric.label}</span>
          <strong className={styles.statValue}>{metric.value}</strong>
        </span>
      </span>
      <span className={styles.metricHint} aria-hidden="true">
        {tr('اضغط لعرض التفاصيل', 'Click to view details')} <span>↗</span>
      </span>
    </button>
  );

  const filteredRows = (details?.data ?? []).filter(row =>
    Object.values(row).some(value => String(value ?? '').toLocaleLowerCase().includes(search.toLocaleLowerCase()))
  );

  return (
    <Page>
      <div className={styles.dashboard + ' admin-workspace-family'} dir={ar ? 'rtl' : 'ltr'}>
        <div className={styles.heading + ' admin-family-hero'}>
          <div className={styles.headingIcon} aria-hidden="true">♛</div>
          <div>
            <h1>{tr('لوحة السوبر أدمن', 'Super Admin Dashboard')}</h1>
            <p>{tr('إدارة الحسابات والطلبات والمنتجات والصلاحيات من مكان واحد.', 'Manage platform accounts, orders, products, reviews and permissions in one place.')}</p>
          </div>
          <span className={styles.platformTag}>{tr('منصة ALL 5.75', 'ALL 5.75 Platform')}</span>
        </div>
        <div className={styles.toolbar + ' admin-family-panel'}>
          <span>{tr('نظرة شاملة على المنصة', 'Platform overview')}</span>
          <button type="button" className={styles.primary + ' admin-family-primary'} onClick={() => setRevision(value => value + 1)}>
            ↻ {tr('تحديث البيانات', 'Refresh data')}
          </button>
        </div>
        {loading && <p role="status">{tr('جارٍ تحميل البيانات...', 'Loading dashboard...')}</p>}
        {!loading && unauthorized && <p role="alert">{tr('لا تتوفر صلاحية السوبر أدمن لهذا الحساب.', 'Super Admin access is not enabled for this account.')}</p>}
        {!loading && error && <p role="alert">{error} <button type="button" onClick={() => setRevision(x => x + 1)}>{tr('إعادة المحاولة', 'Retry')}</button></p>}
        {!loading && data && (
          <>
            <div className={styles.contentGrid}>
              <main className={styles.main}>
                <h2>{tr('مؤشرات المنصة', 'Platform statistics')}</h2>
                <div className={styles.statGrid + ' admin-family-metrics'}>{metrics.slice(0, 5).map(metricCard)}</div>
                <h2>{tr('المبيعات والطلبات', 'Sales & Orders')}</h2>
                <div className={styles.statGrid + ' admin-family-metrics'}>{metrics.slice(5, 12).map(metricCard)}</div>
              </main>
              <aside className={styles.sidebar}>
                <section className={styles.sidePanel}>
                  <h2>{tr('تحتاج إلى متابعة', 'Needs Attention')}</h2>
                  {metrics.slice(12).map(metricCard)}
                </section>
                <section className={styles.sidePanel}>
                  <h2>{tr('آخر تحديث', 'Last updated')}</h2>
                  <p>{new Date(data.generated_at).toLocaleString(ar ? 'ar-SA' : 'en-US')}</p>
                </section>
              </aside>
            </div>
            <div ref={detailSectionRef} className={styles.fullWidthDetails}>
                {selected && (
                  <section className={styles.detailPanel + ' admin-family-panel'} aria-label={selectedMetric?.label} aria-live="polite">
                    <div className={styles.sectionHeader}>
                      <div>
                        <h2>{selectedMetric?.label} — {tr('التفاصيل', 'Details')}</h2>
                        <p>{tr('سجلات فعلية من قاعدة البيانات، مع صفحات متعددة للتصفح.', 'Live database records with pagination.')}</p>
                      </div>
                      <div className={styles.inlineActions}>
                        <button type="button" className="admin-family-secondary" disabled={exporting !== null} onClick={() => void downloadMetric(selected, 'xls')}>↓ Excel</button>
                        <button type="button" className="admin-family-secondary" disabled={exporting !== null} onClick={() => void downloadMetric(selected, 'csv')}>↓ CSV</button>
                        <button type="button" className="admin-family-secondary" aria-label={tr('إغلاق التفاصيل', 'Close details')} onClick={() => setSelected(null)}>✕</button>
                      </div>
                    </div>
                    {detailsLoading && <p role="status">{tr('تحميل...', 'Loading...')}</p>}
                    {detailsError && <p role="alert">{detailsError}</p>}
                    {details && (
                      <>
                        <div className={styles.detailTools}>
                          <input aria-label={tr('بحث ضمن الصفحة', 'Search current page')} placeholder={tr('بحث ضمن السجلات المعروضة...', 'Search displayed records...')} value={search} onChange={e => setSearch(e.target.value)} />
                          <span>{tr('إجمالي السجلات', 'Total records')}: {number(details.total)}</span>
                        </div>
                        <div className={styles.tableScroll + ' admin-family-table'}>
                          <table className={styles.dataTable}>
                            <thead><tr>{details.columns.map(column => <th key={column} scope="col">{column.replaceAll('_', ' ')}</th>)}</tr></thead>
                            <tbody>
                              {filteredRows.map((row, index) => <tr key={String(row.id ?? index)}>
                                {details.columns.map(column => <td key={column}>{String(row[column] ?? '—')}</td>)}
                              </tr>)}
                            </tbody>
                          </table>
                        </div>
                        {filteredRows.length === 0 && <p>{tr('لا توجد نتائج.', 'No records found.')}</p>}
                        <div className={styles.pagination}>
                          <button type="button" disabled={details.page <= 1} onClick={() => { setDetailsPage(p => p - 1); setSearch(''); }}>{tr('السابق', 'Previous')}</button>
                          <span>{number(details.page)} / {number(Math.max(1, details.last_page))}</span>
                          <button type="button" disabled={details.page >= details.last_page} onClick={() => { setDetailsPage(p => p + 1); setSearch(''); }}>{tr('التالي', 'Next')}</button>
                        </div>
                      </>
                    )}
                  </section>
                )}

            </div>
            <div id="admin-accounts" className={styles.permissions + ' admin-family-panel'}><PlatformAdminAssignments /></div>
          </>
        )}
      </div>
    </Page>
  );
}

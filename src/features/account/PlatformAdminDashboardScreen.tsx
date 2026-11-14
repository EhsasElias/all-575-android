import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { isApiError } from '@/shared/api';
import { routePaths } from '@/shared/lib';
import { Page } from './components/Page';
import { adminDashboard, adminOrders, type PlatformAdminDashboard, type PlatformAdminOrder } from './platformAdminApi';
import styles from './PlatformAdminDashboardScreen.module.css';

export function PlatformAdminDashboardScreen() {
  const { i18n } = useTranslation();
  const ar = i18n.language.startsWith('ar');
  const tr = (a: string, en: string) => ar ? a : en;
  const [data, setData] = useState<PlatformAdminDashboard | null>(null);
  const [orders, setOrders] = useState<PlatformAdminOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState('');
  const [ordersError, setOrdersError] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setDenied(false);
    setError('');
    void adminDashboard()
      .then(result => { if (active) setData(result.data); })
      .catch((cause: unknown) => {
        if (!active) return;
        setData(null);
        if (isApiError(cause) && (cause.status === 401 || cause.status === 403)) setDenied(true);
        else setError(tr('تعذر تحميل لوحة الإدارة.', 'Could not load the Admin dashboard.'));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revision]);

  useEffect(() => {
    let active = true;
    setOrdersError('');
    void adminOrders({ limit: 30, ...(statusFilter !== 'all' ? { status: statusFilter } : {}) })
      .then(response => { if (active) setOrders(response.data); })
      .catch(() => { if (active) { setOrders([]); setOrdersError(tr('تعذر تحميل قائمة الطلبات.', 'Unable to load order list.')); } });
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revision, statusFilter]);

  const statuses: Record<string, string> = {
    awaiting_seller: tr('بانتظار البائع', 'Awaiting seller'),
    preparing: tr('قيد التجهيز', 'Preparing'),
    ready: tr('جاهز', 'Ready'),
    on_the_way: tr('في الطريق', 'On the way'),
    delivered: tr('تم التسليم', 'Delivered'),
    cancelled: tr('ملغي', 'Cancelled'),
  };

  const filteredOrders = useMemo(() => orders.filter(item =>
    [item.order_number, item.seller_name_ar, item.seller_name_en, String(item.branch_id)]
      .some(value => value.toLowerCase().includes(query.trim().toLowerCase()))
  ), [orders, query]);
  const number = (value: number) => value.toLocaleString(ar ? 'ar-SA' : 'en-US');
  const metric = (label: string, value: number) => (
    <div className={styles.metric} key={label}>
      <span>{label}</span><strong>{number(value)}</strong>
    </div>
  );

  return (
    <Page>
      <div className={styles.dashboard} dir={ar ? 'rtl' : 'ltr'}>
        <header className={styles.hero}>
          <div>
            <Link to={routePaths.account}>{tr('العودة للحساب', 'Back to account')}</Link>
            <h1>{tr('لوحة الإدارة', 'Admin Dashboard')}</h1>
            <p>{tr('إدارة طلبات المتاجر المسندة إليك ومتابعة مخزونها.', 'Monitor orders and stock across your assigned sellers.')}</p>
          </div>
          <button type="button" className={styles.refresh} onClick={() => setRevision(x => x + 1)}>↻ {tr('تحديث', 'Refresh')}</button>
        </header>
        {loading && <p role="status">{tr('جار التحميل...', 'Loading...')}</p>}
        {!loading && denied && <p role="alert">{tr('لا توجد لديك صلاحية إدارة نشطة.', 'No active Admin access for this account.')}</p>}
        {!loading && error && <p role="alert">{error}</p>}
        {!loading && data && (
          <>
            <h2>{tr('نظرة عامة', 'Operations overview')}</h2>
            <div className={styles.metrics}>
              {metric(tr('المتاجر المسندة', 'Assigned sellers'), data.assigned_sellers)}
              {metric(tr('الطلبات', 'Seller orders'), data.suborders)}
              {metric(tr('بانتظار التجهيز', 'Awaiting preparation'), data.suborder_statuses.awaiting_seller ?? 0)}
              {metric(tr('قيد التجهيز', 'Preparing'), data.suborder_statuses.preparing ?? 0)}
              {metric(tr('جاهز للاستلام', 'Ready for pickup'), data.suborder_statuses.ready ?? 0)}
              {metric(tr('في الطريق', 'On the way'), data.suborder_statuses.on_the_way ?? 0)}
              {metric(tr('تم التسليم', 'Delivered'), data.suborder_statuses.delivered ?? 0)}
            </div>
            <section className={styles.panel}>
              <div className={styles.panelHeading}>
                <div><h2>{tr('متابعة الطلبات', 'Order monitoring')}</h2><p>{tr('سجلات المتاجر ضمن صلاحياتك فقط.', 'Only orders within your assigned permissions.')}</p></div>
                <div className={styles.filters}>
                  <label>{tr('الحالة', 'Status')}
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                      <option value="all">{tr('الكل', 'All')}</option>
                      {Object.entries(statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </label>
                  <label>{tr('بحث في النتائج', 'Search shown orders')}
                    <input value={query} placeholder={tr('رقم الطلب أو البائع...', 'Order number or seller...')} onChange={e => setQuery(e.target.value)}/>
                  </label>
                </div>
              </div>
              {ordersError && <p role="alert">{ordersError}</p>}
              <div className={styles.tableScroll}>
                <table>
                  <thead><tr><th>{tr('رقم الطلب', 'Order')}</th><th>{tr('البائع', 'Seller')}</th><th>{tr('الفرع', 'Branch')}</th><th>{tr('الحالة', 'Status')}</th><th>{tr('تاريخ الطلب', 'Date')}</th></tr></thead>
                  <tbody>{filteredOrders.map(order => <tr key={order.id}>
                    <td><strong>{order.order_number}</strong></td>
                    <td>{ar ? order.seller_name_ar : order.seller_name_en}</td>
                    <td>#{order.branch_id}</td>
                    <td><span className={styles.status}>{statuses[order.status] ?? order.status}</span></td>
                    <td>{order.placed_at ? new Date(order.placed_at).toLocaleString(ar ? 'ar-SA' : 'en-US') : '—'}</td>
                  </tr>)}</tbody>
                </table>
              </div>
              {filteredOrders.length === 0 && <p className={styles.empty}>{tr('لا توجد طلبات مطابقة.', 'No matching orders.')}</p>}
              <p className={styles.hint}>{tr('يتم عرض آخر 30 طلباً. البحث داخل النتائج المعروضة.', 'Showing up to 30 recent orders. Search filters this list only.')}</p>
            </section>
            <section className={styles.panel}>
              <h2>{tr('نظرة على المخزون', 'Inventory overview')}</h2>
              <div className={styles.metrics}>
                {metric(tr('سجلات المخزون', 'Stock records'), data.stock_records)}
                {metric(tr('المخزون المنخفض (5 أو أقل)', 'Low stock (5 or less)'), data.low_stock_records)}
              </div>
            </section>
            <p className={styles.updated}>{tr('آخر تحديث:', 'Updated:')} {new Date(data.generated_at).toLocaleString(ar ? 'ar-SA' : 'en-US')}</p>
          </>
        )}
      </div>
    </Page>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { isApiError } from '@/shared/api';
import { routePaths } from '@/shared/lib';
import { Page } from './components/Page';
import { PageHeader } from './components/PageHeader';
import { superAdminDashboard, type SuperAdminDashboard } from './superAdminApi';
import { PlatformAdminAssignments } from './PlatformAdminAssignments';

const card: React.CSSProperties = {
  padding: 18,
  background: 'var(--color-surface, #16241e)',
  border: '1px solid var(--color-border, #d8e1db)',
  borderRadius: 14,
  minWidth: 155,
};
const grid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))',
  gap: 12,
  marginBottom: 20,
};

export function SuperAdminDashboardScreen() {
  const { i18n } = useTranslation();
  const ar = i18n.language.startsWith('ar');
  const tr = (arabic: string, english: string) => (ar ? arabic : english);
  const [data, setData] = useState<SuperAdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setUnauthorized(false);
    void superAdminDashboard()
      .then((response) => { if (active) setData(response.data); })
      .catch((cause: unknown) => {
        if (!active) return;
        setData(null);
        if (isApiError(cause) && (cause.status === 401 || cause.status === 403)) {
          setUnauthorized(true);
        } else {
          setError(tr('تعذر تحميل لوحة التحكم. حاول مرة أخرى.', 'Unable to load dashboard. Please retry.'));
        }
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revision]);

  const number = (value: number) => value.toLocaleString(ar ? 'ar-SA' : 'en-US');
  const money = (value: number) => (value / 100).toLocaleString(ar ? 'ar-SA' : 'en-US', {
    style: 'currency', currency: 'SAR',
  });
  const metric = (label: string, value: string) => (
    <div style={card} key={label}>
      <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 10 }}>{label}</div>
      <strong style={{ fontSize: 25 }}>{value}</strong>
    </div>
  );

  return (
    <Page>
      <PageHeader
        title={tr('لوحة السوبر أدمن', 'Super Admin Dashboard')}
        lead={tr('نظرة شاملة على أداء المنصة والحسابات والطلبات.', 'Platform-wide overview of accounts, orders and activity.')}
        back={<Link to={routePaths.account}>{tr('العودة لحسابي', 'Back to account')}</Link>}
      />
      {loading && <p role="status">{tr('جارٍ تحميل البيانات...', 'Loading dashboard...')}</p>}
      {!loading && unauthorized && (
        <p role="alert">{tr('ليس لديك صلاحية السوبر أدمن. يرجى التواصل مع المسؤول.', 'Super Admin access is not enabled for this account.')}</p>
      )}
      {!loading && error && <p role="alert">{error}</p>}
      {!loading && error && (
        <button type="button" onClick={() => setRevision((current) => current + 1)}>
          {tr('إعادة المحاولة', 'Retry')}
        </button>
      )}
      {!loading && data && (
        <>
          <h2>{tr('نظرة عامة', 'Overview')}</h2>
          <div style={grid}>
            {metric(tr('إجمالي الحسابات', 'Total accounts'), number(data.customers))}
            {metric(tr('البائعون', 'Sellers'), number(data.sellers))}
            {metric(tr('البائعون المعتمدون', 'Approved sellers'), number(data.active_sellers))}
            {metric(tr('المنتجات', 'Products'), number(data.products))}
            {metric(tr('المنتجات المنشورة', 'Published products'), number(data.published_products))}
            {metric(tr('الطلبات', 'Orders'), number(data.orders))}
          </div>
          <h2>{tr('المبيعات والطلبات', 'Sales & Orders')}</h2>
          <div style={grid}>
            {metric(tr('قيمة الطلبات المدفوعة', 'Paid order value'), money(data.sales.paid_total_halalas))}
            {metric(tr('عدد الطلبات المدفوعة', 'Paid orders'), number(data.sales.paid_orders))}
            {metric(tr('طلبات قيد الدفع', 'Awaiting payment'), number(data.order_statuses.pending_payment ?? 0))}
            {metric(tr('طلبات مؤكدة', 'Confirmed orders'), number(data.order_statuses.confirmed ?? 0))}
            {metric(tr('طلبات مكتملة', 'Completed orders'), number(data.order_statuses.completed ?? 0))}
            {metric(tr('طلبات جاهزة للتوصيل', 'Ready for delivery'), number(data.suborder_statuses.ready ?? 0))}
          </div>
          <h2>{tr('تحتاج إلى متابعة', 'Needs Attention')}</h2>
          <div style={grid}>
            {metric(tr('طلبات انضمام البائعين', 'Pending seller applications'), number(data.pending_seller_applications))}
            {metric(tr('منتجات بانتظار المراجعة', 'Pending product reviews'), number(data.pending_product_reviews))}
          </div>
          <PlatformAdminAssignments />
          <p style={{ opacity: 0.75, fontSize: 13 }}>
            {tr('آخر تحديث:', 'Last updated:')} {new Date(data.generated_at).toLocaleString(ar ? 'ar-SA' : 'en-US')}
          </p>
          <button type="button" onClick={() => setRevision((current) => current + 1)}>
            {tr('تحديث البيانات', 'Refresh data')}
          </button>
        </>
      )}
    </Page>
  );
}

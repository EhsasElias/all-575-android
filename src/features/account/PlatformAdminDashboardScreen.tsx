import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { isApiError } from '@/shared/api';
import { routePaths } from '@/shared/lib';
import { Page } from './components/Page';
import { PageHeader } from './components/PageHeader';
import { adminDashboard, type PlatformAdminDashboard } from './platformAdminApi';

const panel: React.CSSProperties = {
  padding: 18, border: '1px solid var(--color-border, #d8e1db)',
  borderRadius: 14, background: 'var(--color-surface, transparent)',
};
const layout: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))',
  gap: 12, marginBottom: 20,
};

export function PlatformAdminDashboardScreen() {
  const { i18n } = useTranslation();
  const ar = i18n.language.startsWith('ar');
  const tr = (a: string, en: string) => ar ? a : en;
  const [data, setData] = useState<PlatformAdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState('');
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
        if (isApiError(cause) && (cause.status === 401 || cause.status === 403)) {
          setDenied(true);
        } else {
          setError(tr('تعذر تحميل لوحة الإدارة.', 'Could not load the Admin dashboard.'));
        }
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revision]);

  const number = (value: number) => value.toLocaleString(ar ? 'ar-SA' : 'en-US');
  const metric = (label: string, value: number) => (
    <div style={panel} key={label}>
      <div style={{ fontSize: 13, opacity: 0.8 }}>{label}</div>
      <strong style={{ fontSize: 27 }}>{number(value)}</strong>
    </div>
  );

  return (
    <Page>
      <PageHeader
        title={tr('لوحة الإدارة', 'Admin Dashboard')}
        lead={tr('ملخص الطلبات والمخزون ضمن المتاجر المسندة إليك فقط.', 'Orders and stock for your assigned sellers only.')}
        back={<Link to={routePaths.account}>{tr('العودة للحساب', 'Back to account')}</Link>}
      />
      {loading && <p role="status">{tr('جار التحميل...', 'Loading...')}</p>}
      {!loading && denied && <p role="alert">{tr('لا توجد لديك صلاحية إدارة نشطة.', 'No active Admin access for this account.')}</p>}
      {!loading && error && <p role="alert">{error}</p>}
      {!loading && data && (
        <>
          <h2>{tr('المهام والنشاط', 'Operations')}</h2>
          <div style={layout}>
            {metric(tr('المتاجر المسندة', 'Assigned sellers'), data.assigned_sellers)}
            {metric(tr('الطلبات', 'Seller orders'), data.suborders)}
            {metric(tr('بانتظار التجهيز', 'Awaiting preparation'), data.suborder_statuses.awaiting_seller ?? 0)}
            {metric(tr('قيد التجهيز', 'Preparing'), data.suborder_statuses.preparing ?? 0)}
            {metric(tr('جاهز للاستلام', 'Ready for pickup'), data.suborder_statuses.ready ?? 0)}
            {metric(tr('في الطريق', 'On the way'), data.suborder_statuses.on_the_way ?? 0)}
            {metric(tr('تم التسليم', 'Delivered'), data.suborder_statuses.delivered ?? 0)}
          </div>
          <h2>{tr('المخزون', 'Inventory')}</h2>
          <div style={layout}>
            {metric(tr('سجلات المخزون', 'Stock records'), data.stock_records)}
            {metric(tr('مخزون منخفض (5 أو أقل)', 'Low stock (5 or less)'), data.low_stock_records)}
          </div>
          <p style={{ opacity: 0.7, fontSize: 13 }}>
            {tr('آخر تحديث:', 'Updated:')} {new Date(data.generated_at).toLocaleString(ar ? 'ar-SA' : 'en-US')}
          </p>
        </>
      )}
      {!loading && !denied && (
        <button type="button" onClick={() => setRevision(value => value + 1)}>
          {tr('تحديث', 'Refresh')}
        </button>
      )}
    </Page>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { routePaths } from '@/shared/lib';
import { Page } from './components/Page';
import { PageHeader } from './components/PageHeader';
import {
  memberships, openSellerSession, closeSellerSession, sellerDashboard,
  sellerOrders, sellerBranches, advanceSellerOrder, type SellerOrder,
} from './sellerWorkspaceApi';

export function SellerWorkspaceScreen() {
  const { i18n } = useTranslation();
  const ar = i18n.language.startsWith('ar');
  const [eligible, setEligible] = useState(false);
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [branches, setBranches] = useState<Array<{ id: number; name_ar: string; name_en: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const refresh = async () => {
    const [dashboardResult, orderResult, branchResult] = await Promise.all([
      sellerDashboard(), sellerOrders(), sellerBranches(),
    ]);
    setSummary(dashboardResult.data);
    setOrders(orderResult.data);
    setBranches(branchResult.data);
  };

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const list = await memberships();
        if (!active) return;
        if (!list.data.some((membership) => membership.is_active && membership.seller_status === 'approved')) {
          setEligible(false);
          return;
        }
        await openSellerSession();
        if (!active) return;
        setEligible(true);
        await refresh();
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; void closeSellerSession(); };
  }, []);

  const changeStatus = async (id: string, status: 'preparing' | 'ready') => {
    if (busy) return;
    setBusy(true); setError(false);
    try {
      await advanceSellerOrder(id, status);
      await refresh();
    } catch { setError(true); }
    finally { setBusy(false); }
  };

  return (
    <Page>
      <PageHeader title={ar ? 'لوحة تشغيل البائع' : 'Seller workspace'}
        back={<Link to={routePaths.account}>{ar ? 'حسابي' : 'My account'}</Link>} />
      {loading && <p role="status">{ar ? 'جار التحميل…' : 'Loading…'}</p>}
      {error && <p role="alert">{ar ? 'تعذر تحميل بيانات البائع أو حفظ التغيير.' : 'Unable to load seller data or save changes.'}</p>}
      {!loading && !eligible && <p>{ar ? 'هذه اللوحة متاحة فقط للبائعين المعتمدين.' : 'Only approved sellers can access this workspace.'}</p>}
      {!loading && eligible && (
        <>
          <section>
            <h2>{ar ? 'حالات الطلبات' : 'Order summary'}</h2>
            <ul>
              {(['awaiting_seller', 'preparing', 'ready', 'on_the_way', 'delivered'] as const).map((status) => (
                <li key={status}>{status}: {summary[status] ?? 0}</li>
              ))}
            </ul>
          </section>
          <section>
            <h2>{ar ? 'الفروع المخصصة' : 'Assigned branches'}</h2>
            {branches.length === 0 ? <p>{ar ? 'لا توجد فروع.' : 'No branches.'}</p> : (
              <ul>{branches.map((branch) => <li key={branch.id}>{ar ? branch.name_ar : branch.name_en}</li>)}</ul>
            )}
          </section>
          <section>
            <h2>{ar ? 'طلبات التجهيز' : 'Fulfilment orders'}</h2>
            {orders.length === 0 && <p>{ar ? 'لا توجد طلبات.' : 'No orders.'}</p>}
            {orders.map((order) => (
              <article key={order.id}>
                <h3>{order.order_number}</h3>
                <p>{order.status}</p>
                <ul>{order.items.map((item) => <li key={item.id}>{ar ? item.name.ar : item.name.en} × {item.quantity}</li>)}</ul>
                {order.status === 'awaiting_seller' && (
                  <button type="button" disabled={busy} onClick={() => void changeStatus(order.id, 'preparing')}>
                    {ar ? 'بدء التجهيز' : 'Start preparing'}
                  </button>
                )}
                {order.status === 'preparing' && (
                  <button type="button" disabled={busy} onClick={() => void changeStatus(order.id, 'ready')}>
                    {ar ? 'جاهز للاستلام' : 'Ready for pickup'}
                  </button>
                )}
              </article>
            ))}
          </section>
        </>
      )}
    </Page>
  );
}

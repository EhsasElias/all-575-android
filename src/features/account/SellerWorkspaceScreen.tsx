import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { routePaths } from '@/shared/lib';
import { Page } from './components/Page';
import { PageHeader } from './components/PageHeader';
import { SellerProductManagement } from './SellerProductManagement';
import { SellerFinanceOverview } from './SellerFinanceOverview';
import { SellerStaffManagement } from './SellerStaffManagement';
import {
  memberships, openSellerSession, closeSellerSession, sellerDashboard,
  sellerOrders, sellerBranches, sellerProducts, sellerStock,
  advanceSellerOrder, adjustSellerStock, exportSellerOrdersCsv,
  type SellerBranch, type SellerDashboard, type SellerOrder,
  type SellerProduct, type SellerStock, type SellerMembership,
} from './sellerWorkspaceApi';

type Section = 'overview' | 'products' | 'inventory' | 'orders' | 'finance' | 'staff';
const orderStatuses = ['all', 'awaiting_seller', 'preparing', 'ready', 'on_the_way', 'delivered'] as const;

const panel: React.CSSProperties = {
  padding: 16, border: '1px solid var(--color-border, #d8e1db)',
  borderRadius: 14, marginBottom: 14,
};
const line: React.CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' };
const action: React.CSSProperties = { padding: '9px 13px', borderRadius: 9, cursor: 'pointer' };

export function SellerWorkspaceScreen() {
  const { i18n } = useTranslation();
  const ar = i18n.language.startsWith('ar');
  const tr = (arabic: string, english: string) => ar ? arabic : english;
  const [eligible, setEligible] = useState(false);
  const [sellerMemberships, setSellerMemberships] = useState<SellerMembership[]>([]);
  const [section, setSection] = useState<Section>('overview');
  const [dashboard, setDashboard] = useState<SellerDashboard | null>(null);
  const [branches, setBranches] = useState<SellerBranch[]>([]);
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [hasMoreProducts, setHasMoreProducts] = useState(false);
  const [loadingMoreProducts, setLoadingMoreProducts] = useState(false);
  const [stock, setStock] = useState<SellerStock[]>([]);
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [branchId, setBranchId] = useState('');
  const [orderStatus, setOrderStatus] = useState('all');
  const [productStatus, setProductStatus] = useState('all');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  const reload = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const list = await memberships();
        if (!active) return;
        setSellerMemberships(list.data);
        if (!list.data.some((membership) => membership.is_active && membership.seller_status === 'approved')) {
          setEligible(false);
          return;
        }
        await openSellerSession();
        if (!active) { await closeSellerSession(); return; }
        setEligible(true);
      } catch {
        if (active) setError(tr('تعذر فتح جلسة البائع. أعد المحاولة.', 'Could not open the seller session. Please retry.'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; void closeSellerSession(); };
    // Language changes should not discard an existing seller session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!eligible) return;
    let active = true;
    setLoading(true);
    setError('');
    void (async () => {
      try {
        if (section === 'overview') {
          const [summary, branchList] = await Promise.all([sellerDashboard(), sellerBranches()]);
          if (active) { setDashboard(summary.data); setBranches(branchList.data); }
        } else if (section === 'products') {
          const result = await sellerProducts({ limit: 50, ...(productStatus !== 'all' ? { status: productStatus } : {}) });
          if (active) { setProducts(result.data); setHasMoreProducts(result.data.length === 50); }
        } else if (section === 'inventory') {
          const [result, branchList] = await Promise.all([
            sellerStock({
              limit: 50, ...(branchId ? { branch_id: Number(branchId) } : {}),
              ...(lowStockOnly ? { low_stock_below: 5 } : {}),
            }),
            sellerBranches(),
          ]);
          if (active) { setStock(result.data); setBranches(branchList.data); }
        } else if (section === 'orders') {
          const [result, branchList] = await Promise.all([
            sellerOrders({
              limit: 50, ...(branchId ? { branch_id: Number(branchId) } : {}),
              ...(orderStatus !== 'all' ? { status: orderStatus } : {}),
            }),
            sellerBranches(),
          ]);
          if (active) { setOrders(result.data); setBranches(branchList.data); }
        }
      } catch {
        if (active) setError(tr('تعذر تحميل البيانات. تحقق من الاتصال أو صلاحيات حسابك.', 'Unable to load data. Check your connection or account permissions.'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
    // Translation text is based on UI locale; it must not issue duplicate API requests.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eligible, section, branchId, orderStatus, productStatus, lowStockOnly, revision]);

  const loadMoreProducts = async () => {
    const lastId = products[products.length - 1]?.id;
    if (loading || loadingMoreProducts || !hasMoreProducts || !lastId) return;
    setLoadingMoreProducts(true); setError('');
    try {
      const next = await sellerProducts({
        limit: 50, before_id: lastId,
        ...(productStatus !== 'all' ? { status: productStatus } : {}),
      });
      setProducts((current) => {
        const existing = new Set(current.map((product) => product.id));
        return [...current, ...next.data.filter((product) => !existing.has(product.id))];
      });
      setHasMoreProducts(next.data.length === 50);
    } catch {
      setError(tr('تعذر تحميل المزيد من المنتجات.', 'Could not load more products.'));
    } finally { setLoadingMoreProducts(false); }
  };

  const exportOrders = async () => {
    if (busy) return;
    setBusy(true); setError('');
    try {
      const file = await exportSellerOrdersCsv({
        ...(branchId ? { branch_id: Number(branchId) } : {}),
        ...(orderStatus !== 'all' ? { status: orderStatus } : {}),
      });
      const url = URL.createObjectURL(file.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.filename ?? 'seller-orders.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError(tr('تعذر تصدير الطلبات. تحققي من الصلاحيات والاتصال.', 'Could not export orders. Check permissions and connectivity.'));
    } finally { setBusy(false); }
  };

  const changeStatus = async (id: string, status: 'preparing' | 'ready') => {
    if (busy) return;
    setBusy(true); setError('');
    try { await advanceSellerOrder(id, status); reload(); }
    catch { setError(tr('تعذر تحديث الطلب.', 'Unable to update the order.')); }
    finally { setBusy(false); }
  };

  const changeStock = async (item: SellerStock) => {
    if (busy) return;
    const value = window.prompt(tr('الكمية الفعلية الجديدة (لا يمكن أن تقل عن المحجوز):', 'New physical stock (cannot be below reserved):'), String(item.on_hand));
    if (value === null) return;
    const quantity = Number(value);
    if (!Number.isSafeInteger(quantity) || quantity < item.reserved || quantity > 100000000) {
      setError(tr('أدخل كمية صحيحة لا تقل عن المخزون المحجوز.', 'Enter a valid quantity not below reserved stock.'));
      return;
    }
    if (!window.confirm(tr('هل تؤكد تعديل المخزون الفعلي؟', 'Confirm physical stock update?'))) return;
    setBusy(true); setError('');
    try { await adjustSellerStock(item.id, quantity); reload(); }
    catch { setError(tr('لم يتم حفظ الكمية. قد لا تملك الصلاحية.', 'Stock was not saved. You may lack permission.')); }
    finally { setBusy(false); }
  };

  const sections: Array<{ id: Section; ar: string; en: string }> = [
    { id: 'overview', ar: 'الرئيسية', en: 'Overview' },
    { id: 'products', ar: 'المنتجات', en: 'Products' },
    { id: 'inventory', ar: 'المخزون', en: 'Inventory' },
    { id: 'orders', ar: 'الطلبات', en: 'Orders' },
    { id: 'finance', ar: 'المالية', en: 'Finance' },
    { id: 'staff', ar: 'الفريق', en: 'Staff' },
  ];
  const labels: Record<string, string> = {
    awaiting_seller: tr('بانتظار البائع', 'Awaiting seller'),
    preparing: tr('قيد التجهيز', 'Preparing'),
    ready: tr('جاهز', 'Ready'),
    on_the_way: tr('في الطريق', 'On the way'),
    delivered: tr('تم التسليم', 'Delivered'),
  };

  return (
    <Page>
      <PageHeader
        title={tr('لوحة تشغيل البائع', 'Seller workspace')}
        lead={tr('إدارة المنتجات والمخزون والطلبات حسب صلاحية الحساب.', 'Manage products, stock and orders within your assigned permissions.')}
        back={<Link to={routePaths.account}>{tr('حسابي', 'My account')}</Link>}
      />
      {error && <p role="alert" style={{ color: '#aa3434' }}>{error}</p>}
      {!eligible && loading && <p role="status">{tr('جار فتح حساب البائع…', 'Opening seller workspace…')}</p>}
      {!eligible && !loading && (
        <div style={panel}>
          <p>{tr('هذه اللوحة متاحة للبائعين المعتمدين فقط.', 'This workspace is for approved sellers only.')}</p>
          <Link to={routePaths.sellerApplication}>{tr('طلب التسجيل كبائع', 'Apply to become a seller')}</Link>
          <div style={{ marginTop: 12 }}><button type="button" style={action} onClick={() => window.location.reload()}>{tr('إعادة المحاولة', 'Retry')}</button></div>
        </div>
      )}
      {eligible && (
        <>
          <nav aria-label={tr('أقسام البائع', 'Seller sections')} style={{ ...line, margin: '14px 0' }}>
            {sections.map((tab) => (
              <button key={tab.id} type="button" style={{ ...action, fontWeight: section === tab.id ? 700 : 400 }}
                aria-current={section === tab.id ? 'page' : undefined}
                onClick={() => setSection(tab.id)}>
                {tr(tab.ar, tab.en)}
              </button>
            ))}
            <button type="button" style={action} disabled={loading || busy} onClick={reload}>{tr('تحديث', 'Refresh')}</button>
          </nav>
          {(section === 'orders' || section === 'inventory') && (
            <div style={{ ...line, marginBottom: 12 }}>
              <label>
                {tr('الفرع', 'Branch')}{' '}
                <select value={branchId} onChange={(event) => setBranchId(event.target.value)}>
                  <option value="">{tr('كل الفروع المسموحة', 'All accessible branches')}</option>
                  {branches.map((branch) => (
                    <option value={branch.id} key={branch.id}>{ar ? branch.name_ar : branch.name_en}</option>
                  ))}
                </select>
              </label>
              {section === 'orders' && (
                <label>{tr('الحالة', 'Status')}{' '}
                  <select value={orderStatus} onChange={(event) => setOrderStatus(event.target.value)}>
                    {orderStatuses.map((status) => (
                      <option key={status} value={status}>{status === 'all' ? tr('كل الحالات', 'All statuses') : labels[status]}</option>
                    ))}
                  </select>
                </label>
              )}
              {section === 'inventory' && (
                <label><input type="checkbox" checked={lowStockOnly} onChange={(event) => setLowStockOnly(event.target.checked)}/>{' '}
                  {tr('المتاح 5 أو أقل', 'Available stock 5 or less')}
                </label>
              )}
            </div>
          )}
          {section === 'products' && (
            <div style={{ ...line, marginBottom: 12 }}>
              <label>{tr('حالة المنتج', 'Product status')}{' '}
                <select value={productStatus} onChange={(event) => setProductStatus(event.target.value)}>
                  <option value="all">{tr('كل الحالات', 'All statuses')}</option>
                  <option value="draft">{tr('مسودة', 'Draft')}</option>
                  <option value="pending_review">{tr('بانتظار المراجعة', 'Pending review')}</option>
                  <option value="published">{tr('منشور', 'Published')}</option>
                  <option value="rejected">{tr('مرفوض', 'Rejected')}</option>
                </select>
              </label>
            </div>
          )}
          {loading && <p role="status">{tr('جار تحميل البيانات…', 'Loading data…')}</p>}
          {!loading && section === 'overview' && dashboard && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: 10 }}>
                {(['awaiting_seller', 'preparing', 'ready', 'on_the_way', 'delivered'] as const).map((status) => (
                  <div key={status} style={panel}>
                    <div>{labels[status]}</div>
                    <strong style={{ fontSize: 26 }}>{dashboard[status] ?? 0}</strong>
                  </div>
                ))}
              </div>
              <section style={panel}>
                <h2>{tr('المبيعات المسلّمة', 'Delivered merchandise')}</h2>
                <strong>{(dashboard.delivered_merchandise_halalas / 100).toFixed(2)} {tr('ر.س', 'SAR')}</strong>
                <p>{tr('قيمة البضاعة بعد الخصم، وليست صافي مستحقات البائع.', 'Merchandise after discounts, not net seller payout.')}</p>
              </section>
              <section style={panel}>
                <h2>{tr('الفروع المسموحة', 'Assigned branches')}</h2>
                {branches.length === 0 ? <p>{tr('لا توجد فروع.', 'No branches.')}</p> :
                  <ul>{branches.map((branch) => <li key={branch.id}>{ar ? branch.name_ar : branch.name_en} ({branch.code})</li>)}</ul>}
              </section>
            </>
          )}
          {section === 'products' && (
            <>
              <SellerProductManagement
                products={products}
                memberships={sellerMemberships}
                onUpdated={reload}
              />
              {hasMoreProducts && !loading && (
                <button type="button" style={action} disabled={loadingMoreProducts}
                  onClick={() => void loadMoreProducts()}>
                  {loadingMoreProducts ? tr('جار التحميل…', 'Loading…') : tr('عرض المزيد من المنتجات', 'Load more products')}
                </button>
              )}
            </>
          )}
          {section === 'finance' && <SellerFinanceOverview memberships={sellerMemberships} />}
          {section === 'staff' && <SellerStaffManagement memberships={sellerMemberships} />}
          {!loading && section === 'inventory' && (
            <section>
              <h2>{tr('مخزون الفروع', 'Branch inventory')}</h2>
              {stock.length === 0 && <p>{tr('لا توجد سجلات مخزون.', 'No stock records.')}</p>}
              {stock.map((item) => (
                <article key={item.id} style={panel}>
                  <strong>{ar ? item.name_ar : item.name_en}</strong>
                  <p>SKU: {item.sku} · {tr('الفرع', 'Branch')} #{item.branch_id}</p>
                  <p>{tr('الفعلي', 'On hand')}: {item.on_hand} · {tr('المحجوز', 'Reserved')}: {item.reserved} · {tr('المتاح', 'Available')}: {item.on_hand - item.reserved}</p>
                  <button type="button" style={action} disabled={busy} onClick={() => void changeStock(item)}>
                    {tr('تعديل الكمية', 'Adjust quantity')}
                  </button>
                </article>
              ))}
              <p>{tr('تعديل الكمية متاح فقط للحسابات المخوّلة، ويمنع الخادم تخفيضها عن المحجوز.', 'Only authorized accounts may update stock; the server prevents reducing it below reservations.')}</p>
            </section>
          )}
          {!loading && section === 'orders' && (
            <section>
              <h2>{tr('طلبات التجهيز', 'Fulfilment orders')}</h2>
              <button type="button" style={action} disabled={busy} onClick={() => void exportOrders()}>{tr('تصدير الطلبات CSV', 'Export orders CSV')}</button>
              {orders.length === 0 && <p>{tr('لا توجد طلبات مطابقة.', 'No matching orders.')}</p>}
              {orders.map((order) => (
                <article key={order.id} style={panel}>
                  <h3>{order.order_number}</h3>
                  <p>{labels[order.status] ?? order.status} · {tr('الفرع', 'Branch')} #{order.branch_id}</p>
                  {order.placed_at && <small>{tr('وقت الطلب', 'Placed')}: {order.placed_at}</small>}
                  <ul>{order.items.map((item) => (
                    <li key={item.id}>{ar ? item.name.ar : item.name.en} × {item.quantity}</li>
                  ))}</ul>
                  {order.status === 'awaiting_seller' && (
                    <button type="button" style={action} disabled={busy}
                      onClick={() => void changeStatus(order.id, 'preparing')}>
                      {tr('بدء التجهيز', 'Start preparing')}
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button type="button" style={action} disabled={busy}
                      onClick={() => void changeStatus(order.id, 'ready')}>
                      {tr('جاهز للاستلام', 'Ready for pickup')}
                    </button>
                  )}
                </article>
              ))}
            </section>
          )}
        </>
      )}
    </Page>
  );
}

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isApiError } from '@/shared/api';
import { Page } from './components/Page';
import { adminDashboard, adminOrders, adminInventory, type PlatformAdminDashboard, type PlatformAdminOrder, type AdminOrderFilters, type AdminInventoryFilters, type AdminInventoryRecord } from './platformAdminApi';
import styles from './PlatformAdminDashboardScreen.module.css';
import './adminWorkspaceFamily.css';

export function PlatformAdminDashboardScreen() {
  const { i18n } = useTranslation();
  const ar = i18n.language.startsWith('ar');
  const tr = (a: string, en: string) => ar ? a : en;
  const [data, setData] = useState<PlatformAdminDashboard | null>(null);
  const [orders, setOrders] = useState<PlatformAdminOrder[]>([]);
  const [draft, setDraft] = useState({ status: '', q: '', from: '', to: '', seller_id: '', branch_id: '' });
  const [filters, setFilters] = useState<AdminOrderFilters>({});
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState('');
  const [ordersError, setOrdersError] = useState('');
  const [revision, setRevision] = useState(0);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [inventoryDraft, setInventoryDraft] = useState({ q: '', seller_id: '', branch_id: '', low_stock_only: false });
  const [inventoryFilters, setInventoryFilters] = useState<AdminInventoryFilters>({});
  const [inventoryRows, setInventoryRows] = useState<AdminInventoryRecord[]>([]);
  const [inventoryCursor, setInventoryCursor] = useState<number | null>(null);
  const [inventoryBusy, setInventoryBusy] = useState(false);
  const [inventoryError, setInventoryError] = useState('');

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
    void adminOrders({ limit: 50, ...filters })
      .then(response => { if (active) { setOrders(response.data); setNextCursor(response.data.length === 50 ? response.data.at(-1)?.id ?? null : null); } })
      .catch(() => { if (active) { setOrders([]); setOrdersError(tr('تعذر تحميل قائمة الطلبات.', 'Unable to load order list.')); } });
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revision, filters]);

  useEffect(() => {
    if (!inventoryOpen) return;
    let active = true;
    setInventoryBusy(true);
    setInventoryError('');
    void adminInventory({ limit: 50, ...inventoryFilters })
      .then(result => {
        if (active) {
          setInventoryRows(result.data);
          setInventoryCursor(result.data.length === 50 ? result.data.at(-1)?.id ?? null : null);
        }
      }).catch(() => {
        if (active) { setInventoryRows([]); setInventoryError(tr('تعذر تحميل المخزون أو لا توجد صلاحية.', 'Unable to load inventory or access denied.')); }
      }).finally(() => { if (active) setInventoryBusy(false); });
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inventoryOpen, inventoryFilters, revision]);

  const openInventory = (low: boolean) => {
    setInventoryDraft({ q: '', seller_id: '', branch_id: '', low_stock_only: low });
    setInventoryFilters({ ...(low ? { low_stock_only: true } : {}) });
    setInventoryOpen(true);
    window.requestAnimationFrame(() => document.getElementById('inventory-detail')?.scrollIntoView({ behavior: 'smooth' }));
  };
  const applyInventory = () => {
    setInventoryFilters({
      ...(inventoryDraft.q.trim() ? { q: inventoryDraft.q.trim() } : {}),
      ...(inventoryDraft.seller_id ? { seller_id: Number(inventoryDraft.seller_id) } : {}),
      ...(inventoryDraft.branch_id ? { branch_id: Number(inventoryDraft.branch_id) } : {}),
      ...(inventoryDraft.low_stock_only ? { low_stock_only: true } : {}),
    });
  };
  const loadMoreInventory = async () => {
    if (!inventoryCursor || inventoryBusy) return;
    setInventoryBusy(true);
    try {
      const reply = await adminInventory({ limit: 50, ...inventoryFilters, before_id: inventoryCursor });
      setInventoryRows(previous => [...previous, ...reply.data.filter(row => !previous.some(item => item.id === row.id))]);
      setInventoryCursor(reply.data.length === 50 ? reply.data.at(-1)?.id ?? null : null);
    } catch {
      setInventoryError(tr('تعذر تحميل المزيد من المخزون.', 'Unable to load more inventory.'));
    } finally { setInventoryBusy(false); }
  };

  const statuses: Record<string, string> = {
    awaiting_seller: tr('بانتظار البائع', 'Awaiting seller'),
    preparing: tr('قيد التجهيز', 'Preparing'),
    ready: tr('جاهز', 'Ready'),
    on_the_way: tr('في الطريق', 'On the way'),
    delivered: tr('تم التسليم', 'Delivered'),
    cancelled: tr('ملغي', 'Cancelled'),
  };

  const applyFilters = () => {
    if (draft.from && draft.to && draft.from > draft.to) {
      setOrdersError(tr('تاريخ البداية يجب أن يسبق النهاية.', 'Start date must precede end date.'));
      return;
    }
    setOrdersError('');
    setFilters({
      ...(draft.status ? { status: draft.status } : {}),
      ...(draft.q.trim() ? { q: draft.q.trim() } : {}),
      ...(draft.from ? { from: draft.from } : {}),
      ...(draft.to ? { to: draft.to } : {}),
      ...(draft.seller_id ? { seller_id: Number(draft.seller_id) } : {}),
      ...(draft.branch_id ? { branch_id: Number(draft.branch_id) } : {}),
    });
  };
  const clearFilters = () => {
    setDraft({ status: '', q: '', from: '', to: '', seller_id: '', branch_id: '' });
    setFilters({});
  };
  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const reply = await adminOrders({ limit: 50, ...filters, before_id: nextCursor });
      setOrders(previous => [...previous, ...reply.data.filter(row => !previous.some(item => item.id === row.id))]);
      setNextCursor(reply.data.length === 50 ? reply.data.at(-1)?.id ?? null : null);
    } catch {
      setOrdersError(tr('تعذر تحميل المزيد من الطلبات.', 'Unable to load more orders.'));
    } finally {
      setLoadingMore(false);
    }
  };
  const number = (value: number) => value.toLocaleString(ar ? 'ar-SA' : 'en-US');
  const metric = (label: string, value: number, status?: string) => status ? (
    <button type="button" className={styles.metric + ' ' + styles.metricAction + ' admin-family-card'}
      key={label} aria-pressed={filters.status === status} onClick={() => {
        setDraft(previous => ({ ...previous, status }));
        setFilters(previous => ({ ...previous, status }));
        document.getElementById('order-monitoring')?.scrollIntoView({ behavior: 'smooth' });
      }}>
      <span>{label}</span><strong>{number(value)}</strong>
      <small>{tr('عرض التفاصيل', 'View details')} ↗</small>
    </button>
  ) : (
    <div className={styles.metric + ' admin-family-card'} key={label}>
      <span>{label}</span><strong>{number(value)}</strong>
    </div>
  );

  return (
    <Page>
      <div className={styles.dashboard + ' admin-workspace-family'} dir={ar ? 'rtl' : 'ltr'}>
        <header className={styles.hero + ' admin-family-hero'}>
          <div>
            <h1>{tr('لوحة الإدارة', 'Admin Dashboard')}</h1>
            <p>{tr('إدارة طلبات المتاجر المسندة إليك ومتابعة مخزونها.', 'Monitor orders and stock across your assigned sellers.')}</p>
          </div>
          <button type="button" className={styles.refresh + ' admin-family-primary'} onClick={() => setRevision(x => x + 1)}>↻ {tr('تحديث', 'Refresh')}</button>
        </header>
        {loading && <p role="status">{tr('جار التحميل...', 'Loading...')}</p>}
        {!loading && denied && <p role="alert">{tr('لا توجد لديك صلاحية إدارة نشطة.', 'No active Admin access for this account.')}</p>}
        {!loading && error && <p role="alert">{error}</p>}
        {!loading && data && (
          <>
            <h2>{tr('نظرة عامة', 'Operations overview')}</h2>
            <div className={styles.metrics + ' admin-family-metrics'}>
              {metric(tr('المتاجر المسندة', 'Assigned sellers'), data.assigned_sellers)}
              {metric(tr('الطلبات', 'Seller orders'), data.suborders)}
              {metric(tr('بانتظار التجهيز', 'Awaiting preparation'), data.suborder_statuses.awaiting_seller ?? 0, 'awaiting_seller')}
              {metric(tr('قيد التجهيز', 'Preparing'), data.suborder_statuses.preparing ?? 0, 'preparing')}
              {metric(tr('جاهز للاستلام', 'Ready for pickup'), data.suborder_statuses.ready ?? 0, 'ready')}
              {metric(tr('في الطريق', 'On the way'), data.suborder_statuses.on_the_way ?? 0, 'on_the_way')}
              {metric(tr('تم التسليم', 'Delivered'), data.suborder_statuses.delivered ?? 0, 'delivered')}
            </div>
            <section id="order-monitoring" className={styles.panel + ' admin-family-panel'}>
              <div className={styles.panelHeading}>
                <div><h2>{tr('متابعة الطلبات', 'Order monitoring')}</h2><p>{tr('سجلات المتاجر ضمن صلاحياتك فقط.', 'Only orders within your assigned permissions.')}</p></div>
              </div>
              <form className={styles.filters + ' admin-family-filters'} onSubmit={event => { event.preventDefault(); applyFilters(); }}>
                <label>{tr('الحالة', 'Status')}
                  <select value={draft.status} onChange={event => setDraft(prev => ({...prev, status:event.target.value}))}>
                    <option value="">{tr('الكل', 'All')}</option>
                    {Object.entries(statuses).map(([value,label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <label>{tr('بحث عن طلب أو بائع', 'Order or seller')}
                  <input value={draft.q} maxLength={100} onChange={event => setDraft(prev => ({...prev, q:event.target.value}))} />
                </label>
                <label>{tr('رقم البائع', 'Seller ID')}
                  <input type="number" min={1} value={draft.seller_id} onChange={event => setDraft(prev => ({...prev, seller_id:event.target.value}))} />
                </label>
                <label>{tr('رقم الفرع', 'Branch ID')}
                  <input type="number" min={1} value={draft.branch_id} onChange={event => setDraft(prev => ({...prev, branch_id:event.target.value}))} />
                </label>
                <label>{tr('من تاريخ', 'Date from')}
                  <input type="date" value={draft.from} max={draft.to || undefined} onChange={event => setDraft(prev => ({...prev, from:event.target.value}))} />
                </label>
                <label>{tr('إلى تاريخ', 'Date to')}
                  <input type="date" value={draft.to} min={draft.from || undefined} onChange={event => setDraft(prev => ({...prev, to:event.target.value}))} />
                </label>
                <div className={styles.filterActions}>
                  <button type="submit" className="admin-family-primary">{tr('تطبيق', 'Apply')}</button>
                  <button type="button" className="admin-family-secondary" onClick={clearFilters}>{tr('مسح', 'Clear')}</button>
                </div>
              </form>
              {ordersError && <p role="alert">{ordersError}</p>}
              <div className={styles.tableScroll + ' admin-family-table'}>
                <table>
                  <thead><tr><th>{tr('رقم الطلب', 'Order')}</th><th>{tr('البائع', 'Seller')}</th><th>{tr('الفرع', 'Branch')}</th><th>{tr('الحالة', 'Status')}</th><th>{tr('تاريخ الطلب', 'Date')}</th></tr></thead>
                  <tbody>{orders.map(order => <tr key={order.id}>
                    <td><strong>{order.order_number}</strong></td>
                    <td>{ar ? order.seller_name_ar : order.seller_name_en}</td>
                    <td>#{order.branch_id}</td>
                    <td><span className={styles.status}>{statuses[order.status] ?? order.status}</span></td>
                    <td>{order.placed_at ? new Date(order.placed_at).toLocaleString(ar ? 'ar-SA' : 'en-US') : '—'}</td>
                  </tr>)}</tbody>
                </table>
              </div>
              {orders.length === 0 && <p className={styles.empty}>{tr('لا توجد طلبات مطابقة.', 'No matching orders.')}</p>}
              {nextCursor && <button type="button" className="admin-family-secondary" disabled={loadingMore} onClick={() => void loadMore()}>{tr('تحميل المزيد', 'Load more')}</button>}
              <p className={styles.hint}>{tr('يتم تطبيق الفلاتر على سجلات الطلبات المسموح بها من الخادم.', 'Filters are applied by the server within your assigned orders.')}</p>
            </section>
            <section id="inventory-overview" className={styles.panel}>
              <h2>{tr('نظرة على المخزون', 'Inventory overview')}</h2>
              <div className={styles.metrics}>
                <button type="button" className={styles.metric + ' ' + styles.metricAction + ' admin-family-card'} onClick={() => openInventory(false)}>
                  <span>{tr('سجلات المخزون', 'Stock records')}</span><strong>{number(data.stock_records)}</strong>
                  <small>{tr('عرض التفاصيل', 'View details')} ↗</small>
                </button>
                <button type="button" className={styles.metric + ' ' + styles.metricAction + ' admin-family-card'} onClick={() => openInventory(true)}>
                  <span>{tr('المخزون المنخفض (5 أو أقل)', 'Low stock (5 or less)')}</span><strong>{number(data.low_stock_records)}</strong>
                  <small>{tr('عرض التفاصيل', 'View details')} ↗</small>
                </button>
              </div>
            </section>
            {inventoryOpen && (
              <section id="inventory-detail" className={styles.panel + ' admin-family-panel'}>
                <div className={styles.panelHeading}>
                  <div><h2>{tr('تفاصيل المخزون', 'Inventory details')}</h2><p>{tr('فقط منتجات المتاجر المخولة لك.', 'Only stock belonging to assigned sellers.')}</p></div>
                  <button type="button" className="admin-family-secondary" onClick={() => setInventoryOpen(false)}>{tr('إغلاق', 'Close')} ✕</button>
                </div>
                <form className={styles.filters + ' admin-family-filters'} onSubmit={event => { event.preventDefault(); applyInventory(); }}>
                  <label>{tr('المنتج أو SKU', 'Product or SKU')}
                    <input type="search" maxLength={100} value={inventoryDraft.q}
                      onChange={event => setInventoryDraft(prev => ({...prev, q:event.target.value}))}/>
                  </label>
                  <label>{tr('رقم البائع', 'Seller ID')}
                    <input type="number" min={1} value={inventoryDraft.seller_id}
                      onChange={event => setInventoryDraft(prev => ({...prev, seller_id:event.target.value}))}/>
                  </label>
                  <label>{tr('رقم الفرع', 'Branch ID')}
                    <input type="number" min={1} value={inventoryDraft.branch_id}
                      onChange={event => setInventoryDraft(prev => ({...prev, branch_id:event.target.value}))}/>
                  </label>
                  <label className={styles.inventoryCheck}>
                    <input type="checkbox" checked={inventoryDraft.low_stock_only}
                      onChange={event => setInventoryDraft(prev => ({...prev, low_stock_only:event.target.checked}))}/>
                    {tr('المخزون المنخفض فقط', 'Low stock only')}
                  </label>
                  <div className={styles.filterActions}>
                    <button type="submit" className="admin-family-primary">{tr('تطبيق', 'Apply')}</button>
                    <button type="button" className="admin-family-secondary" onClick={() => {
                      setInventoryDraft({ q: '', seller_id: '', branch_id: '', low_stock_only: false });
                      setInventoryFilters({});
                    }}>{tr('مسح', 'Clear')}</button>
                  </div>
                </form>
                {inventoryBusy && <p role="status">{tr('جارٍ تحميل المخزون...', 'Loading inventory...')}</p>}
                {inventoryError && <p role="alert">{inventoryError}</p>}
                <div className={styles.tableScroll + ' admin-family-table'}>
                  <table>
                    <thead><tr>
                      <th>{tr('المنتج', 'Product')}</th><th>SKU</th>
                      <th>{tr('البائع', 'Seller')}</th><th>{tr('الفرع', 'Branch')}</th>
                      <th>{tr('الفعلي', 'On hand')}</th><th>{tr('المحجوز', 'Reserved')}</th>
                      <th>{tr('المتاح', 'Available')}</th>
                    </tr></thead>
                    <tbody>{inventoryRows.map(row => <tr key={row.id}>
                      <td>{ar ? row.name_ar : row.name_en}</td><td>{row.sku}</td>
                      <td>#{row.seller_id}</td><td>#{row.branch_id}</td>
                      <td>{number(row.on_hand)}</td><td>{number(row.reserved)}</td>
                      <td>{number(row.on_hand - row.reserved)}</td>
                    </tr>)}</tbody>
                  </table>
                </div>
                {!inventoryBusy && inventoryRows.length === 0 && !inventoryError && <p>{tr('لا توجد سجلات.', 'No records found.')}</p>}
                {inventoryCursor && <button type="button" className="admin-family-secondary" disabled={inventoryBusy}
                  onClick={() => void loadMoreInventory()}>{tr('تحميل المزيد', 'Load more')}</button>}
              </section>
            )}
            <p className={styles.updated}>{tr('آخر تحديث:', 'Updated:')} {new Date(data.generated_at).toLocaleString(ar ? 'ar-SA' : 'en-US')}</p>
          </>
        )}
      </div>
    </Page>
  );
}

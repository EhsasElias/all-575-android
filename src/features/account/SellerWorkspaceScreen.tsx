import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { routePaths } from '@/shared/lib';
import { Page } from './components/Page';
import './sellerWorkspace.css';
import { PageHeader } from './components/PageHeader';
import { SellerProductManagement } from './SellerProductManagement';
import { SellerFinanceOverview } from './SellerFinanceOverview';
import { SellerStaffManagement } from './SellerStaffManagement';
import { SellerReturnManagement } from './SellerReturnManagement';
import { SellerStoreManagement } from './SellerStoreManagement';
import { SellerInsightPanel } from './SellerInsightPanel';
import {
  memberships,
  openSellerSession,
  closeSellerSession,
  sellerDashboard,
  sellerOrders,
  sellerBranches,
  sellerProducts,
  sellerStock,
  advanceSellerOrder,
  adjustSellerStock,
  createSellerStock,
  exportSellerOrdersCsv,
  exportSellerOrdersExcel,
  sellerPackingList,
  type SellerBranch,
  type SellerDashboard,
  type SellerOrder,
  type SellerProduct,
  type SellerStock,
  type SellerMembership,
  type SellerPackingList,
  type SellerInsightMetric,
} from './sellerWorkspaceApi';

type Section =
  'overview' | 'store' | 'products' | 'inventory' | 'orders' | 'returns' | 'finance' | 'staff';
const orderStatuses = [
  'all',
  'awaiting_seller',
  'preparing',
  'ready',
  'on_the_way',
  'delivered',
] as const;

const panel: React.CSSProperties = {
  padding: 16,
  border: '1px solid var(--color-border, #d8e1db)',
  borderRadius: 14,
  marginBottom: 14,
};
const line: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
  alignItems: 'center',
};
const action: React.CSSProperties = { padding: '9px 13px', borderRadius: 9, cursor: 'pointer' };

export function SellerWorkspaceScreen() {
  const { i18n } = useTranslation();
  const ar = i18n.language.startsWith('ar');
  const tr = (arabic: string, english: string) => (ar ? arabic : english);
  const [eligible, setEligible] = useState(false);
  const [sellerMemberships, setSellerMemberships] = useState<SellerMembership[]>([]);
  const [section, setSection] = useState<Section>('overview');
  const [dashboard, setDashboard] = useState<SellerDashboard | null>(null);
  const [insightMetric, setInsightMetric] = useState<SellerInsightMetric | null>(null);
  const [branches, setBranches] = useState<SellerBranch[]>([]);
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [hasMoreProducts, setHasMoreProducts] = useState(false);
  const [loadingMoreProducts, setLoadingMoreProducts] = useState(false);
  const [stock, setStock] = useState<SellerStock[]>([]);
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [hasMoreOrders, setHasMoreOrders] = useState(false);
  const [hasMoreStock, setHasMoreStock] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [packing, setPacking] = useState<SellerPackingList | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [orderBulkNotice, setOrderBulkNotice] = useState('');
  const [branchId, setBranchId] = useState('');
  const [orderStatus, setOrderStatus] = useState('all');
  const [orderFrom, setOrderFrom] = useState('');
  const [orderTo, setOrderTo] = useState('');
  const [productStatus, setProductStatus] = useState('all');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [newStockBranch, setNewStockBranch] = useState('');
  const [newStockSku, setNewStockSku] = useState('');
  const [newStockQuantity, setNewStockQuantity] = useState('0');
  const [stockNotice, setStockNotice] = useState('');
  const [stockEditor, setStockEditor] = useState<SellerStock | null>(null);
  const [stockEditQuantity, setStockEditQuantity] = useState('');
  const [stockEditError, setStockEditError] = useState('');
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
        if (
          !list.data.some(
            (membership) => membership.is_active && membership.seller_status === 'approved',
          )
        ) {
          setEligible(false);
          return;
        }
        await openSellerSession();
        if (!active) {
          await closeSellerSession();
          return;
        }
        setEligible(true);
      } catch {
        if (active)
          setError(
            tr(
              'تعذر فتح جلسة البائع. أعد المحاولة.',
              'Could not open the seller session. Please retry.',
            ),
          );
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
      void closeSellerSession();
    };
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
          if (active) {
            setDashboard(summary.data);
            setBranches(branchList.data);
          }
        } else if (section === 'products') {
          const result = await sellerProducts({
            limit: 50,
            ...(productStatus !== 'all' ? { status: productStatus } : {}),
          });
          if (active) {
            setProducts(result.data);
            setHasMoreProducts(result.data.length === 50);
          }
        } else if (section === 'inventory') {
          const [result, branchList] = await Promise.all([
            sellerStock({
              limit: 50,
              ...(branchId ? { branch_id: Number(branchId) } : {}),
              ...(lowStockOnly ? { low_stock_below: 5 } : {}),
            }),
            sellerBranches(),
          ]);
          if (active) {
            setStock(result.data);
            setBranches(branchList.data);
            setHasMoreStock(result.data.length === 50);
          }
        } else if (section === 'orders') {
          const [result, branchList] = await Promise.all([
            sellerOrders({
              limit: 50,
              ...(branchId ? { branch_id: Number(branchId) } : {}),
              ...(orderStatus !== 'all' ? { status: orderStatus } : {}),
              ...(orderFrom ? { from: orderFrom } : {}),
              ...(orderTo ? { to: orderTo } : {}),
            }),
            sellerBranches(),
          ]);
          if (active) {
            setOrders(result.data);
            setBranches(branchList.data);
            setHasMoreOrders(result.data.length === 50);
          }
        }
      } catch {
        if (active)
          setError(
            tr(
              'تعذر تحميل البيانات. تحقق من الاتصال أو صلاحيات حسابك.',
              'Unable to load data. Check your connection or account permissions.',
            ),
          );
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // Translation text is based on UI locale; it must not issue duplicate API requests.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    eligible,
    section,
    branchId,
    orderStatus,
    orderFrom,
    orderTo,
    productStatus,
    lowStockOnly,
    revision,
  ]);

  const loadMoreProducts = async () => {
    const lastId = products[products.length - 1]?.id;
    if (loading || loadingMoreProducts || !hasMoreProducts || !lastId) return;
    setLoadingMoreProducts(true);
    setError('');
    try {
      const next = await sellerProducts({
        limit: 50,
        before_id: lastId,
        ...(productStatus !== 'all' ? { status: productStatus } : {}),
      });
      setProducts((current) => {
        const existing = new Set(current.map((product) => product.id));
        return [...current, ...next.data.filter((product) => !existing.has(product.id))];
      });
      setHasMoreProducts(next.data.length === 50);
    } catch {
      setError(tr('تعذر تحميل المزيد من المنتجات.', 'Could not load more products.'));
    } finally {
      setLoadingMoreProducts(false);
    }
  };

  const loadMoreOrders = async () => {
    const lastId = orders[orders.length - 1]?.id;
    if (!lastId || loading || loadingMore || !hasMoreOrders) return;
    setLoadingMore(true);
    setError('');
    try {
      const result = await sellerOrders({
        limit: 50,
        before_id: lastId,
        ...(branchId ? { branch_id: Number(branchId) } : {}),
        ...(orderStatus !== 'all' ? { status: orderStatus } : {}),
        ...(orderFrom ? { from: orderFrom } : {}),
        ...(orderTo ? { to: orderTo } : {}),
      });
      setOrders((current) => {
        const ids = new Set(current.map((item) => item.id));
        return [...current, ...result.data.filter((item) => !ids.has(item.id))];
      });
      setHasMoreOrders(result.data.length === 50);
    } catch {
      setError(tr('تعذر جلب المزيد من الطلبات.', 'Could not load more orders.'));
    } finally {
      setLoadingMore(false);
    }
  };

  const loadMoreStock = async () => {
    const lastId = stock[stock.length - 1]?.id;
    if (!lastId || loading || loadingMore || !hasMoreStock) return;
    setLoadingMore(true);
    setError('');
    try {
      const result = await sellerStock({
        limit: 50,
        before_id: lastId,
        ...(branchId ? { branch_id: Number(branchId) } : {}),
        ...(lowStockOnly ? { low_stock_below: 5 } : {}),
      });
      setStock((current) => {
        const ids = new Set(current.map((item) => item.id));
        return [...current, ...result.data.filter((item) => !ids.has(item.id))];
      });
      setHasMoreStock(result.data.length === 50);
    } catch {
      setError(tr('تعذر جلب المزيد من المخزون.', 'Could not load more stock records.'));
    } finally {
      setLoadingMore(false);
    }
  };

  const exportOrders = async (format: 'xlsx' | 'csv') => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const filters = {
        ...(branchId ? { branch_id: Number(branchId) } : {}),
        ...(orderStatus !== 'all' ? { status: orderStatus } : {}),
        ...(orderFrom ? { from: orderFrom } : {}),
        ...(orderTo ? { to: orderTo } : {}),
      };
      const file = format === 'xlsx'
        ? await exportSellerOrdersExcel(filters)
        : await exportSellerOrdersCsv(filters);
      const url = URL.createObjectURL(file.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = format === 'xlsx' ? 'seller-orders.xlsx' : 'seller-orders.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Android Chrome may not start the download before the current task ends.
      window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch {
      setError(
        tr(
          'تعذر تصدير الطلبات. تحققي من الصلاحيات والاتصال وإعدادات تصدير Excel.',
          'Could not export orders. Check permissions, connection and Excel export setup.',
        ),
      );
    } finally {
      setBusy(false);
    }
  };

  const viewPacking = async (id: string) => {
    if (busy) return;
    if (packing?.suborder_id === id) {
      setPacking(null);
      return;
    }
    setBusy(true);
    setPacking(null);
    setError('');
    try {
      const result = await sellerPackingList(id);
      setPacking(result.data);
    } catch {
      setError(
        tr(
          'تعذر تحميل قائمة التجهيز. تحققي من الصلاحيات.',
          'Could not load packing list. Check order access.',
        ),
      );
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async (id: string, status: 'preparing' | 'ready') => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await advanceSellerOrder(id, status);
      reload();
    } catch {
      setError(tr('تعذر تحديث الطلب.', 'Unable to update the order.'));
    } finally {
      setBusy(false);
    }
  };

  const selectedVisibleOrders = orders.filter((order) => selectedOrderIds.includes(order.id));
  const selectableOrderIds = orders.filter((order) =>
    order.status === 'awaiting_seller' || order.status === 'preparing',
  ).map((order) => order.id);
  const allSelectableOrdersSelected = selectableOrderIds.length > 0 &&
    selectableOrderIds.every((id) => selectedOrderIds.includes(id));

  // Use the same authenticated and authorized endpoint as single-order updates.
  // Each request is checked individually by the API and failures are reported.
  const bulkAdvanceOrders = async (status: 'preparing' | 'ready') => {
    if (busy) return;
    const eligible = selectedVisibleOrders.filter((order) =>
      status === 'preparing' ? order.status === 'awaiting_seller' : order.status === 'preparing',
    );
    if (!eligible.length) {
      setOrderBulkNotice(tr('الطلبات المحددة ليست في الحالة المناسبة لهذا الإجراء.',
        'No selected orders are eligible for this action.'));
      return;
    }
    if (!window.confirm(tr(
      'تأكيد تنفيذ الإجراء على ' + eligible.length + ' طلب؟',
      'Apply this action to ' + eligible.length + ' orders?',
    ))) return;
    setBusy(true);
    setError('');
    setOrderBulkNotice('');
    const succeeded: string[] = [];
    const failed: string[] = [];
    for (const order of eligible) {
      try {
        await advanceSellerOrder(order.id, status);
        succeeded.push(order.id);
      } catch {
        failed.push(order.order_number);
      }
    }
    setSelectedOrderIds((previous) => previous.filter((id) => !succeeded.includes(id)));
    setOrderBulkNotice(tr(
      'تم تحديث ' + succeeded.length + ' طلب. ' +
        (failed.length ? 'تعذر تحديث: ' + failed.join('، ') : ''),
      'Updated ' + succeeded.length + ' orders. ' +
        (failed.length ? 'Failed: ' + failed.join(', ') : ''),
    ));
    setBusy(false);
    reload();
  };

  const canAdjustStock = (item: SellerStock) => {
    const branch = branches.find((candidate) => candidate.id === item.branch_id);
    if (!branch) return false;
    return sellerMemberships.some((membership) =>
      membership.is_active &&
      membership.seller_status === 'approved' &&
      membership.seller_id === branch.seller_id &&
      (membership.role === 'owner' || membership.role === 'branch_manager') &&
      (membership.branch_id === null || membership.branch_id === item.branch_id),
    );
  };

  const stockWritableBranches = branches.filter((branch) =>
    sellerMemberships.some((membership) =>
      membership.is_active && membership.seller_status === 'approved' &&
      membership.seller_id === branch.seller_id &&
      (membership.role === 'owner' || membership.role === 'branch_manager') &&
      (membership.branch_id === null || membership.branch_id === branch.id),
    ),
  );

  const initializeStock = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || loading) return;
    const chosenBranch = Number(newStockBranch || stockWritableBranches[0]?.id);
    const quantity = Number(newStockQuantity);
    if (!stockWritableBranches.some((item) => item.id === chosenBranch) ||
        !newStockSku.trim() || newStockSku.trim().length > 100 ||
        !Number.isSafeInteger(quantity) || quantity < 0 || quantity > 100000000) {
      setError(tr('اختر فرعًا ورمز SKU صحيحًا وكمية صحيحة.',
        'Choose an authorized branch, a valid SKU and a valid quantity.'));
      return;
    }
    setBusy(true);
    setError('');
    setStockNotice('');
    try {
      await createSellerStock({
        branch_id: chosenBranch, sku: newStockSku.trim(), on_hand: quantity,
      });
      setNewStockSku('');
      setNewStockQuantity('0');
      setStockNotice(tr('تم إنشاء سجل مخزون للمنتج في الفرع.',
        'An inventory record was created for this product and branch.'));
      reload();
    } catch {
      setError(tr('تعذر إنشاء المخزون. تأكد أن SKU مسجل في منتجات المتجر ولم يُضف لهذا الفرع مسبقًا.',
        'Could not initialize stock. Ensure the SKU belongs to your store and is not already assigned to this branch.'));
    } finally {
      setBusy(false);
    }
  };

  // Keep the page stationary while the stock dialog is open. The dialog itself scrolls.
  useEffect(() => {
    if (!stockEditor) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [stockEditor]);

  const changeStock = (item: SellerStock) => {
    if (busy) return;
    setStockEditor(item);
    setStockEditQuantity(String(item.on_hand));
    setStockEditError('');
  };

  const saveStockQuantity = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || stockEditor === null) return;
    const quantity = Number(stockEditQuantity);
    if (
      !/^\d+$/.test(stockEditQuantity.trim()) ||
      !Number.isSafeInteger(quantity) ||
      quantity < stockEditor.reserved ||
      quantity > 100000000
    ) {
      setStockEditError(tr(
        'أدخل كمية صحيحة لا تقل عن المحجوز ولا تتجاوز 100,000,000.',
        'Enter a whole number between reserved stock and 100,000,000.',
      ));
      return;
    }
    setBusy(true);
    setStockEditError('');
    setError('');
    try {
      await adjustSellerStock(stockEditor.id, quantity);
      setStockEditor(null);
      setStockNotice(tr('تم تحديث كمية المخزون بنجاح.', 'Stock quantity updated successfully.'));
      reload();
    } catch (cause) {
      setStockEditError(cause instanceof Error && cause.message
        ? cause.message
        : tr('تعذر حفظ الكمية. تحقق من الصلاحيات وحاول مجدداً.',
            'Could not save quantity. Check permissions and retry.'));
    } finally {
      setBusy(false);
    }
  };

  const sections: Array<{ id: Section; ar: string; en: string }> = [
    { id: 'overview', ar: 'الرئيسية', en: 'Overview' },
    { id: 'store', ar: 'المتجر والفروع', en: 'Store & branches' },
    { id: 'products', ar: 'المنتجات', en: 'Products' },
    { id: 'inventory', ar: 'المخزون', en: 'Inventory' },
    { id: 'orders', ar: 'الطلبات', en: 'Orders' },
    { id: 'returns', ar: 'المرتجعات', en: 'Returns' },
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
    <div className="seller-workspace-shell" dir={ar ? 'rtl' : 'ltr'}>
    <Page>
      <PageHeader
        title={tr('لوحة تشغيل البائع', 'Seller workspace')}
        lead={tr(
          'إدارة المنتجات والمخزون والطلبات حسب صلاحية الحساب.',
          'Manage products, stock and orders within your assigned permissions.',
        )}
        back={<Link to={routePaths.account}>{tr('حسابي', 'My account')}</Link>}
      />
      {error && (
        <p role="alert" style={{ color: '#aa3434' }}>
          {error}
        </p>
      )}
      {stockEditor && createPortal(
        <div className="seller-stock-portal-root seller-workspace-shell" dir={ar ? 'rtl' : 'ltr'}>
        <div
          className="seller-stock-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !busy) setStockEditor(null);
          }}
        >
          <form
            className="seller-stock-modal"
            onSubmit={(event) => void saveStockQuantity(event)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="stock-editor-title"
            aria-describedby="stock-editor-description"
            onKeyDown={(event) => {
              if (event.key === 'Escape' && !busy) setStockEditor(null);
            }}
          >
            <div className="seller-stock-modal-head">
              <div>
                <span className="seller-stock-eyebrow">{tr('إدارة المخزون', 'Inventory management')}</span>
                <h3 id="stock-editor-title">{tr('تعديل كمية المخزون', 'Adjust stock quantity')}</h3>
              </div>
              <button type="button" className="seller-stock-close" disabled={busy}
                aria-label={tr('إغلاق', 'Close')} onClick={() => setStockEditor(null)}>×</button>
            </div>
            <p id="stock-editor-description" className="seller-stock-modal-product">
              <strong>{ar ? stockEditor.name_ar : stockEditor.name_en}</strong>
              <span dir="ltr">SKU: {stockEditor.sku}</span>
            </p>
            <div className="seller-stock-stats seller-stock-modal-stats">
              <div><span>{tr('الفعلي الآن', 'Current stock')}</span><strong>{stockEditor.on_hand.toLocaleString()}</strong></div>
              <div><span>{tr('المحجوز', 'Reserved')}</span><strong>{stockEditor.reserved.toLocaleString()}</strong></div>
              <div className="seller-stock-stat-available"><span>{tr('المتاح الآن', 'Available')}</span>
                <strong>{Math.max(0, stockEditor.on_hand - stockEditor.reserved).toLocaleString()}</strong></div>
            </div>
            <label className="seller-stock-quantity-field" htmlFor="seller-stock-new-quantity">
              {tr('الكمية الفعلية الجديدة', 'New physical stock quantity')}
              <input
                id="seller-stock-new-quantity"
                type="number"
                inputMode="numeric"
                autoFocus
                required
                min={stockEditor.reserved}
                max={100000000}
                step={1}
                value={stockEditQuantity}
                disabled={busy}
                aria-invalid={Boolean(stockEditError)}
                aria-describedby="seller-stock-quantity-help"
                onChange={(event) => {
                  setStockEditQuantity(event.target.value);
                  setStockEditError('');
                }}
              />
            </label>
            <p className="seller-stock-help" id="seller-stock-quantity-help">
              {tr('أدخل الإجمالي الجديد، وليس الكمية المراد إضافتها. الحد الأدنى هو المحجوز.',
                'Enter the new total, not the quantity to add. Minimum is reserved stock.')}
            </p>
            {/* Preview is informational only; the server validates the actual update. */}
            {stockEditQuantity.trim() !== '' && Number.isSafeInteger(Number(stockEditQuantity)) &&
              Number(stockEditQuantity) >= stockEditor.reserved && Number(stockEditQuantity) <= 100000000 && (
                <div className="seller-stock-preview" role="status">
                  <span>{tr('المتاح بعد التعديل', 'Available after update')}</span>
                  <strong>{(Number(stockEditQuantity) - stockEditor.reserved).toLocaleString()}</strong>
                  <small>
                    {Number(stockEditQuantity) === stockEditor.on_hand
                      ? tr('لا يوجد تغيير في الكمية', 'No change to quantity')
                      : Number(stockEditQuantity) > stockEditor.on_hand
                        ? tr('زيادة', 'Increase') + ': +' + (Number(stockEditQuantity) - stockEditor.on_hand).toLocaleString()
                        : tr('نقصان', 'Decrease') + ': -' + (stockEditor.on_hand - Number(stockEditQuantity)).toLocaleString()}
                  </small>
                </div>
              )}
            {stockEditError && <p role="alert" className="seller-stock-edit-error">{stockEditError}</p>}
            <div className="seller-stock-modal-actions">
              <button type="button" className="seller-stock-cancel" disabled={busy}
                onClick={() => setStockEditor(null)}>{tr('إلغاء', 'Cancel')}</button>
              <button type="submit" className="seller-stock-save"
                disabled={busy || !stockEditQuantity.trim() || Number(stockEditQuantity) === stockEditor.on_hand}>
                {busy ? tr('جار الحفظ…', 'Saving…') : tr('حفظ الكمية', 'Save quantity')}
              </button>
            </div>
          </form>
        </div>
        </div>,
        document.body,
      )}
      {!eligible && loading && (
        <p role="status">{tr('جار فتح حساب البائع…', 'Opening seller workspace…')}</p>
      )}
      {!eligible && !loading && (
        <div style={panel}>
          <p>
            {tr(
              'هذه اللوحة متاحة للبائعين المعتمدين فقط.',
              'This workspace is for approved sellers only.',
            )}
          </p>
          <Link to={routePaths.sellerApplication}>
            {tr('طلب التسجيل كبائع', 'Apply to become a seller')}
          </Link>
          <div style={{ marginTop: 12 }}>
            <button type="button" style={action} onClick={() => window.location.reload()}>
              {tr('إعادة المحاولة', 'Retry')}
            </button>
          </div>
        </div>
      )}
      {eligible && (
        <div className="seller-content">
          <nav
            className="seller-tabs"
            aria-label={tr('أقسام البائع', 'Seller sections')}
            style={{ ...line, margin: '14px 0' }}
          >
            {sections.map((tab) => (
              <button
                key={tab.id}
                type="button"
                style={{ ...action, fontWeight: section === tab.id ? 700 : 400 }}
                aria-current={section === tab.id ? 'page' : undefined}
                onClick={() => {
                  setPacking(null);
                  setSection(tab.id);
                }}
              >
                {tr(tab.ar, tab.en)}
              </button>
            ))}
            <button className="seller-refresh" type="button" style={action} disabled={loading || busy} onClick={reload}>
              {tr('تحديث', 'Refresh')}
            </button>
          </nav>
          {(section === 'orders' || section === 'inventory') && (
            <div className="seller-filters" style={{ marginBottom: 16 }}>
              <label>
                {tr('الفرع', 'Branch')}{' '}
                <select value={branchId} onChange={(event) => setBranchId(event.target.value)}>
                  <option value="">{tr('كل الفروع', 'All branches')}</option>
                  {branches.map((branch) => (
                    <option value={branch.id} key={branch.id}>
                      {ar ? branch.name_ar : branch.name_en}
                    </option>
                  ))}
                </select>
              </label>
              {section === 'orders' && (
                <label>
                  {tr('الحالة', 'Status')}{' '}
                  <select
                    value={orderStatus}
                    onChange={(event) => setOrderStatus(event.target.value)}
                  >
                    {orderStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status === 'all' ? tr('كل الحالات', 'All statuses') : labels[status]}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {section === 'orders' && (
                <>
                  <label>
                    {tr('من', 'From')}{' '}
                    <input
                      type="date"
                      value={orderFrom}
                      max={orderTo || undefined}
                      onChange={(event) => setOrderFrom(event.target.value)}
                    />
                  </label>
                  <label>
                    {tr('إلى', 'To')}{' '}
                    <input
                      type="date"
                      value={orderTo}
                      min={orderFrom || undefined}
                      onChange={(event) => setOrderTo(event.target.value)}
                    />
                  </label>
                  {(orderFrom || orderTo) && (
                    <button
                      type="button"
                      style={action}
                      onClick={() => {
                        setOrderFrom('');
                        setOrderTo('');
                      }}
                    >
                      {tr('مسح التواريخ', 'Clear dates')}
                    </button>
                  )}
                </>
              )}
              {section === 'inventory' && (
                <label>
                  <input
                    type="checkbox"
                    checked={lowStockOnly}
                    onChange={(event) => setLowStockOnly(event.target.checked)}
                  />{' '}
                  {tr('المتاح 5 أو أقل', 'Available stock 5 or less')}
                </label>
              )}
            </div>
          )}
          {section === 'products' && (
            <div style={{ ...line, marginBottom: 12 }}>
              <label>
                {tr('الحالة', 'Status')}{' '}
                <select
                  value={productStatus}
                  onChange={(event) => setProductStatus(event.target.value)}
                >
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
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
                  gap: 10,
                }}
              >
                {(
                  ['awaiting_seller', 'preparing', 'ready', 'on_the_way', 'delivered'] as const
                ).map((status) => (
                  <button type="button" key={status} className="seller-metric-card"
                    aria-expanded={insightMetric === status}
                    onClick={() => setInsightMetric(insightMetric === status ? null : status)}>
                    <span className="seller-metric-label">{labels[status]}</span>
                    <strong>{dashboard[status] ?? 0}</strong>
                    <span className="seller-metric-more">{tr('عرض تفاصيل الطلبات والتصدير', 'View details and export')}</span>
                  </button>
                ))}
                <button type="button" className="seller-metric-card"
                  aria-expanded={insightMetric === 'orders'}
                  onClick={() => setInsightMetric(insightMetric === 'orders' ? null : 'orders')}>
                  <span className="seller-metric-label">{tr('إجمالي الطلبات المعروضة حسب الحالات', 'Orders in tracked statuses')}</span>
                  <strong>{dashboard.awaiting_seller + dashboard.preparing + dashboard.ready +
                    dashboard.on_the_way + dashboard.delivered}</strong>
                  <span className="seller-metric-more">{tr('تفاصيل الطلبات والتصدير', 'Details and export')}</span>
                </button>
              </div>
              <div className="seller-metric-grid">
                <button type="button" className="seller-metric-card seller-metric-featured"
                  aria-expanded={insightMetric === 'sales'}
                  onClick={() => setInsightMetric(insightMetric === 'sales' ? null : 'sales')}>
                  <span className="seller-metric-label">{tr('إجمالي المبيعات المسلّمة', 'Total delivered merchandise')}</span>
                  <strong>{(dashboard.delivered_merchandise_halalas / 100).toFixed(2)} {tr('ر.س', 'SAR')}</strong>
                  <span className="seller-metric-more">{tr('التفاصيل حسب التاريخ والتصدير', 'Drill down by date and export')}</span>
                </button>
                {([
                  ['orders', tr('جميع الطلبات', 'All orders')],
                  ['products', tr('المنتجات الأكثر مبيعًا', 'Top products')],
                  ['branches', tr('أداء الفروع', 'Branch performance')],
                  ['stock', tr('تتبع المخزون', 'Inventory health')],
                ] as Array<[SellerInsightMetric, string]>).map(([metric, title]) => (
                  <button className="seller-metric-card seller-metric-shortcut" type="button" key={metric}
                    aria-expanded={insightMetric === metric}
                    onClick={() => setInsightMetric(insightMetric === metric ? null : metric)}>
                    <span>{title}</span>
                    <span className="seller-metric-more">{tr('عرض التفاصيل ←', 'View details →')}</span>
                  </button>
                ))}
              </div>
              <p className="seller-insight-disclaimer">
                {tr('هذه البطاقات تعرض الإجماليات الحالية، بينما التفاصيل تتيح تصفية التاريخ والفرع. المبيعات ليست صافي الربح؛ تكلفة الشراء والعمولات غير مكتملة.',
                  'Cards show current totals; open a report to filter dates and branches. Sales are not profit; cost and commission data are incomplete.')}
              </p>
              {insightMetric && (
                <SellerInsightPanel metric={insightMetric} branches={branches}
                  onClose={() => setInsightMetric(null)}/>
              )}
              <section style={panel}>
                <h2>{tr('الفروع المسموحة', 'Assigned branches')}</h2>
                {branches.length === 0 ? (
                  <p>{tr('لا توجد فروع.', 'No branches.')}</p>
                ) : (
                  <ul>
                    {branches.map((branch) => (
                      <li key={branch.id}>
                        {ar ? branch.name_ar : branch.name_en} ({branch.code})
                      </li>
                    ))}
                  </ul>
                )}
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
                <button
                  type="button"
                  style={action}
                  disabled={loadingMoreProducts}
                  onClick={() => void loadMoreProducts()}
                >
                  {loadingMoreProducts
                    ? tr('جار التحميل…', 'Loading…')
                    : tr('عرض المزيد من المنتجات', 'Load more products')}
                </button>
              )}
            </>
          )}
          {section === 'store' && (
            <SellerStoreManagement
              memberships={sellerMemberships}
              onStoreUpdated={(sellerId, names) => {
                setSellerMemberships((current) =>
                  current.map((membership) =>
                    membership.seller_id === sellerId
                      ? { ...membership, name_ar: names.name_ar, name_en: names.name_en }
                      : membership,
                  ),
                );
              }}
            />
          )}
          {section === 'returns' && <SellerReturnManagement />}
          {section === 'finance' && <SellerFinanceOverview memberships={sellerMemberships} />}
          {section === 'staff' && <SellerStaffManagement memberships={sellerMemberships} />}
          {!loading && section === 'inventory' && (
            <section>
              <h2>{tr('مخزون الفروع', 'Branch inventory')}</h2>
              {stockWritableBranches.length > 0 && (
                <form className="seller-stock-init" onSubmit={(event) => void initializeStock(event)}>
                  <h3>{tr('إضافة للمخزون', 'Add stock')}</h3>
                  <p>{tr('أدخل SKU لوحدة بيع موجودة مسبقًا في منتجات متجرك، ثم حدد الفرع والكمية الأولية.',
                    'Enter the SKU of an existing store product variant, then choose the branch and starting quantity.')}</p>
                  <div className="seller-stock-init-fields">
                    <label>
                      {tr('الفرع', 'Branch')}
                      <select required value={newStockBranch || String(stockWritableBranches[0]?.id ?? '')}
                        disabled={busy}
                        onChange={(event) => setNewStockBranch(event.target.value)}>
                        {stockWritableBranches.map((item) => (
                          <option key={item.id} value={item.id}>
                            {ar ? item.name_ar : item.name_en}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      {tr('SKU *', 'SKU *')}
                      <input required maxLength={100} value={newStockSku} disabled={busy}
                        placeholder="SKU-001"
                        onChange={(event) => setNewStockSku(event.target.value)}/>
                    </label>
                    <label>
                      {tr('الكمية *', 'Quantity *')}
                      <input required type="number" min={0} max={100000000} step={1}
                        value={newStockQuantity} disabled={busy}
                        onChange={(event) => setNewStockQuantity(event.target.value)}/>
                    </label>
                  </div>
                  <button type="submit" disabled={busy}>
                    {tr('إضافة إلى المخزون', 'Add to inventory')}
                  </button>
                  {stockNotice && <p role="status">{stockNotice}</p>}
                </form>
              )}
              {stock.length === 0 && <p>{tr('لا توجد سجلات مخزون.', 'No stock records.')}</p>}
              <div className="seller-stock-card-grid">
                {stock.map((item) => (
                  <article key={item.id} className="seller-stock-card">
                    <div className="seller-stock-card-head">
                      <div className="seller-stock-card-heading">
                        <h3>{ar ? item.name_ar : item.name_en}</h3>
                        <span className="seller-stock-sku" dir="ltr">SKU: {item.sku}</span>
                      </div>
                      <span className="seller-stock-branch">
                        {branches.find((branch) => branch.id === item.branch_id)
                          ? (ar ? branches.find((branch) => branch.id === item.branch_id)?.name_ar
                            : branches.find((branch) => branch.id === item.branch_id)?.name_en)
                          : tr('فرع', 'Branch') + ' #' + item.branch_id}
                      </span>
                    </div>
                    <div className="seller-stock-stats">
                      <div><span>{tr('الفعلي', 'On hand')}</span><strong>{item.on_hand.toLocaleString()}</strong></div>
                      <div><span>{tr('المحجوز', 'Reserved')}</span><strong>{item.reserved.toLocaleString()}</strong></div>
                      <div className="seller-stock-stat-available">
                        <span>{tr('المتاح', 'Available')}</span>
                        <strong>{Math.max(0, item.on_hand - item.reserved).toLocaleString()}</strong>
                      </div>
                    </div>
                    <div className="seller-stock-card-footer">
                      {item.on_hand - item.reserved <= 5
                        ? <span className="seller-stock-low">{tr('مخزون منخفض', 'Low stock')}</span>
                        : <span className="seller-stock-ok">{tr('متوفر', 'In stock')}</span>}
                      {canAdjustStock(item) && (
                        <button type="button" className="seller-stock-adjust" disabled={busy}
                          onClick={() => changeStock(item)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                            strokeLinejoin="round" aria-hidden="true">
                            <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L9 17l-4 1 1-4Z"/>
                          </svg>
                          {tr('تعديل الكمية', 'Adjust quantity')}
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
              <p>
                {tr(
                  'تعديل الكمية متاح فقط للحسابات المخوّلة، ويمنع الخادم تخفيضها عن المحجوز.',
                  'Only authorized accounts may update stock; the server prevents reducing it below reservations.',
                )}
              </p>
              {hasMoreStock && (
                <button
                  type="button"
                  style={action}
                  disabled={loadingMore}
                  onClick={() => void loadMoreStock()}
                >
                  {loadingMore
                    ? tr('جار التحميل…', 'Loading…')
                    : tr('عرض المزيد من المخزون', 'Load more inventory')}
                </button>
              )}
            </section>
          )}
          {!loading && section === 'orders' && (
            <section className="seller-orders-section">
              <div className="seller-orders-heading">
                <h2>{tr('طلبات التجهيز', 'Fulfilment orders')}</h2>
                <div className="seller-orders-export">
              <button
                type="button"
                style={action}
                disabled={busy}
                onClick={() => void exportOrders('xlsx')}
              >
                {tr('تصدير Excel', 'Export Excel')}
              </button>
              <button
                type="button"
                style={action}
                disabled={busy}
                onClick={() => void exportOrders('csv')}
              >
                {tr('تصدير CSV', 'Export CSV')}
              </button>
                </div>
              </div>
              {orders.length === 0 && <p>{tr('لا توجد طلبات مطابقة.', 'No matching orders.')}</p>}
              <div className="seller-orders-bulkbar">
                <span>{tr('المحدد:', 'Selected:')} <strong>{selectedVisibleOrders.length}</strong></span>
                <button type="button" disabled={busy || !selectedVisibleOrders.some((order) => order.status === 'awaiting_seller')}
                  onClick={() => void bulkAdvanceOrders('preparing')}>
                  {tr('بدء التجهيز للمحدد', 'Start preparing selected')}
                </button>
                <button type="button" disabled={busy || !selectedVisibleOrders.some((order) => order.status === 'preparing')}
                  onClick={() => void bulkAdvanceOrders('ready')}>
                  {tr('تحديد المحدد كجاهز', 'Mark selected ready')}
                </button>
                <button type="button" disabled={busy || selectedOrderIds.length === 0}
                  onClick={() => setSelectedOrderIds([])}>
                  {tr('إلغاء التحديد', 'Clear selection')}
                </button>
              </div>
              {orderBulkNotice && <p role="status" className="seller-orders-bulknotice">{orderBulkNotice}</p>}
              <div className="seller-orders-table-wrap">
                <table className="seller-orders-table">
                  <thead>
                    <tr>
                      <th scope="col" className="seller-orders-select-cell">
                        <input type="checkbox" aria-label={tr('تحديد كل الطلبات القابلة للتحديث', 'Select all actionable orders')}
                          checked={allSelectableOrdersSelected}
                          disabled={busy || selectableOrderIds.length === 0}
                          onChange={(event) => setSelectedOrderIds(event.target.checked ? selectableOrderIds : [])} />
                      </th>
                      <th scope="col">{tr('رقم الطلب', 'Order number')}</th>
                      <th scope="col">{tr('الحالة', 'Status')}</th>
                      <th scope="col">{tr('الفرع', 'Branch')}</th>
                      <th scope="col">{tr('وقت الطلب', 'Placed at')}</th>
                      <th scope="col">{tr('المنتجات المطلوبة', 'Items to prepare')}</th>
                      <th scope="col">{tr('الإجراءات', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => {
                      const actionable = order.status === 'awaiting_seller' || order.status === 'preparing';
                      const branch = branches.find((item) => item.id === order.branch_id);
                      return (
                        <tr key={order.id} className={selectedOrderIds.includes(order.id) ? 'seller-order-selected' : ''}>
                          <td className="seller-orders-select-cell">
                            <input type="checkbox" checked={selectedOrderIds.includes(order.id)}
                              disabled={busy || !actionable}
                              aria-label={tr('تحديد الطلب ', 'Select order ') + order.order_number}
                              onChange={(event) => setSelectedOrderIds((previous) =>
                                event.target.checked ? [...previous, order.id] : previous.filter((id) => id !== order.id),
                              )} />
                          </td>
                          <td><strong dir="ltr">{order.order_number}</strong></td>
                          <td><span className="seller-order-status">{labels[order.status] ?? order.status}</span></td>
                          <td>{branch ? (ar ? branch.name_ar : branch.name_en) : tr('فرع', 'Branch') + ' #' + order.branch_id}</td>
                          <td><bdi dir="auto">{order.placed_at ? order.placed_at.replace('T', ' ').replace(/\\.\\d+Z?$/, '') : '—'}</bdi></td>
                          <td>
                            <div className="seller-orders-items-cell">
                              {order.items.map((item) => (
                                <div key={item.id}>
                                  <span>{ar ? item.name.ar : item.name.en}</span>
                                  <strong dir="ltr">× {item.quantity}</strong>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td>
                            <div className="seller-orders-row-actions">
                              <button type="button" disabled={busy}
                                aria-expanded={packing?.suborder_id === order.id}
                                onClick={() => void viewPacking(order.id)}>
                                {packing?.suborder_id === order.id
                                  ? tr('إخفاء القائمة', 'Hide list') : tr('قائمة التجهيز', 'Packing list')}
                              </button>
                              {order.status === 'awaiting_seller' && (
                                <button type="button" className="seller-order-primary" disabled={busy}
                                  onClick={() => void changeStatus(order.id, 'preparing')}>
                                  {tr('بدء التجهيز', 'Start preparing')}
                                </button>
                              )}
                              {order.status === 'preparing' && (
                                <button type="button" className="seller-order-primary" disabled={busy}
                                  onClick={() => void changeStatus(order.id, 'ready')}>
                                  {tr('جاهز للاستلام', 'Ready for pickup')}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {packing && orders.some((order) => order.id === packing.suborder_id) && (
                <section className="seller-orders-packing-detail">
                  <div className="seller-orders-packing-head">
                    <h3>{tr('قائمة تجهيز الطلب', 'Order packing list')} — <bdi>{packing.order_number}</bdi></h3>
                    <button type="button" onClick={() => setPacking(null)}>{tr('إغلاق', 'Close')}</button>
                  </div>
                  <p>{tr('الفرع', 'Branch')} #{packing.branch_id} · {labels[packing.status] ?? packing.status}</p>
                  <ul>
                    {packing.items.map((item) => (
                      <li key={item.variant_id}>
                        <span>{ar ? item.product.ar : item.product.en}
                          {' — '}{(ar ? item.variant.ar : item.variant.en) || '#' + item.variant_id}</span>
                        <strong>× {item.quantity}</strong>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {hasMoreOrders && (
                <button
                  type="button"
                  style={action}
                  disabled={loadingMore}
                  onClick={() => void loadMoreOrders()}
                >
                  {loadingMore
                    ? tr('جار التحميل…', 'Loading…')
                    : tr('عرض المزيد من الطلبات', 'Load more orders')}
                </button>
              )}
            </section>
          )}
        </div>
      )}
    </Page>
    </div>
  );
}

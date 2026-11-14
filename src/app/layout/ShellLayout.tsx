import { Outlet, useLocation } from 'react-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AccountSidebar } from './AccountSidebar';
import { DashboardSidebar } from './DashboardSidebar';
import { routePaths } from '@/shared/lib';
import { GuestCartMerger, useCartItemCount } from '@/features/cart';
import { TestBuildBanner } from '@/features/testserver';
import { useSession } from '@/shared/session';
import { BottomNav } from './BottomNav';
import { MAIN_CONTENT_ID } from './SkipLink';
import { TopBar } from './TopBar';
import styles from './ShellLayout.module.css';

const workspacePages: readonly string[] = [
  routePaths.dashboard,
  routePaths.sellerWorkspace,
  routePaths.sellerReview,
  routePaths.superAdminDashboard,
  routePaths.platformAdminDashboard,
];

export function ShellLayout() {
  const cartCount = useCartItemCount();
  const { i18n } = useTranslation();
  const ar = i18n.language.startsWith('ar');
  const { status } = useSession();
  const { pathname, search, hash } = useLocation();
  const dashboardRoute = status === 'signed-in' && workspacePages.includes(pathname);
  const accountRoute = status === 'signed-in' && (
    dashboardRoute || pathname === routePaths.account || pathname.startsWith('/account/') ||
    pathname === routePaths.orders || pathname.startsWith('/orders/')
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { setSidebarOpen(false); }, [pathname, search, hash]);

  return (
    <div className={styles.shell}>
      <TestBuildBanner />
      <TopBar />
      {accountRoute ? (
        <div className={styles.accountShell}>
          <button type="button" className={styles.sidebarToggle}
            aria-expanded={sidebarOpen} aria-controls="account-navigation"
            aria-label={dashboardRoute ? (ar ? 'قائمة لوحة التحكم' : 'Dashboard menu') : (ar ? 'قائمة الحساب' : 'Account menu')}
            onClick={() => setSidebarOpen(open => !open)}>
            {sidebarOpen ? '✕' : '☰'}{' '}
            {dashboardRoute
              ? (ar ? 'قائمة لوحة التحكم' : 'Dashboard menu')
              : (ar ? 'قائمة الحساب' : 'Account menu')}
          </button>
          <div id="account-navigation"
            className={sidebarOpen ? styles.sidebarArea + ' ' + styles.sidebarOpen : styles.sidebarArea}>
            {dashboardRoute
              ? <DashboardSidebar onNavigate={() => setSidebarOpen(false)} />
              : <AccountSidebar onNavigate={() => setSidebarOpen(false)} />}
          </div>
          <main id={MAIN_CONTENT_ID} tabIndex={-1}
            className={styles.main + ' ' + styles.mainWide + ' ' + styles.accountMain}>
            <Outlet />
          </main>
        </div>
      ) : (
        <main id={MAIN_CONTENT_ID} tabIndex={-1} className={styles.main}>
          <Outlet />
        </main>
      )}
      <BottomNav badges={{ cart: cartCount }} guest={status === 'guest'} />
      <GuestCartMerger />
    </div>
  );
}

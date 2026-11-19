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
  routePaths.courierWorkspace,
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
  const accountRoute =
    status === 'signed-in' &&
    (dashboardRoute ||
      pathname === routePaths.account ||
      pathname.startsWith('/account/') ||
      pathname === routePaths.orders ||
      pathname.startsWith('/orders/'));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname, search, hash]);
  useEffect(() => {
    if (!sidebarOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [sidebarOpen]);

  return (
    <div className={styles.shell}>
      <TestBuildBanner />
      <TopBar
        {...(accountRoute
          ? {
              onAccountMenu: () => {
                setSidebarOpen(true);
              },
            }
          : {})}
      />
      {accountRoute ? (
        <div className={styles.accountShell}>
          <button
            type="button"
            className={styles.sidebarToggle}
            aria-expanded={sidebarOpen}
            aria-controls="account-navigation"
            aria-label={
              dashboardRoute
                ? ar
                  ? 'فتح قائمة لوحة التحكم'
                  : 'Open dashboard menu'
                : ar
                  ? 'فتح قائمة الحساب'
                  : 'Open account menu'
            }
            onClick={() => {
              setSidebarOpen((open) => !open);
            }}
          >
            <span aria-hidden="true">{sidebarOpen ? '✕' : '☰'}</span>
            <span>
              {dashboardRoute
                ? ar
                  ? 'أقسام لوحة التحكم'
                  : 'Dashboard sections'
                : ar
                  ? 'قائمة الحساب'
                  : 'Account navigation'}
            </span>
          </button>
          {sidebarOpen && (
            <button
              type="button"
              className={styles.sidebarBackdrop}
              aria-label={ar ? 'إغلاق القائمة' : 'Close navigation'}
              onClick={() => {
                setSidebarOpen(false);
              }}
            />
          )}
          <div
            id="account-navigation"
            className={
              sidebarOpen ? styles.sidebarArea + ' ' + styles.sidebarOpen : styles.sidebarArea
            }
          >
            {dashboardRoute ? (
              <DashboardSidebar
                onNavigate={() => {
                  setSidebarOpen(false);
                }}
              />
            ) : (
              <AccountSidebar
                onNavigate={() => {
                  setSidebarOpen(false);
                }}
              />
            )}
          </div>
          <main
            id={MAIN_CONTENT_ID}
            tabIndex={-1}
            className={styles.main + ' ' + styles.mainWide + ' ' + styles.accountMain}
          >
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

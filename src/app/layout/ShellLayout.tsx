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
  const fr = i18n.language.startsWith('fr');
  const { status } = useSession();
  const { pathname, search, hash } = useLocation();
  const workspaceContext = new URLSearchParams(search).get('workspace');
  const dashboardNotification =
    pathname === routePaths.notifications &&
    ['super', 'admin', 'review', 'seller', 'courier', 'customer'].includes(workspaceContext ?? '');
  const dashboardRoute =
    status === 'signed-in' && (workspacePages.includes(pathname) || dashboardNotification);
  const accountRoute =
    status === 'signed-in' &&
    (dashboardRoute ||
      pathname === routePaths.account ||
      pathname.startsWith('/account/') ||
      pathname === routePaths.orders ||
      pathname.startsWith('/orders/'));
  // A drawer belongs to the route on which it was opened. Navigation closes it
  // by derivation, avoiding a synchronous state change in a render effect.
  const locationKey = pathname + search + hash;
  const [drawer, setDrawer] = useState<{ route: string; open: boolean }>({
    route: '',
    open: false,
  });
  const sidebarOpen = drawer.open && drawer.route === locationKey;
  const closeSidebar = () => {
    setDrawer({ route: locationKey, open: false });
  };
  useEffect(() => {
    if (!sidebarOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawer({ route: locationKey, open: false });
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [sidebarOpen, locationKey]);

  return (
    <div className={styles.shell}>
      <TestBuildBanner />
      <TopBar
        {...(accountRoute
          ? {
              onAccountMenu: () => {
                setDrawer({ route: locationKey, open: true });
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
                  : fr
                    ? 'Ouvrir le menu du tableau de bord'
                    : 'Open dashboard menu'
                : ar
                  ? 'فتح قائمة الحساب'
                  : fr
                    ? 'Ouvrir le menu du compte'
                    : 'Open account menu'
            }
            onClick={() => {
              setDrawer({ route: locationKey, open: !sidebarOpen });
            }}
          >
            <span aria-hidden="true">{sidebarOpen ? '✕' : '☰'}</span>
            <span>
              {dashboardRoute
                ? ar
                  ? 'أقسام لوحة التحكم'
                  : fr
                    ? 'Sections du tableau de bord'
                    : 'Dashboard sections'
                : ar
                  ? 'قائمة الحساب'
                  : fr
                    ? 'Navigation du compte'
                    : 'Account navigation'}
            </span>
          </button>
          {sidebarOpen && (
            <button
              type="button"
              className={styles.sidebarBackdrop}
              aria-label={ar ? 'إغلاق القائمة' : fr ? 'Fermer la navigation' : 'Close navigation'}
              onClick={() => {
                closeSidebar();
              }}
            />
          )}
          <div
            id="account-navigation"
            className={
              sidebarOpen
                ? (styles.sidebarArea ?? '') + ' ' + (styles.sidebarOpen ?? '')
                : styles.sidebarArea
            }
          >
            {dashboardRoute ? (
              <DashboardSidebar
                onNavigate={() => {
                  closeSidebar();
                }}
              />
            ) : (
              <AccountSidebar
                onNavigate={() => {
                  closeSidebar();
                }}
              />
            )}
          </div>
          <main
            id={MAIN_CONTENT_ID}
            tabIndex={-1}
            className={
              (styles.main ?? '') + ' ' + (styles.mainWide ?? '') + ' ' + (styles.accountMain ?? '')
            }
          >
            <Outlet />
          </main>
        </div>
      ) : (
        <main
          id={MAIN_CONTENT_ID}
          tabIndex={-1}
          className={`${styles.main} ${pathname === routePaths.home ? styles.homeMain : ''} `}
        >
          <Outlet />
        </main>
      )}
      <BottomNav badges={{ cart: cartCount }} guest={status === 'guest'} />
      <GuestCartMerger />
    </div>
  );
}

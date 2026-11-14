import { Outlet, useLocation } from 'react-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTranslation } from 'react-i18next';
import { AccountSidebar } from './AccountSidebar';
import { routePaths } from '@/shared/lib';
import { GuestCartMerger, useCartItemCount } from '@/features/cart';
import { TestBuildBanner } from '@/features/testserver';
import { useSession } from '@/shared/session';
import { BottomNav } from './BottomNav';
import { MAIN_CONTENT_ID } from './SkipLink';
import { TopBar } from './TopBar';
import styles from './ShellLayout.module.css';

export function ShellLayout() {
  const cartCount = useCartItemCount();
  const { i18n } = useTranslation();
  const ar = i18n.language.startsWith('ar');
  const { status } = useSession();
  const { pathname, search } = useLocation();
  const { i18n } = useTranslation();
  const ar = i18n.language.startsWith('ar');
  const accountRoute = status === 'signed-in' && (pathname === routePaths.account || pathname.startsWith('/account/') || pathname === routePaths.orders || pathname.startsWith('/orders/'));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={styles.shell}>
      <TestBuildBanner />
      <TopBar />
      {accountRoute ? (
        <div className={styles.accountShell}>
          <button type="button" className={styles.sidebarToggle} aria-expanded={sidebarOpen}
            aria-controls="account-navigation" aria-label={ar ? 'قائمة الحساب' : 'Account menu'} onClick={() => setSidebarOpen(open => !open)}>
            {sidebarOpen ? '✕' : '☰'} {sidebarOpen ? (ar ? 'إغلاق قائمة الحساب' : 'Close account menu') : (ar ? 'قائمة الحساب' : 'Account menu')}
          </button>
          <div id="account-navigation" className={sidebarOpen ? styles.sidebarArea + ' ' + styles.sidebarOpen : styles.sidebarArea}>
            <AccountSidebar onNavigate={() => setSidebarOpen(false)} />
          </div>
          <main id={MAIN_CONTENT_ID} tabIndex={-1} className={styles.main + ' ' + styles.mainWide + ' ' + styles.accountMain}>
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

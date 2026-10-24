import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router';
import { formatNumber, useLanguage } from '@/shared/i18n';
import { cx, routePaths } from '@/shared/lib';
import { Icon, type IconName } from '@/shared/ui';
import styles from './BottomNav.module.css';

export type TabId = 'home' | 'categories' | 'cart' | 'orders' | 'account';

type Tab = {
  id: TabId;
  to: string;
  icon: IconName;
  label: 'nav.home' | 'nav.categories' | 'nav.cart' | 'nav.orders' | 'nav.account';
};

const TABS: readonly Tab[] = [
  { id: 'home', to: routePaths.home, icon: 'home', label: 'nav.home' },
  { id: 'categories', to: routePaths.categories, icon: 'grid', label: 'nav.categories' },
  { id: 'cart', to: routePaths.cart, icon: 'cart', label: 'nav.cart' },
  { id: 'orders', to: routePaths.orders, icon: 'receipt', label: 'nav.orders' },
  { id: 'account', to: routePaths.account, icon: 'user', label: 'nav.account' },
];

const MAX_BADGE = 99;

type BottomNavProps = {
  /** Small counters on a tab, such as the number of items in the cart. */
  badges?: Partial<Record<TabId, number>>;
};

export function BottomNav({ badges = {} }: BottomNavProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();

  return (
    <nav aria-label={t('nav.label')} className={styles.nav}>
      <ul className={styles.list}>
        {TABS.map((tab) => {
          const count = badges[tab.id] ?? 0;
          const badgeText = count > MAX_BADGE ? `${MAX_BADGE}+` : formatNumber(count, language);
          // The visible count is hidden from assistive technology; this says the same in words.
          const accessibleName =
            count > 0
              ? t('nav.tabWithBadge', {
                  label: t(tab.label),
                  badge: t('nav.cartBadge', { total: formatNumber(count, language) }),
                })
              : undefined;
          return (
            <li key={tab.id} className={styles.item}>
              <NavLink
                to={tab.to}
                aria-label={accessibleName}
                className={({ isActive }) => cx(styles.link, isActive && styles.active)}
              >
                <span className={styles.iconWrap}>
                  <Icon name={tab.icon} />
                  {count > 0 && (
                    <span className={styles.badge} aria-hidden="true">
                      {badgeText}
                    </span>
                  )}
                </span>
                <span className={styles.label}>{t(tab.label)}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { routePaths } from '@/shared/lib';
import { Icon, type IconName } from '@/shared/ui';
import { useDirectionalIcons } from './useDirectionalIcons';
import styles from './AccountMenu.module.css';

type MenuEntry = {
  to: string;
  icon: IconName;
  label: 'menu.profile' | 'menu.orders' | 'menu.addresses' | 'menu.spending' | 'menu.sessions';
  hint:
    | 'menu.profileHint'
    | 'menu.ordersHint'
    | 'menu.addressesHint'
    | 'menu.spendingHint'
    | 'menu.sessionsHint';
};

// Orders, addresses and spending are built by other features; they are only linked here.
const ENTRIES: readonly MenuEntry[] = [
  { to: routePaths.profile, icon: 'user', label: 'menu.profile', hint: 'menu.profileHint' },
  { to: routePaths.orders, icon: 'receipt', label: 'menu.orders', hint: 'menu.ordersHint' },
  {
    to: routePaths.addresses,
    icon: 'map-pin',
    label: 'menu.addresses',
    hint: 'menu.addressesHint',
  },
  {
    to: routePaths.spending,
    icon: 'credit-card',
    label: 'menu.spending',
    hint: 'menu.spendingHint',
  },
  { to: routePaths.sessions, icon: 'shield', label: 'menu.sessions', hint: 'menu.sessionsHint' },
];

export function AccountMenu() {
  const { t } = useTranslation('account');
  const { forward } = useDirectionalIcons();

  return (
    <nav aria-label={t('menu.label')}>
      <ul className={styles.list}>
        {ENTRIES.map((entry) => (
          <li key={entry.to}>
            <Link to={entry.to} className={styles.link}>
              <span className={styles.icon}>
                <Icon name={entry.icon} />
              </span>
              <span className={styles.text}>
                <span className={styles.label}>{t(entry.label)}</span>
                <span className={styles.hint}>{t(entry.hint)}</span>
              </span>
              <Icon name={forward} size={20} className={styles.chevron} />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

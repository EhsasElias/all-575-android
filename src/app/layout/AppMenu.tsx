import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { CategoryMenu } from '@/features/catalog';
import { useLanguage } from '@/shared/i18n';
import { routePaths } from '@/shared/lib';
import { ThemePicker } from '@/shared/theme';
import { Icon, LanguageSwitch, Logo, Sheet, type IconName } from '@/shared/ui';
import styles from './AppMenu.module.css';

const LINKS: readonly {
  to: string;
  label: 'orders' | 'addresses' | 'spending' | 'support' | 'account';
  icon: IconName;
}[] = [
  { to: routePaths.orders, label: 'orders', icon: 'package' },
  { to: routePaths.addresses, label: 'addresses', icon: 'map-pin' },
  { to: routePaths.customerCases, label: 'support', icon: 'info' },
  { to: routePaths.spending, label: 'spending', icon: 'receipt' },
  { to: routePaths.account, label: 'account', icon: 'user' },
];

export function AppMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation('navigation');
  const { t: tc } = useTranslation('catalog');
  const { t: tBuyer } = useTranslation('customer');
  const { language, setLanguage } = useLanguage();

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t('title')}
      placement="side"
      footer={
        <div className={styles.preferences}>
          <ThemePicker />
          <LanguageSwitch value={language} onChange={setLanguage} />
        </div>
      }
    >
      <div className={styles.welcome}>
        <Logo decorative size={64} />
        <div>
          <p className={styles.greeting}>{t('greeting')}</p>
          <p className={styles.intro}>{t('intro')}</p>
        </div>
      </div>
      <nav aria-label={t('title')} className={styles.navigation}>
        <Link to={routePaths.home} onClick={onClose} className={styles.home}>
          <Icon name="home" />
          {t('home')}
        </Link>
        <CategoryMenu onNavigate={onClose} />
        <Link to={routePaths.savedProducts} onClick={onClose} className={styles.link}>
          <Icon name="cart" />
          {tc('saved.title')}
        </Link>
        <Link to={routePaths.customerRequests} onClick={onClose} className={styles.link}>
          <Icon name="receipt" />
          {tBuyer('requests')}
        </Link>
        {LINKS.map((link) => (
          <Link key={link.to} to={link.to} onClick={onClose} className={styles.link}>
            <Icon name={link.icon} />
            {t(link.label)}
          </Link>
        ))}
      </nav>
    </Sheet>
  );
}

import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { CategoryMenu } from '@/features/catalog';
import { useLanguage } from '@/shared/i18n';
import { routePaths } from '@/shared/lib';
import { ThemePicker } from '@/shared/theme';
import { Icon, LanguageSwitch, Logo, Sheet } from '@/shared/ui';
import styles from './AppMenu.module.css';

export function AppMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation('navigation');
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
        <Link to={routePaths.account} onClick={onClose} className={styles.link}>
          <Icon name="user" />
          {t('account')}
        </Link>
      </nav>
    </Sheet>
  );
}

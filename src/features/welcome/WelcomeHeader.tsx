import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { useLanguage } from '@/shared/i18n';
import { ButtonLink, LanguageSwitch, Logo } from '@/shared/ui';
import { markWelcomeSeen } from './welcomeSeen';
import { afterIntroPath } from './introPaths';
import styles from './WelcomeHeader.module.css';

type WelcomeHeaderProps = {
  onStartShopping: () => void;
};

/** Skip on the left, language in the middle, logo on the right, in Arabic and English alike. */
export function WelcomeHeader({ onStartShopping }: WelcomeHeaderProps) {
  const { t } = useTranslation('welcome');
  const { language, setLanguage } = useLanguage();
  const [params] = useSearchParams();

  return (
    <header dir="ltr" className={styles.header}>
      <ButtonLink
        variant="ghost"
        to={afterIntroPath(params.get('next'))}
        replace
        className={styles.skip}
        onClick={markWelcomeSeen}
      >
        {t('skip')}
      </ButtonLink>
      <LanguageSwitch value={language} onChange={setLanguage} />
      <button
        type="button"
        className={styles.logoButton}
        aria-label={t('cta')}
        onClick={onStartShopping}
      >
        <Logo decorative size={50} className={styles.logo} />
      </button>
    </header>
  );
}

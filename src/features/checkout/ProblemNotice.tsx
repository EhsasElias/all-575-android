import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { routePaths, routeTo } from '@/shared/lib';
import { Icon } from '@/shared/ui';
import { linksFor, type CheckoutProblem } from './problems';
import styles from './ProblemNotice.module.css';

type ProblemNoticeProps = { problem: CheckoutProblem; addressId: number | null };

/** The one thing that went wrong at checkout, in words, with the next step beside it. */
export function ProblemNotice({ problem, addressId }: ProblemNoticeProps) {
  const { t } = useTranslation('checkout');
  const links = linksFor(problem);

  return (
    <div className={styles.notice} role="alert">
      <Icon name="alert-circle" size={20} />
      <div className={styles.text}>
        {problem.kind === 'refused' && (
          <>
            <strong>{t(`problems.${problem.code}.title`)}</strong>
            <span>{t(`problems.${problem.code}.message`)}</span>
          </>
        )}
        {problem.kind === 'quote_changed' && (
          <>
            <strong>{t('problems.quote_changed.title')}</strong>
            <span>{t('problems.quote_changed.message')}</span>
          </>
        )}
        {problem.kind === 'offline' && (
          <>
            <strong>{t('problems.offline.title')}</strong>
            <span>{t('problems.offline.message')}</span>
          </>
        )}
        {problem.kind === 'failed' && (
          <>
            <strong>{t('problems.failed.title')}</strong>
            <span>{t('problems.failed.message')}</span>
          </>
        )}
        {links.includes('cart') && <Link to={routePaths.cart}>{t('problems.backToCart')}</Link>}
        {links.includes('address') && (
          <>
            {addressId !== null && (
              <Link to={routeTo.addressEdit(addressId)}>{t('address.editPin')}</Link>
            )}
            <Link to={routePaths.addresses}>{t('problems.chooseAnotherAddress')}</Link>
          </>
        )}
      </div>
    </div>
  );
}

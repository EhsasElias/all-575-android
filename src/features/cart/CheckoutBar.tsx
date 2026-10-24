import { useTranslation } from 'react-i18next';
import { routePaths } from '@/shared/lib';
import { Button, ButtonLink } from '@/shared/ui';
import styles from './CheckoutBar.module.css';

type CheckoutBarProps = {
  /** False when nothing in the cart can be bought (it is empty, or every line is unavailable). */
  canCheckout: boolean;
};

/**
 * The way forward. It stays above the tab bar while a long list scrolls, so it is always in reach. A guest who
 * follows it is sent to sign in by the checkout route and brought back.
 */
export function CheckoutBar({ canCheckout }: CheckoutBarProps) {
  const { t } = useTranslation('cart');

  return (
    <div className={styles.bar}>
      {canCheckout ? (
        <ButtonLink to={routePaths.checkout} size="lg" fullWidth>
          {t('summary.checkout')}
        </ButtonLink>
      ) : (
        <Button size="lg" fullWidth disabled>
          {t('summary.checkout')}
        </Button>
      )}
    </div>
  );
}

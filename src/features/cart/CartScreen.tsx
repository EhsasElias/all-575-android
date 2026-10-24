import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { routePaths } from '@/shared/lib';
import { ButtonLink, EmptyState, ErrorState, Icon } from '@/shared/ui';
import styles from './CartScreen.module.css';
import { CartLineItem } from './CartLineItem';
import type { ScreenLine } from './cartScreenModel';
import { CartSkeleton } from './CartSkeleton';
import { CartSummary } from './CartSummary';
import { CheckoutBar } from './CheckoutBar';
import { useCartScreen } from './useCartScreen';

export function CartScreen() {
  const { t } = useTranslation('cart');
  const cart = useCartScreen();
  const titleRef = useRef<HTMLHeadingElement>(null);

  const handleRemove = (line: ScreenLine): void => {
    // The button is about to disappear; park keyboard and screen reader focus on the title first.
    titleRef.current?.focus({ preventScroll: true });
    void cart.removeLine(line);
  };

  return (
    <div className={styles.screen}>
      <h1 ref={titleRef} tabIndex={-1} className={styles.title}>
        {t('title')}
      </h1>

      {cart.status === 'loading' && <CartSkeleton />}

      {cart.status === 'error' && (
        <ErrorState
          headingLevel={2}
          title={t('error.title')}
          message={t('error.message')}
          onRetry={cart.retry}
        />
      )}

      {cart.status === 'ready' && cart.lines.length === 0 && (
        <EmptyState
          headingLevel={2}
          icon="cart"
          title={t('emptyTitle')}
          message={t('emptyMessage')}
          action={<ButtonLink to={routePaths.categories}>{t('browseCategories')}</ButtonLink>}
        />
      )}

      {cart.status === 'ready' && cart.lines.length > 0 && (
        <>
          {cart.hasUnavailableLines && (
            <p role="status" className={styles.warning}>
              <Icon name="alert-circle" size={20} />
              {t('unavailableNotice')}
            </p>
          )}
          <ul aria-label={t('listLabel')} className={styles.list}>
            {cart.lines.map((line) => (
              <CartLineItem
                key={line.variantId}
                line={line}
                onQuantityChange={(target, quantity) => void cart.changeQuantity(target, quantity)}
                onRemove={handleRemove}
              />
            ))}
          </ul>
          <CartSummary items={cart.buyableItems} subtotal={cart.subtotal} isGuest={cart.isGuest} />
          <CheckoutBar canCheckout={cart.buyableItems > 0} />
        </>
      )}
    </div>
  );
}

import { useTranslation } from 'react-i18next';
import type { Schemas } from '@/shared/api';
import { routePaths } from '@/shared/lib';
import { Button, ButtonLink, Icon } from '@/shared/ui';
import styles from './AddToCart.module.css';
import { MAX_QUANTITY_PER_LINE } from './cartRules';
import { QuantityStepper } from './QuantityStepper';
import { useAddToCart } from './useAddToCart';

type AddToCartProps = {
  product: Schemas['ProductDetailResource'];
  variant: Schemas['VariantResource'];
};

/**
 * What the product page shows to put the chosen variant in the cart: a quantity stepper and the button. The
 * cart feature owns where the line goes: the server cart when signed in, the device cart for a guest.
 */
export function AddToCart({ product, variant }: AddToCartProps) {
  const { t } = useTranslation('cart');
  const { name, quantity, setQuantity, pending, added, refusal, add } = useAddToCart(
    product,
    variant,
  );

  if (variant.availability === 'out_of_stock') {
    return (
      <div className={styles.root}>
        <Button fullWidth disabled>
          {t('add.outOfStock')}
        </Button>
        <p className={styles.hint}>{t('add.outOfStockHint')}</p>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.row}>
        <QuantityStepper
          value={quantity}
          min={1}
          max={MAX_QUANTITY_PER_LINE}
          label={t('stepper.label', { name })}
          decreaseLabel={t('stepper.decrease', { name })}
          increaseLabel={t('stepper.increase', { name })}
          onChange={setQuantity}
        />
        <Button className={styles.addButton} loading={pending} onClick={() => void add()}>
          {t('add.button')}
        </Button>
      </div>
      <p className={styles.hint}>{t('add.limit', { max: MAX_QUANTITY_PER_LINE })}</p>
      {refusal !== null && (
        <p role="alert" className={styles.refusal}>
          <Icon name="alert-circle" size={20} />
          {refusal}
        </p>
      )}
      {added && (
        <div className={styles.added}>
          <span className={styles.addedText}>
            <Icon name="check-circle" size={20} />
            {t('add.addedInline')}
          </span>
          <ButtonLink to={routePaths.cart} variant="secondary">
            {t('add.viewCart')}
          </ButtonLink>
        </div>
      )}
    </div>
  );
}

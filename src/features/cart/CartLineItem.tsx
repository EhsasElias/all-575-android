import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { formatMoney, useLanguage } from '@/shared/i18n';
import { cx, routeTo } from '@/shared/lib';
import { Button, Icon, IconButton } from '@/shared/ui';
import styles from './CartLineItem.module.css';
import type { ScreenLine } from './cartScreenModel';
import { MAX_QUANTITY_PER_LINE } from './cartRules';
import { pickText } from './localizedText';
import { QuantityStepper } from './QuantityStepper';

const IMAGE_SIZE = 72;

type CartLineItemProps = {
  line: ScreenLine;
  onQuantityChange: (line: ScreenLine, quantity: number) => void;
  onRemove: (line: ScreenLine) => void;
};

export function CartLineItem({ line, onQuantityChange, onRemove }: CartLineItemProps) {
  const { t } = useTranslation('cart');
  const { language } = useLanguage();
  const name = pickText(line.name, language);
  const variantName = line.variantName === null ? null : pickText(line.variantName, language);
  const removeLabel = t('lines.removeNamed', { name });

  return (
    <li className={cx(styles.line, line.problem !== null && styles.unavailable)}>
      {line.imageUrl === null ? (
        <span className={styles.placeholder} aria-hidden="true">
          <Icon name="package" size={32} />
        </span>
      ) : (
        <img
          src={line.imageUrl}
          alt=""
          width={IMAGE_SIZE}
          height={IMAGE_SIZE}
          loading="lazy"
          className={styles.image}
        />
      )}

      <div className={styles.details}>
        <Link to={routeTo.product(line.productSlug)} className={styles.name}>
          {name}
        </Link>
        {variantName !== null && <p className={styles.muted}>{variantName}</p>}
        <p className={styles.muted}>
          {t('lines.each', { price: formatMoney(line.unitPrice, language) })}
        </p>

        {line.problem !== null && (
          <p className={styles.problem}>
            <Icon name="alert-circle" size={20} />
            {t(line.problem === 'gone' ? 'lines.gone' : 'lines.outOfStock')}
          </p>
        )}

        <div className={styles.actions}>
          {line.problem === null ? (
            <>
              <QuantityStepper
                value={line.quantity}
                min={1}
                max={MAX_QUANTITY_PER_LINE}
                label={t('stepper.label', { name })}
                decreaseLabel={t('stepper.decrease', { name })}
                increaseLabel={t('stepper.increase', { name })}
                onChange={(quantity) => {
                  onQuantityChange(line, quantity);
                }}
              />
              <IconButton
                label={removeLabel}
                onClick={() => {
                  onRemove(line);
                }}
              >
                <Icon name="trash" size={22} />
              </IconButton>
            </>
          ) : (
            <Button
              variant="secondary"
              aria-label={removeLabel}
              onClick={() => {
                onRemove(line);
              }}
            >
              {t('lines.remove')}
            </Button>
          )}
          <p className={styles.price}>{formatMoney(line.linePrice, language)}</p>
        </div>
      </div>
    </li>
  );
}

import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { formatNumber, formatMoney, useLanguage } from '@/shared/i18n';
import { routePaths } from '@/shared/lib';
import { Icon } from '@/shared/ui';
import { pickName } from './localizedName';
import type { Quote, QuoteLine } from './quote';
import styles from './SummaryLines.module.css';

function LineStatus({ line }: { line: QuoteLine }) {
  const { t } = useTranslation('checkout');
  if (line.available) return null;

  return (
    <span className={styles.flag}>
      <Icon name="alert-circle" size={16} />
      {line.availableUnits === 0
        ? t('summary.unavailable')
        : t('summary.onlyLeft', { units: line.availableUnits })}
    </span>
  );
}

/** The cart as the server priced it. Unavailable lines stay in the list, flagged, with a way back to the cart. */
export function SummaryLines({ quote }: { quote: Quote }) {
  const { t } = useTranslation('checkout');
  const { language } = useLanguage();

  return (
    <>
      <ul className={styles.list}>
        {quote.lines.map((line) => (
          <li key={line.variantId} className={styles.line} data-unavailable={!line.available}>
            {line.imageUrl && <img src={line.imageUrl} alt="" className={styles.image} />}
            <span className={styles.name}>
              <span>
                {pickName(line.name, language)}
                {line.variantName && ` · ${pickName(line.variantName, language)}`}
              </span>
              <span className={styles.meta}>
                {t('summary.quantity', { quantity: formatNumber(line.quantity, language) })}
              </span>
              <LineStatus line={line} />
            </span>
            <span className={styles.amount}>{formatMoney(line.lineTotal, language)}</span>
          </li>
        ))}
      </ul>
      {!quote.canCheckout && (
        <p className={styles.blocked} role="alert">
          <Icon name="alert-circle" size={20} />
          <span>
            {t('summary.cannotCheckout')}{' '}
            <Link to={routePaths.cart}>{t('summary.backToCart')}</Link>
          </span>
        </p>
      )}
    </>
  );
}

import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { errorCode } from '@/shared/api';
import { routeTo } from '@/shared/lib';
import { Button, ErrorState, Skeleton } from '@/shared/ui';
import type { DeliveryZone } from './api';
import { promoProblemFrom } from './promoProblem';
import { PromoCodeForm } from './PromoCodeForm';
import { QuoteNotices } from './QuoteNotices';
import section from './section.module.css';
import { SummaryLines } from './SummaryLines';
import { SummaryTotals } from './SummaryTotals';
import type { QuoteFlow } from './useQuoteFlow';

type OrderSummaryProps = {
  flow: QuoteFlow;
  addressId: number | null;
  zone: DeliveryZone | null;
  /** How far the total moved when the server changed the prices at checkout. */
  change: { from: number; to: number } | null;
};

function QuoteFailure({ flow, addressId }: { flow: QuoteFlow; addressId: number | null }) {
  const { t } = useTranslation('checkout');
  const promoProblem = promoProblemFrom(flow.error);

  if (errorCode(flow.error) === 'address_not_serviceable' && addressId !== null) {
    return (
      <p role="alert">
        {t('summary.notServiceable')}{' '}
        <Link to={routeTo.addressEdit(addressId)}>{t('address.editPin')}</Link>
      </p>
    );
  }
  if (promoProblem !== null && promoProblem.code !== 'failed') {
    return (
      <div role="alert" className={section.section}>
        <p>{t('summary.promoNoLongerWorks')}</p>
        <Button variant="secondary" onClick={flow.promo.remove}>
          {t('summary.continueWithoutCode')}
        </Button>
      </div>
    );
  }
  return <ErrorState headingLevel={3} onRetry={flow.refresh} />;
}

export function OrderSummary({ flow, addressId, zone, change }: OrderSummaryProps) {
  const { t } = useTranslation('checkout');
  const headingId = useId();
  const { quote } = flow;

  return (
    <section className={section.section} aria-labelledby={headingId}>
      <h2 id={headingId} className={section.heading}>
        {t('summary.heading')}
      </h2>

      {addressId === null && <p className={section.hint}>{t('summary.needAddress')}</p>}
      {flow.isLoading && (
        <div role="status" aria-busy="true" aria-label={t('summary.loading')}>
          <Skeleton height="10rem" />
        </div>
      )}
      {flow.error !== null && quote === null && <QuoteFailure flow={flow} addressId={addressId} />}

      {quote && (
        <>
          <QuoteNotices
            expiresAtMs={quote.expiresAtMs}
            expired={flow.expired}
            refreshing={flow.isRefreshing}
            onRefresh={flow.refresh}
            change={change}
          />
          <SummaryLines quote={quote} />
          <PromoCodeForm key={flow.promo.applied ?? 'none'} promo={flow.promo} />
          <SummaryTotals quote={quote} zone={zone} />
        </>
      )}
    </section>
  );
}

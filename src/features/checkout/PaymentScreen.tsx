import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { routePaths } from '@/shared/lib';
import { ButtonLink, EmptyState, ErrorState, Skeleton } from '@/shared/ui';
import { PaymentClosed } from './PaymentClosed';
import { PaymentPending } from './PaymentPending';
import { PaymentRetry } from './PaymentRetry';
import { usePaymentFlow } from './usePaymentFlow';

// Only in development, or in a build made on purpose for testers with VITE_TEST_PANEL=true (the server's simulate
// route exists only on a local or testing server, so the buttons do nothing anywhere else). In an ordinary
// production build this whole branch, and the panel's code, is removed.
const showTestPanel = import.meta.env.DEV || import.meta.env.VITE_TEST_PANEL === 'true';
const DevPaymentPanel = showTestPanel
  ? lazy(() => import('./DevPaymentPanel').then((module) => ({ default: module.DevPaymentPanel })))
  : null;

function Waiting() {
  const { t } = useTranslation();
  return (
    <div role="status" aria-busy="true" aria-label={t('states.loading')}>
      <Skeleton height="2rem" />
      <Skeleton height="8rem" />
    </div>
  );
}

function OrderNotFound() {
  const { t } = useTranslation('checkout');
  return (
    <EmptyState
      headingLevel={1}
      icon="package"
      title={t('payment.notFoundTitle')}
      message={t('payment.notFoundMessage')}
      action={<ButtonLink to={routePaths.orders}>{t('payment.myOrders')}</ButtonLink>}
    />
  );
}

/** `/checkout/payment/:orderId`: the unpaid order, its countdown, and the polling that waits for the bank. */
export function PaymentScreen() {
  const { orderId = '' } = useParams();
  const flow = usePaymentFlow(orderId);
  const { payment, holdEndsAtMs } = flow;

  if (flow.notFound) return <OrderNotFound />;
  if (flow.order.isError) {
    return <ErrorState headingLevel={1} onRetry={() => void flow.order.refetch()} />;
  }
  if (flow.view === null || payment === null) {
    return flow.view === 'closed' ? <PaymentClosed /> : <Waiting />;
  }
  if (flow.view === 'paid') return <Waiting />;
  if (flow.view === 'closed') return <PaymentClosed />;
  if (flow.view === 'retry' && holdEndsAtMs !== null) {
    return (
      <PaymentRetry
        payment={payment}
        holdEndsAtMs={holdEndsAtMs}
        retrying={flow.retry.isPending}
        retryError={flow.retry.error}
        onRetry={(method) => {
          flow.retry.mutate(method);
        }}
      />
    );
  }

  return (
    <PaymentPending
      orderNumber={flow.orderNumber}
      payment={payment}
      holdEndsAtMs={holdEndsAtMs}
      redirectUrl={flow.redirectUrl}
      chooserOpen={flow.chooserOpen}
      onToggleChooser={flow.toggleChooser}
      retrying={flow.retry.isPending}
      retryError={flow.retry.error}
      onRetry={(method) => {
        flow.retry.mutate(method);
      }}
      devPanel={
        DevPaymentPanel && (
          <Suspense fallback={null}>
            <DevPaymentPanel paymentId={payment.id} />
          </Suspense>
        )
      }
    />
  );
}

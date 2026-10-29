import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { errorCode } from '@/shared/api';
import { routePaths } from '@/shared/lib';
import { ButtonLink, EmptyState, TextField } from '@/shared/ui';
import { AddressPicker } from './AddressPicker';
import { OrderSummary } from './OrderSummary';
import { PayBar } from './PayBar';
import { blockedReason } from './payReadiness';
import type { PayMethod } from './payment';
import { PaymentMethodPicker } from './PaymentMethodPicker';
import { ProblemNotice } from './ProblemNotice';
import { SlotPicker } from './SlotPicker';
import { useCheckoutAddresses } from './useCheckoutAddresses';
import { useDeliverySlots } from './useDeliverySlots';
import { useDeliveryZone } from './useDeliveryZone';
import { usePlaceOrder } from './usePlaceOrder';
import { useQuoteFlow } from './useQuoteFlow';
import styles from './CheckoutScreen.module.css';

function EmptyCart() {
  const { t } = useTranslation('checkout');
  return (
    <EmptyState
      headingLevel={1}
      icon="cart"
      title={t('emptyTitle')}
      message={t('emptyMessage')}
      action={<ButtonLink to={routePaths.cart}>{t('action')}</ButtonLink>}
    />
  );
}

/** One screen, four clear steps: where to, when, what it costs, how to pay. */
export function CheckoutScreen() {
  const { t } = useTranslation('checkout');
  const { t: tc } = useTranslation('customer');
  const [poReference, setPoReference] = useState('');
  const addresses = useCheckoutAddresses();
  const address = addresses.selected;
  const addressId = address?.id ?? null;
  const slots = useDeliverySlots(addressId);
  const quoteFlow = useQuoteFlow(addressId);
  const zone = useDeliveryZone(address);
  const [method, setMethod] = useState<PayMethod>('mada');

  const order = usePlaceOrder({
    refreshQuote: quoteFlow.refresh,
    refreshSlots: () => {
      // The time that was refused must be chosen again, whatever the list says now.
      slots.clearChoice();
      slots.refresh();
    },
    refreshAddresses: () => void addresses.query.refetch(),
    replaceQuote: quoteFlow.replace,
  });

  if (errorCode(quoteFlow.error) === 'cart_empty') return <EmptyCart />;

  const { quote } = quoteFlow;
  const slot = slots.chosenSlot;
  const blocked = blockedReason({
    addressChosen: address !== null,
    slotChosen: slot !== null,
    quote,
    quoteExpired: quoteFlow.expired,
    placing: order.isPlacing,
  });
  const change =
    order.problem?.kind === 'quote_changed' && order.shownTotal !== null
      ? { from: order.shownTotal, to: order.problem.quote.total }
      : null;

  // Changing anything the customer agreed to clears the last refusal: it no longer describes what is on screen.
  const changing = <T,>(update: (value: T) => void) => {
    return (value: T) => {
      order.dismiss();
      update(value);
    };
  };

  const pay = () => {
    if (blocked !== null || quote === null || slot === null) return;
    order.place({
      quoteId: quote.id,
      slotId: slot.id,
      method,
      shownTotal: quote.total,
      purchaseOrderReference: poReference.trim(),
    });
  };

  return (
    <div className={styles.screen}>
      <h1 className={styles.title}>{t('title')}</h1>

      <AddressPicker
        addresses={addresses.addresses}
        isLoading={addresses.query.isPending}
        isError={addresses.query.isError}
        onRetry={() => void addresses.query.refetch()}
        selectedId={addressId}
        onSelect={changing(addresses.choose)}
      />
      <SlotPicker
        hasAddress={address !== null}
        slots={slots.slots}
        isLoading={slots.query.isPending && address !== null}
        isError={slots.query.isError}
        onRetry={slots.refresh}
        selectedId={slot?.id ?? null}
        onSelect={changing(slots.choose)}
      />
      <OrderSummary flow={quoteFlow} addressId={addressId} zone={zone} change={change} />
      <details>
        <summary>{tc('billing')}</summary>
        <ButtonLink to={routePaths.billing} variant="ghost">
          {tc('editBilling')}
        </ButtonLink>
        <TextField
          label={tc('po')}
          value={poReference}
          maxLength={80}
          onChange={(e) => {
            setPoReference(e.target.value);
            order.dismiss();
          }}
        />
      </details>
      <PaymentMethodPicker value={method} onChange={changing(setMethod)} />

      <PayBar
        cashOnDelivery={method === 'cash_on_delivery'}
        total={quote?.total ?? null}
        blocked={blocked}
        placing={order.isPlacing}
        onPay={pay}
        notice={order.problem && <ProblemNotice problem={order.problem} addressId={addressId} />}
      />
    </div>
  );
}

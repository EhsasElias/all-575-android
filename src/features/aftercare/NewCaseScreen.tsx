import { useState, useRef, useId, type SyntheticEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import { errorCode } from '@/shared/api';
import { routeTo } from '@/shared/lib';
import { Button, ButtonLink, ErrorState, TextField } from '@/shared/ui';
import { createCase, fetchCareItems, type CaseInput } from './api';
import { MessageField } from './MessageField';
import { ReturnFields } from './ReturnFields';
import { CareLoading } from './CareLoading';
import styles from './Care.module.css';

export function NewCaseScreen() {
  const { orderId = '' } = useParams();
  const { t } = useTranslation('aftercare');
  const navigate = useNavigate();
  const client = useQueryClient();
  const kindId = useId();
  const [kind, setKind] = useState<'support' | 'return'>('support');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState(1);
  // Reuse the same key for retries of exactly the same payload, including lost responses.
  const attempt = useRef<{ payload: string; key: string } | null>(null);
  const items = useQuery({
    queryKey: ['aftercare', 'items', orderId],
    queryFn: ({ signal }) => fetchCareItems(orderId, signal),
  });
  const mutation = useMutation({
    mutationFn: (input: CaseInput) => createCase(orderId, input),
    onSuccess: (saved) => {
      void client.invalidateQueries({ queryKey: ['aftercare'] });
      void navigate(routeTo.customerCase(saved.id));
    },
  });
  const selected = items.data?.find((item) => String(item.id) === itemId);
  const validReturn =
    kind !== 'return' ||
    (selected !== undefined &&
      Number.isInteger(quantity) &&
      quantity > 0 &&
      quantity <= selected.returnable_quantity);
  const submit = (event: SyntheticEvent) => {
    event.preventDefault();
    if (mutation.isPending || !validReturn || !subject.trim() || !message.trim()) return;
    const body = {
      kind,
      subject: subject.trim(),
      message: message.trim(),
      ...(kind === 'return' ? { order_item_id: Number(itemId), quantity } : {}),
    };
    const payload = JSON.stringify(body);
    if (attempt.current?.payload !== payload)
      attempt.current = { payload, key: crypto.randomUUID() };
    mutation.mutate({ ...body, request_key: attempt.current.key });
  };
  const code = errorCode(mutation.error);
  const failure =
    code === 'return_quantity_exceeded'
      ? t('quantityExceeded')
      : code === 'return_not_delivered'
        ? t('notDelivered')
        : t('failed');
  return (
    <div className={styles.page}>
      <ButtonLink to={routeTo.order(orderId)} variant="ghost">
        {t('order')}
      </ButtonLink>
      <h1>{t('newTitle')}</h1>
      {items.isPending && <CareLoading />}
      {items.isError && <ErrorState title={t('error')} onRetry={() => void items.refetch()} />}
      {items.data !== undefined && (
        <form onSubmit={submit} className={styles.card}>
          <div className={styles.field}>
            <label htmlFor={kindId}>{t('kind')}</label>
            <select
              id={kindId}
              className={styles.input}
              value={kind}
              onChange={(e) => {
                setKind(e.target.value === 'return' ? 'return' : 'support');
                mutation.reset();
              }}
              disabled={mutation.isPending}
            >
              <option value="support">{t('support')}</option>
              <option value="return">{t('return')}</option>
            </select>
          </div>
          {kind === 'return' && (
            <ReturnFields
              items={items.data}
              itemId={itemId}
              quantity={quantity}
              onItem={(id) => {
                setItemId(id);
                setQuantity(1);
              }}
              onQuantity={setQuantity}
            />
          )}
          <TextField
            label={t('subject')}
            required
            maxLength={120}
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
            }}
            disabled={mutation.isPending}
          />
          <MessageField
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
            }}
            disabled={mutation.isPending}
          />
          {kind === 'return' && <p className={styles.notice}>{t('pending')}</p>}
          {mutation.isError && (
            <p role="alert" className={styles.error}>
              {failure}
            </p>
          )}
          <Button
            type="submit"
            loading={mutation.isPending}
            disabled={!validReturn || !subject.trim() || !message.trim()}
          >
            {t('send')}
          </Button>
        </form>
      )}
    </div>
  );
}

import { useState, type SyntheticEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { routePaths, routeTo } from '@/shared/lib';
import { Button, ButtonLink, ErrorState } from '@/shared/ui';
import { fetchCase, sendMessage, type CustomerCase } from './api';
import { ReturnSummary } from './ReturnSummary';
import { MessageField } from './MessageField';
import { caseStatusKey } from './statusKey';
import { CareLoading } from './CareLoading';
import styles from './Care.module.css';

function Conversation({ item }: { item: CustomerCase }) {
  const { t } = useTranslation('aftercare');
  const client = useQueryClient();
  const [message, setMessage] = useState('');
  const closed = item.status === 'resolved' || item.status === 'rejected';
  const mutation = useMutation({
    mutationFn: () => sendMessage(item.id, message.trim()),
    onSuccess: (saved) => {
      client.setQueryData(['aftercare', 'case', item.id], saved);
      void client.invalidateQueries({ queryKey: ['aftercare', 'list'] });
      setMessage('');
    },
    onError: () => {
      void client.invalidateQueries({ queryKey: ['aftercare', 'case', item.id] });
    },
  });
  const submit = (event: SyntheticEvent) => {
    event.preventDefault();
    if (!mutation.isPending && message.trim() && !closed) mutation.mutate();
  };
  return (
    <section aria-label={t('conversation')} className={styles.card}>
      <h2>{t('conversation')}</h2>
      <ol className={styles.list}>
        {item.messages.map((entry) => (
          <li className={styles.card} key={entry.id}>
            <strong>{t(entry.author === 'customer' ? 'customer' : 'agent')}</strong>
            <p className={styles.body}>{entry.body}</p>
            <time dateTime={entry.created_at ?? undefined}>{entry.created_at?.slice(0, 10)}</time>
          </li>
        ))}
      </ol>
      {closed ? (
        <p role="status">{t('closed')}</p>
      ) : (
        <form onSubmit={submit} className={styles.field}>
          <h3>{t('reply')}</h3>
          <MessageField
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
            }}
            disabled={mutation.isPending}
          />
          {mutation.isError && <p role="alert">{t('messageFailed')}</p>}
          <Button type="submit" loading={mutation.isPending} disabled={!message.trim()}>
            {t('replySend')}
          </Button>
        </form>
      )}
    </section>
  );
}
export function CaseDetailScreen() {
  const { caseId = '' } = useParams();
  const { t } = useTranslation('aftercare');
  const query = useQuery({
    queryKey: ['aftercare', 'case', caseId],
    queryFn: ({ signal }) => fetchCase(caseId, signal),
    refetchInterval: 15000,
  });
  return (
    <div className={styles.page}>
      <ButtonLink to={routePaths.customerCases} variant="ghost">
        {t('back')}
      </ButtonLink>
      <h1>{t('detail')}</h1>
      {query.isPending && <CareLoading />}
      {query.isError && <ErrorState title={t('error')} onRetry={() => void query.refetch()} />}
      {query.data !== undefined && (
        <>
          <h2>{query.data.subject}</h2>
          <p>{t(caseStatusKey(query.data.status))}</p>
          <p>{t('reference', { id: query.data.id })}</p>
          <ButtonLink to={routeTo.order(query.data.order_id)}>{t('order')}</ButtonLink>
          {query.data.kind === 'return' && (
            <>
              <ReturnSummary item={query.data} />
              <p className={styles.notice}>{t('pending')}</p>
            </>
          )}
          <Conversation key={query.data.id} item={query.data} />
        </>
      )}
    </div>
  );
}

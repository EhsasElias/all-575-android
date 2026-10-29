import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { http, type Data, type Schemas } from '@/shared/api';
import { Button, ErrorState, Skeleton, TextField } from '@/shared/ui';
import { usePagedQuery } from '@/features/catalog';
import { Page } from './components/Page';
import { PageHeader } from './components/PageHeader';
import styles from './CustomerForms.module.css';

type Kind = 'bulk_quote' | 'data_access' | 'account_closure';
const kinds: Kind[] = ['bulk_quote', 'data_access', 'account_closure'];
const requestKey = ['customer', 'requests'];
function requestStatus(status: string) {
  return status === 'under_review' || status === 'resolved' || status === 'rejected'
    ? status
    : 'submitted';
}
export function CustomerRequestsScreen() {
  const { t } = useTranslation('customer');
  const queryClient = useQueryClient();
  const [kind, setKind] = useState<Kind>('bulk_quote');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [key, setKey] = useState(() => crypto.randomUUID());
  const list = usePagedQuery<Schemas['CustomerRequestResource']>({
    queryKey: requestKey,
    path: '/me/requests',
    query: {},
    enabled: true,
  });
  const send = useMutation({
    mutationFn: () =>
      http.post<Data<Schemas['CustomerRequestResource']>>('/me/requests', {
        kind,
        subject: subject.trim(),
        description: description.trim(),
        request_key: key,
      }),
    onSuccess: () => {
      setSubject('');
      setDescription('');
      setKey(crypto.randomUUID());
      void queryClient.invalidateQueries({ queryKey: requestKey });
    },
  });
  const changed = () => {
    setKey(crypto.randomUUID());
    send.reset();
  };
  return (
    <Page>
      <PageHeader title={t('requests')} />
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          if (!send.isPending) send.mutate();
        }}
      >
        <label>
          {t('kind')}
          <select
            value={kind}
            disabled={send.isPending}
            onChange={(e) => {
              const chosen = kinds.find((v) => v === e.target.value);
              if (chosen) setKind(chosen);
              changed();
            }}
          >
            {kinds.map((k) => (
              <option key={k} value={k}>
                {t(k)}
              </option>
            ))}
          </select>
        </label>
        <p className={styles.hint}>{t(kind === 'bulk_quote' ? 'requestHint' : 'privacyHint')}</p>
        <TextField
          label={t('subject')}
          value={subject}
          required
          minLength={3}
          maxLength={200}
          disabled={send.isPending}
          onChange={(e) => {
            setSubject(e.target.value);
            changed();
          }}
        />
        <label>
          {t('description')}
          <textarea
            value={description}
            required
            minLength={10}
            maxLength={5000}
            disabled={send.isPending}
            onChange={(e) => {
              setDescription(e.target.value);
              changed();
            }}
          />
        </label>
        {send.isError && <p role="alert">{t('failed')}</p>}
        {send.isSuccess && <p role="status">{t('sent')}</p>}
        <Button type="submit" loading={send.isPending}>
          {t('send')}
        </Button>
      </form>
      {list.status === 'loading' ? (
        <Skeleton height="8rem" />
      ) : list.status === 'error' ? (
        <ErrorState
          onRetry={() => {
            list.retry();
          }}
        />
      ) : (
        <>
          {list.items.length === 0 && <p>{t('empty')}</p>}
          <ul className={styles.list}>
            {list.items.map((r) => (
              <li key={r.id} className={styles.card}>
                <h2>{r.subject}</h2>
                <p>
                  <bdi>{r.id}</bdi>
                </p>
                <p>
                  {r.kind === 'bulk_quote' ||
                  r.kind === 'data_access' ||
                  r.kind === 'account_closure'
                    ? t(r.kind)
                    : ''}{' '}
                  · {t(requestStatus(r.status))}
                </p>
                <p>{r.description}</p>
                {r.reply && (
                  <>
                    <h3>{t('reply')}</h3>
                    <p>{r.reply}</p>
                  </>
                )}
              </li>
            ))}
          </ul>
          {list.loadMoreFailed && <p role="alert">{t('failed')}</p>}
          {list.hasNextPage && (
            <Button
              loading={list.isFetchingNextPage}
              onClick={() => {
                list.loadMore();
              }}
            >
              {t('more')}
            </Button>
          )}
        </>
      )}
    </Page>
  );
}

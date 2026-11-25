import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { paths } from '@/shared/api/schema';
import { http } from '@/shared/api';
import { useSession } from '@/shared/session';
import { Button, ButtonLink, Icon } from '@/shared/ui';
import styles from './SaveProduct.module.css';
import { routePaths, routeTo } from '@/shared/lib';

export function SaveProduct({ slug, compact = false }: { slug: string; compact?: boolean }) {
  const { t } = useTranslation('catalog');
  const { status } = useSession();
  const queryClient = useQueryClient();
  const key = ['customer', 'saved-state', slug];
  const saved = useQuery({
    queryKey: key,
    enabled: status === 'signed-in',
    queryFn: async ({ signal }) =>
      (
        await http.get<
          paths['/v1/me/saved-products/{slug}']['get']['responses']['200']['content']['application/json']
        >(`/me/saved-products/${encodeURIComponent(slug)}`, { signal })
      ).data.saved,
  });
  const toggle = useMutation({
    mutationFn: () =>
      saved.data
        ? http.delete(`/me/saved-products/${encodeURIComponent(slug)}`)
        : http.put(`/me/saved-products/${encodeURIComponent(slug)}`, {}),
    onSuccess: () => {
      queryClient.setQueryData(key, !saved.data);
      void queryClient.invalidateQueries({ queryKey: ['customer', 'saved-products'] });
    },
  });
  if (status !== 'signed-in')
    return (
      <ButtonLink
        to={`${routePaths.signIn}?next=${encodeURIComponent(routeTo.product(slug))}`}
        variant="secondary"
        className={compact ? styles.compact : undefined}
        aria-label={t('saved.save')}
        title={compact ? t('saved.save') : undefined}
      >
        {compact ? <Icon name="heart" size={19} /> : t('saved.save')}
      </ButtonLink>
    );
  return (
    <div>
      <Button
        variant="secondary"
        className={compact ? styles.compact : undefined}
        aria-label={t(saved.data ? 'saved.remove' : 'saved.save')}
        title={compact ? t(saved.data ? 'saved.remove' : 'saved.save') : undefined}
        aria-pressed={saved.data === true}
        loading={toggle.isPending}
        disabled={saved.isPending || saved.isError}
        onClick={() => {
          toggle.mutate();
        }}
      >
        {compact ? <Icon name="heart" size={19} /> : t(saved.data ? 'saved.remove' : 'saved.save')}
      </Button>
      {(saved.isError || toggle.isError) && (
        <p role="alert">
          {t('saved.failed')}{' '}
          <Button variant="ghost" onClick={() => void saved.refetch()}>
            {t('saved.retry')}
          </Button>
        </p>
      )}
    </div>
  );
}

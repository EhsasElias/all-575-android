import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { paths } from '@/shared/api/schema';
import { http } from '@/shared/api';
import { useSession } from '@/shared/session';
import { Button, ButtonLink } from '@/shared/ui';
import { routePaths, routeTo } from '@/shared/lib';

export function SaveProduct({ slug }: { slug: string }) {
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
      >
        {t('saved.save')}
      </ButtonLink>
    );
  return (
    <div>
      <Button
        variant="secondary"
        aria-pressed={saved.data === true}
        loading={toggle.isPending}
        disabled={saved.isPending || saved.isError}
        onClick={() => {
          toggle.mutate();
        }}
      >
        {t(saved.data ? 'saved.remove' : 'saved.save')}
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

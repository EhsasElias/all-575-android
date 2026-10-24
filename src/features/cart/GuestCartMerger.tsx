import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useEffectEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useSession } from '@/shared/session';
import { useToast } from '@/shared/ui';
import { mergeGuestCartOnce } from './guestCartMerge';

/**
 * Mounted once inside the shell. When a customer is signed in and still has lines from before they signed in,
 * it adds them to the server cart (POST /cart/merge). If that fails the lines stay on the device and the
 * next mount tries again. Renders nothing.
 */
export function GuestCartMerger() {
  const { status } = useSession();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation('cart');

  const merge = useEffectEvent(() => {
    void mergeGuestCartOnce({
      queryClient,
      onMerged: () => {
        showToast({ message: t('merge.done'), variant: 'success' });
      },
      onFailed: () => {
        showToast({ message: t('merge.failed'), variant: 'error' });
      },
    });
  });

  useEffect(() => {
    if (status === 'signed-in') merge();
  }, [status]);

  return null;
}

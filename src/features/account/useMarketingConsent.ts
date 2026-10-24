import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { http, type Data } from '@/shared/api';
import { useSession, type SessionUser } from '@/shared/session';
import { useToast } from '@/shared/ui';

/** Grants or withdraws marketing consent (`PUT /me/consents/marketing`) and refreshes the signed-in customer. */
export function useMarketingConsent() {
  const { t } = useTranslation('account');
  const { setUser } = useSession();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (granted: boolean) =>
      (await http.put<Data<SessionUser>>('/me/consents/marketing', { granted })).data,
    onSuccess: (updated) => {
      setUser(updated);
      showToast({ message: t('preferences.marketingSaved'), variant: 'success' });
    },
    onError: () => {
      showToast({ message: t('preferences.marketingFailed'), variant: 'error' });
    },
  });
}

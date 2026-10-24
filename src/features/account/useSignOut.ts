import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { routePaths } from '@/shared/lib';
import { useSession } from '@/shared/session';
import { useToast } from '@/shared/ui';

type SignOut = {
  pending: boolean;
  failed: boolean;
  run: () => void;
};

/** Signs out this device, then goes home with a short confirmation. */
export function useSignOut(): SignOut {
  const { t } = useTranslation('account');
  const { signOut } = useSession();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  const run = () => {
    if (pending) return;
    setPending(true);
    setFailed(false);
    signOut().then(
      () => {
        showToast({ message: t('signOut.done'), variant: 'success' });
        void navigate(routePaths.home, { replace: true });
      },
      () => {
        setPending(false);
        setFailed(true);
      },
    );
  };

  return { pending, failed, run };
}

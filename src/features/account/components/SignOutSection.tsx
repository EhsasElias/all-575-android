import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Icon } from '@/shared/ui';
import { useSignOut } from '../useSignOut';
import { ConfirmSheet } from './ConfirmSheet';

/** Signing out asks first, because the next sign-in needs a new code. */
export function SignOutSection() {
  const { t } = useTranslation('account');
  const [confirming, setConfirming] = useState(false);
  const signOut = useSignOut();

  return (
    <>
      <Button
        variant="secondary"
        fullWidth
        onClick={() => {
          setConfirming(true);
        }}
      >
        <Icon name="log-out" size={20} />
        {t('signOut.button')}
      </Button>
      <ConfirmSheet
        open={confirming}
        title={t('signOut.title')}
        message={t('signOut.message')}
        confirmLabel={t('signOut.confirm')}
        cancelLabel={t('signOut.cancel')}
        pending={signOut.pending}
        errorMessage={signOut.failed ? t('signOut.failed') : undefined}
        onConfirm={signOut.run}
        onCancel={() => {
          setConfirming(false);
        }}
      />
    </>
  );
}

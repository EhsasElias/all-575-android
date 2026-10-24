import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { http, isApiError, type Data, type Schemas } from '@/shared/api';
import { useToast } from '@/shared/ui';

export type DeviceSession = Schemas['SessionResource'];

const SESSIONS_KEY = ['account', 'sessions'] as const;

/** The devices signed in to this account (`GET /me/sessions`). It is read fresh every time the screen opens. */
export function useSessionsQuery() {
  return useQuery({
    queryKey: SESSIONS_KEY,
    queryFn: async ({ signal }) =>
      (await http.get<Data<DeviceSession[]>>('/me/sessions', { signal })).data,
    staleTime: 0,
  });
}

/** Signing another device out: ask first, then `DELETE /me/sessions/{id}`. */
export function useRevokeSession() {
  const { t } = useTranslation('account');
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [target, setTarget] = useState<DeviceSession | null>(null);

  const close = () => {
    setTarget(null);
  };

  const mutation = useMutation({
    mutationFn: (session: DeviceSession) => http.delete<undefined>(`/me/sessions/${session.id}`),
    onSuccess: async () => {
      close();
      showToast({ message: t('sessions.revoked'), variant: 'success' });
      await queryClient.invalidateQueries({ queryKey: SESSIONS_KEY });
    },
    onError: async (error) => {
      // Already gone (signed out from elsewhere in the meantime): the list just needs to catch up.
      if (isApiError(error) && error.kind === 'not-found') {
        close();
        showToast({ message: t('sessions.alreadyRevoked') });
        await queryClient.invalidateQueries({ queryKey: SESSIONS_KEY });
      }
    },
  });

  const stillFailed = mutation.isError && target !== null && !isNotFound(mutation.error);

  return {
    target,
    pending: mutation.isPending,
    failed: stillFailed,
    ask: (session: DeviceSession) => {
      mutation.reset();
      setTarget(session);
    },
    cancel: () => {
      mutation.reset();
      close();
    },
    confirm: () => {
      if (target !== null && !mutation.isPending) mutation.mutate(target);
    },
  };
}

function isNotFound(error: unknown): boolean {
  return isApiError(error) && error.kind === 'not-found';
}

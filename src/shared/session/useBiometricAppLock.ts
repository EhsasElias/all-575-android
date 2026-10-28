import { useEffect } from 'react';
import { isNativeBiometry, sessionVault } from '../security';

/** Clear private UI and cached data when an opted-in native app goes into the background. */
export function useBiometricAppLock(onLock: () => void) {
  useEffect(() => {
    if (!isNativeBiometry()) return;
    let stopped = false;
    let remove: (() => Promise<void>) | undefined;
    void import('@capacitor/app')
      .then(async ({ App }) => {
        const listener = await App.addListener('appStateChange', ({ isActive }) => {
          if (isActive || stopped) return;
          sessionVault.lock();
          void sessionVault
            .enabled()
            .then((enabled) => {
              if (!enabled || stopped) return;
              onLock();
            })
            .catch(() => {
              sessionVault.lock();
              onLock();
            });
        });
        if (stopped) await listener.remove();
        else remove = () => listener.remove();
      })
      .catch(() => {
        sessionVault.lock();
        onLock();
      });
    return () => {
      stopped = true;
      void remove?.();
    };
  }, [onLock]);
}

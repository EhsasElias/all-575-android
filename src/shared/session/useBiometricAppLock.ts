import { useEffect } from 'react';
import { isNativeBiometry, sessionVault } from '../security';
import { observeAppVisibility } from '../native-lifecycle';

/** Clear private UI and cached data when an opted-in native app goes into the background. */
export function useBiometricAppLock(onLock: () => void) {
  useEffect(() => {
    if (!isNativeBiometry()) return;
    let stopped = false;
    let remove: (() => Promise<void>) | undefined;
    void observeAppVisibility(({ isActive }) => {
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
    })
      .then(async (listener) => {
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

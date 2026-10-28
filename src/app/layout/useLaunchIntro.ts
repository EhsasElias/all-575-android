import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { welcomePath } from '@/features/welcome';
import { observeAppVisibility } from '@/shared/native-lifecycle';

/** Reentering the actual native app restarts the intro; ordinary page navigation does not. */
export function useLaunchIntro() {
  const navigate = useNavigate();
  useEffect(() => {
    let stopped = false;
    let wasAway = false;
    let remove: (() => Promise<void>) | undefined;
    void observeAppVisibility(({ isActive }) => {
      if (stopped) return;
      if (!isActive) {
        wasAway = true;
        return;
      }
      if (!wasAway) return;
      wasAway = false;
      const { pathname, search, hash } = window.location;
      const target = pathname.startsWith('/welcome')
        ? new URLSearchParams(search).get('next')
        : `${pathname}${search}${hash}`;
      void navigate(welcomePath(target), { replace: true });
    })
      .then(async (handle) => {
        if (stopped) await handle.remove();
        else remove = () => handle.remove();
      })
      .catch(() => {
        /* Browser/startup intro still works if the native bridge is unavailable. */
      });
    return () => {
      stopped = true;
      void remove?.();
    };
  }, [navigate]);
}

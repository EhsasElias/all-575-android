import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';

type AppVisibility = {
  addListener: (
    event: 'change',
    listener: (state: { isActive: boolean }) => void,
  ) => Promise<PluginListenerHandle>;
};

const AppEntry = registerPlugin<AppVisibility>('AppEntry');

/** Android tracks all app-owned activities, including the biometric prompt activity. */
export function observeAppVisibility(listener: (state: { isActive: boolean }) => void) {
  if (!Capacitor.isNativePlatform()) {
    const onVisibility = () => {
      listener({ isActive: document.visibilityState === 'visible' });
    };
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      listener({ isActive: false });
      listener({ isActive: true });
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pageshow', onPageShow);
    return Promise.resolve({
      remove: () => {
        document.removeEventListener('visibilitychange', onVisibility);
        window.removeEventListener('pageshow', onPageShow);
        return Promise.resolve();
      },
    });
  }
  return Capacitor.getPlatform() === 'android'
    ? AppEntry.addListener('change', listener)
    : import('@capacitor/app').then(({ App }) => App.addListener('appStateChange', listener));
}

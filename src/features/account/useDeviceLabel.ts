import { useTranslation } from 'react-i18next';

/** The two names our own apps send are shown in the customer's language; any other name is shown as it is. */
export function useDeviceLabel(): (deviceName: string) => string {
  const { t } = useTranslation('account');

  return (deviceName) => {
    if (deviceName === 'Android app') return t('sessions.androidApp');
    if (deviceName === 'Web browser') return t('sessions.webBrowser');
    return deviceName;
  };
}

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.all575.app',
  appName: 'ALL 5.75',
  webDir: 'dist',
  server: {
    cleartext: false,
  },
  android: {
    // Only the manual test build (see android-apk.yml) may talk plain http to a server on the local network.
    allowMixedContent: process.env.ALL575_TEST_BUILD === 'true',
  },
};

// Capacitor's CLI loads the config through its default export.
export default config;

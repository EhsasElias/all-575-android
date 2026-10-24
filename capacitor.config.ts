import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.all575.app',
  appName: 'ALL 5.75',
  webDir: 'dist',
  server: {
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
};

// Capacitor's CLI loads the config through its default export.
export default config;

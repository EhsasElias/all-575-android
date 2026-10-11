import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.all575.app',
  appName: 'Everything 5.75',
  webDir: 'dist',

  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
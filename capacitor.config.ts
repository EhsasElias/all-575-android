import type { CapacitorConfig } from '@capacitor/cli';

// Only the manual test build (see android-apk.yml) may talk plain http to a server on the local network.
const testBuild = process.env.ALL575_TEST_BUILD === 'true';

const config: CapacitorConfig = {
  appId: 'com.all575.app',
  appName: 'ALL 5.75',
  webDir: 'dist',
  server: {
    cleartext: false,
    // The app is served from https://localhost, and the WebView refuses to show a picture that comes from an http
    // server on the network (Android upgrades it to https), even when fetch to the same server works. The test
    // build is therefore served from http://localhost, so nothing is mixed. The backend accepts that origin in a
    // local environment only.
    androidScheme: testBuild ? 'http' : 'https',
  },
  android: {
    allowMixedContent: testBuild,
  },
};

// Capacitor's CLI loads the config through its default export.
export default config;

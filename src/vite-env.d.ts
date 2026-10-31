// Declaration merging with Vite's own ImportMetaEnv only works with an interface.
/* eslint-disable @typescript-eslint/consistent-type-definitions */
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  /** `true` only in a tester's build: shows the buttons that play the payment provider on a test server. */
  readonly VITE_TEST_PANEL?: string;
  /** Public Firebase web-app configuration (never put Admin credentials in VITE_*). */
  /** Keep disabled until Firebase exchange is deployed and verified on the API. */
  readonly VITE_FIREBASE_AUTH_ENABLED?: string;
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
}

interface Window {
  /** Deploy-time settings from `public/config.js`, editable without a rebuild. */
  ALL575_CONFIG?: { apiBaseUrl?: string };
}

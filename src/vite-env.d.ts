// Declaration merging with Vite's own ImportMetaEnv only works with an interface.
/* eslint-disable @typescript-eslint/consistent-type-definitions */
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  /** `true` only in a tester's build: shows the buttons that play the payment provider on a test server. */
  readonly VITE_TEST_PANEL?: string;
}

interface Window {
  /** Deploy-time settings from `public/config.js`, editable without a rebuild. */
  ALL575_CONFIG?: { apiBaseUrl?: string };
}

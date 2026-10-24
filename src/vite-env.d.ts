// Declaration merging with Vite's own ImportMetaEnv only works with an interface.
/* eslint-disable @typescript-eslint/consistent-type-definitions */
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}

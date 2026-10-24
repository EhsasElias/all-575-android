import type { appResources } from './i18n-resources';

// Module augmentation only works with an interface. It makes every `t('key')` call type-checked.
/* eslint-disable @typescript-eslint/consistent-type-definitions */
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: (typeof appResources)['en'];
  }
}

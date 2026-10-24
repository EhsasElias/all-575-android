import type { Translations } from '@/shared/i18n';

const en = {
  placeholderTitle: 'Addresses are coming soon',
};

const ar: Translations<typeof en> = {
  placeholderTitle: 'العناوين قادمة قريبًا',
};

export const addressesLocales = { en, ar };

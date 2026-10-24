import type { Schemas } from '@/shared/api';

/** A signed-in customer who has accepted the current legal texts. */
export const testUser: Schemas['UserResource'] = {
  id: 7,
  name: 'Sara',
  phone: '+966512345678',
  email: null,
  locale: 'en',
  phone_verified: true,
  email_verified: false,
  consents: {
    terms_version: '2026-10-01',
    privacy_version: '2026-10-01',
    marketing: false,
    needs_update: false,
  },
};

/** What `GET /store` returns. */
export const testStore = {
  currency: 'SAR',
  price: { gross: 575, net: 500, vat: 75 },
  vat_rate_basis_points: 1500,
  terms_version: '2026-10-01',
  privacy_version: '2026-10-01',
};

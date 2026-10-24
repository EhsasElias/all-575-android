import type { Schemas } from '@/shared/api';
import { testUser } from '@/test/fixtures';

export { testStore, testUser } from '@/test/fixtures';

export const customer: Schemas['UserResource'] = testUser;

/** The same customer after the Terms or Privacy Policy changed. */
export const customerWithOldTerms: Schemas['UserResource'] = {
  ...testUser,
  consents: { ...testUser.consents, needs_update: true },
};

export const customerWithoutName: Schemas['UserResource'] = { ...testUser, name: null };

export const currentSession: Schemas['SessionResource'] = {
  id: 11,
  device_name: 'Web browser',
  created_at: '2026-10-20T09:30:00.000000Z',
  last_used_at: '2026-10-24T17:05:00.000000Z',
  expires_at: '2026-11-19T09:30:00.000000Z',
  is_current: true,
};

export const phoneSession: Schemas['SessionResource'] = {
  id: 12,
  device_name: 'Android app',
  created_at: '2026-10-01T06:00:00.000000Z',
  last_used_at: '2026-10-23T20:15:00.000000Z',
  expires_at: '2026-10-31T06:00:00.000000Z',
  is_current: false,
};

export const laptopSession: Schemas['SessionResource'] = {
  id: 13,
  device_name: 'Sara laptop',
  created_at: '2026-09-15T12:00:00.000000Z',
  last_used_at: null,
  expires_at: null,
  is_current: false,
};

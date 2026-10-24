import type { components } from './schema';

/** Every response object of the customer API, generated from docs/api/openapi.json (`npm run api:types`). */
export type Schemas = components['schemas'];

/** The common wrapper around a single resource. */
export type Data<T> = { data: T };

/** A cursor-paginated list: follow `links.next` as is until it is null. */
export type Page<T> = {
  data: T[];
  links: { next: string | null };
  meta: { next_cursor: string | null };
};

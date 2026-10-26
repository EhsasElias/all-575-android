import { describe, expect, it } from 'vitest';
import { createQueryClient } from './queryClient';

describe('createQueryClient', () => {
  it('always tries a request, even when the browser believes the device is offline', () => {
    const { queries, mutations } = createQueryClient().getDefaultOptions();

    expect(queries?.networkMode).toBe('always');
    expect(mutations?.networkMode).toBe('always');
  });
});

import { beforeEach, describe, expect, it } from 'vitest';
import { clearMarketingDraft, readMarketingDraft, saveMarketingDraft } from './marketingDraft';

beforeEach(() => {
  window.sessionStorage.clear();
});

describe('optional marketing signup choice', () => {
  it('defaults to no marketing consent', () => {
    expect(readMarketingDraft('new@example.com')).toBe(false);
  });

  it('keeps the preference only for the same email in the same browser tab', () => {
    saveMarketingDraft('New@Example.com ', true);
    expect(readMarketingDraft('new@example.com')).toBe(true);
    expect(readMarketingDraft('different@example.com')).toBe(false);
    clearMarketingDraft('different@example.com');
    expect(readMarketingDraft('new@example.com')).toBe(true);
    clearMarketingDraft('new@example.com');
    expect(readMarketingDraft('new@example.com')).toBe(false);
  });

  it('does not turn an unchecked marketing box into opt-in', () => {
    saveMarketingDraft('new@example.com', false);
    expect(readMarketingDraft('new@example.com')).toBe(false);
  });
});

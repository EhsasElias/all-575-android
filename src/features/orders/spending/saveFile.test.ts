import { describe, expect, it } from 'vitest';
import { csvFilename } from './saveFile';

const RANGE = { from: '2026-09-25', to: '2026-10-24' };

describe('the name of the downloaded file', () => {
  it('keeps the name the server chose', () => {
    expect(csvFilename('all575-spending-2026-09-25-to-2026-10-24.csv', RANGE)).toBe(
      'all575-spending-2026-09-25-to-2026-10-24.csv',
    );
  });

  it('builds one from the period when the server sent none', () => {
    expect(csvFilename(null, RANGE)).toBe('all575-spending-2026-09-25-to-2026-10-24.csv');
    expect(csvFilename('', RANGE)).toBe('all575-spending-2026-09-25-to-2026-10-24.csv');
  });

  it('never lets a name point into another folder', () => {
    expect(csvFilename('../../etc/passwd', RANGE)).not.toMatch(/[\\/]/);
    expect(csvFilename('..\\secret.csv', RANGE)).not.toMatch(/[\\/]/);
  });

  it('does not start with a dot (a hidden file) and always ends in .csv', () => {
    expect(csvFilename('.hidden', RANGE)).toBe('all575-spending-2026-09-25-to-2026-10-24.csv');
    expect(csvFilename('report', RANGE)).toBe('report.csv');
  });
});

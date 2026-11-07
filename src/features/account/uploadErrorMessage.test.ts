import { describe, expect, it } from 'vitest';
import { ApiError } from '@/shared/api';
import { uploadErrorMessage } from './uploadErrorMessage';

const failure = (status: number, fieldErrors: Record<string, string[]> = {}) =>
  new ApiError({ kind: 'validation', status, message: 'Rejected', fieldErrors });

describe('uploadErrorMessage', () => {
  it('explains an unverified upload permission (403)', () => {
    expect(uploadErrorMessage(failure(403), 'ar', 'document')).toContain('توثيق');
  });

  it('explains missing saved seller draft (404)', () => {
    expect(uploadErrorMessage(failure(404), 'ar', 'document')).toContain('احفظ مسودة');
  });

  it('explains upload limits (413) regardless of file type', () => {
    expect(uploadErrorMessage(failure(413), 'en', 'image')).toContain('Nginx');
  });

  it('retains validation details sent by the server (422)', () => {
    expect(
      uploadErrorMessage(failure(422, { file: ['The file must be a JPG.'] }), 'en', 'image'),
    ).toContain('The file must be a JPG.');
  });

  it('explains connection and timeout separately', () => {
    const timeout = new ApiError({ kind: 'timeout', message: 'Timed out' });
    expect(uploadErrorMessage(timeout, 'ar', 'csv')).toContain('مهلة');
  });
});

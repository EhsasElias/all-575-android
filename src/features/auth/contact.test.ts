import { describe, expect, it } from 'vitest';
import { checkContact, isSameContact, toLatinDigits } from './contact';

describe('checkContact for a mobile number', () => {
  it.each([
    ['0512345678', '0512345678'],
    ['512345678', '512345678'],
    ['+966512345678', '+966512345678'],
    ['966512345678', '966512345678'],
    ['00966512345678', '00966512345678'],
    ['05 1234 5678', '0512345678'],
    ['+966 (51) 234-5678', '+966512345678'],
    ['٠٥١٢٣٤٥٦٧٨', '0512345678'],
  ])('accepts %s and sends it without spaces', (typed, sent) => {
    expect(checkContact('phone', typed)).toEqual({ ok: true, destination: sent });
  });

  it.each([
    ['0112345678', 'a landline'],
    ['051234567', 'one digit short'],
    ['05123456789', 'one digit too many'],
    ['+971512345678', 'another country'],
    ['05abcdefgh', 'letters'],
  ])('rejects %s (%s)', (typed) => {
    expect(checkContact('phone', typed)).toEqual({ ok: false, problem: 'invalid' });
  });

  it.each(['', '   ', ' - '])('asks for a number when the field holds %j', (typed) => {
    expect(checkContact('phone', typed)).toEqual({ ok: false, problem: 'required' });
  });
});

describe('checkContact for an email', () => {
  it('accepts an address and sends it trimmed and in lower case', () => {
    expect(checkContact('email', '  Sara@Example.COM ')).toEqual({
      ok: true,
      destination: 'sara@example.com',
    });
  });

  it.each(['sara', 'sara@', '@example.com', 'sara@example', 'sa ra@example.com'])(
    'rejects %j',
    (typed) => {
      expect(checkContact('email', typed)).toEqual({ ok: false, problem: 'invalid' });
    },
  );

  it('asks for an address when the field is empty', () => {
    expect(checkContact('email', '  ')).toEqual({ ok: false, problem: 'required' });
  });

  it('rejects an address longer than the server accepts', () => {
    const tooLong = `${'a'.repeat(250)}@example.com`;

    expect(checkContact('email', tooLong)).toEqual({ ok: false, problem: 'invalid' });
  });
});

describe('isSameContact', () => {
  it('sees one mobile number written in different ways', () => {
    const phone = (destination: string) => ({ channel: 'phone' as const, destination });

    expect(isSameContact(phone('0512345678'), phone('+966 51 234 5678'))).toBe(true);
    expect(isSameContact(phone('0512345678'), phone('0512345679'))).toBe(false);
  });

  it('ignores the case of an email and never mixes channels', () => {
    const email = (destination: string) => ({ channel: 'email' as const, destination });

    expect(isSameContact(email('Sara@example.com'), email('sara@example.com'))).toBe(true);
    expect(
      isSameContact(email('sara@example.com'), { channel: 'phone', destination: '0512345678' }),
    ).toBe(false);
  });
});

describe('toLatinDigits', () => {
  it('turns Arabic-Indic digits into Latin ones and leaves the rest alone', () => {
    expect(toLatinDigits('٠١٢٣٤٥٦٧٨٩ abc +')).toBe('0123456789 abc +');
  });
});

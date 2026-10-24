import type { Language } from './languages';

const HALALAS_PER_RIYAL = 100;
const NO_BREAK_SPACE = ' ';

// Latin digits in both languages so a number looks the same everywhere in the app.
const LOCALES: Record<Language, string> = { ar: 'ar-SA', en: 'en-SA' };
const CURRENCY_LABELS: Record<Language, string> = { ar: 'ر.س', en: 'SAR' };

const amountFormatters: Record<Language, Intl.NumberFormat> = {
  ar: createAmountFormatter('ar'),
  en: createAmountFormatter('en'),
};

const numberFormatters: Record<Language, Intl.NumberFormat> = {
  ar: new Intl.NumberFormat(LOCALES.ar, { numberingSystem: 'latn' }),
  en: new Intl.NumberFormat(LOCALES.en, { numberingSystem: 'latn' }),
};

function createAmountFormatter(language: Language): Intl.NumberFormat {
  return new Intl.NumberFormat(LOCALES[language], {
    numberingSystem: 'latn',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Money is always an integer number of halalas: 575 is 5.75 SAR. The amount comes first and the
 * currency (ر.س or SAR) after it, joined by a no-break space so they never split across lines.
 */
export function formatMoney(halalas: number, language: Language): string {
  if (!Number.isSafeInteger(halalas)) {
    throw new RangeError(`Money must be an integer number of halalas, received ${halalas}`);
  }
  const amount = amountFormatters[language].format(halalas / HALALAS_PER_RIYAL);
  return `${amount}${NO_BREAK_SPACE}${CURRENCY_LABELS[language]}`;
}

export function formatNumber(value: number, language: Language): string {
  return numberFormatters[language].format(value);
}

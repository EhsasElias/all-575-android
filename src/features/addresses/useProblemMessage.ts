import { useTranslation } from 'react-i18next';
import { MAX_LENGTH } from './addressFields';
import { isPatternField, type FieldProblem, type ProblemKey } from './splRules';

/** Turns a rule that failed into our own sentence in the current language (the server's wording is never shown). */
export function useProblemMessage() {
  const { t } = useTranslation('addresses');

  return (key: ProblemKey, problem: FieldProblem | undefined): string | undefined => {
    if (problem === undefined) return undefined;
    if (key === 'pin') return t('form.errors.pin');
    if (problem === 'required') return t('form.errors.required');
    if (problem === 'tooLong') return t('form.errors.tooLong', { max: MAX_LENGTH[key] ?? 0 });
    return isPatternField(key) ? t(`form.errors.format.${key}`) : t('form.errors.other');
  };
}

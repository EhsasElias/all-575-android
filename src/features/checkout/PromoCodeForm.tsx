import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatMoney, useLanguage } from '@/shared/i18n';
import { Button, Icon, TextField } from '@/shared/ui';
import type { PromoProblem } from './promoProblem';
import styles from './PromoCodeForm.module.css';

export type PromoControls = {
  applied: string | null;
  problem: PromoProblem | null;
  checking: boolean;
  apply: (code: string) => Promise<void>;
  remove: () => void;
  dismissProblem: () => void;
};

const MAX_PROMO_LENGTH = 40;

function usePromoMessage(problem: PromoProblem | null): string | undefined {
  const { t } = useTranslation('checkout');
  const { language } = useLanguage();
  if (problem === null) return undefined;
  if (problem.code === 'promo_min_subtotal') {
    return problem.minSubtotal === null
      ? t('promo.errors.promo_min_subtotal_unknown')
      : t('promo.errors.promo_min_subtotal', {
          amount: formatMoney(problem.minSubtotal, language),
        });
  }
  return t(`promo.errors.${problem.code}`);
}

/** Enter a code (the server checks it and prices the order with it) or remove the one that is applied. */
export function PromoCodeForm({ promo }: { promo: PromoControls }) {
  const { t } = useTranslation('checkout');
  const [code, setCode] = useState('');
  const message = usePromoMessage(promo.problem);

  if (promo.applied !== null) {
    return (
      <div className={styles.applied}>
        <span className={styles.appliedText}>
          <Icon name="tag" size={20} />
          {t('promo.applied', { code: promo.applied })}
        </span>
        <Button variant="ghost" onClick={promo.remove}>
          {t('promo.remove')}
        </Button>
      </div>
    );
  }

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        void promo.apply(code);
      }}
    >
      <TextField
        className={styles.field}
        label={t('promo.label')}
        value={code}
        maxLength={MAX_PROMO_LENGTH}
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        {...(message ? { error: message } : {})}
        onChange={(event) => {
          setCode(event.target.value);
          if (promo.problem) promo.dismissProblem();
        }}
      />
      <Button type="submit" variant="secondary" loading={promo.checking} className={styles.apply}>
        {t('promo.apply')}
      </Button>
    </form>
  );
}

import { useTranslation } from 'react-i18next';
import { formatNumber, useLanguage } from '@/shared/i18n';
import { VisuallyHidden } from '@/shared/ui';
import type { SuborderStatus } from '../types';
import styles from './SuborderProgress.module.css';

const STAGES = ['awaiting_seller', 'preparing', 'ready', 'on_the_way', 'delivered'] as const;

type Stage = (typeof STAGES)[number];

/** How many stages are finished: waiting for the seller counts as the first one being current. */
function currentIndex(status: SuborderStatus): number {
  const index = STAGES.findIndex((stage) => stage === status);
  return index === -1 ? 0 : index;
}

function stateOf(index: number, current: number, delivered: boolean): 'done' | 'current' | 'next' {
  if (delivered || index < current) return 'done';
  return index === current ? 'current' : 'next';
}

function StageName({ stage }: { stage: Stage }) {
  const { t } = useTranslation('orders');
  return t(`status.suborder.${stage}`);
}

/** Five segments and the words "Step 3 of 5", so the progress never depends on colour. */
export function SuborderProgress({ status }: { status: SuborderStatus }) {
  const { t } = useTranslation('orders');
  const { language } = useLanguage();
  const current = currentIndex(status);
  const delivered = status === 'delivered';
  const step = delivered ? STAGES.length : current + 1;

  return (
    <div className={styles.progress}>
      <ol className={styles.bar} aria-label={t('suborder.progress')}>
        {STAGES.map((stage, index) => {
          const state = stateOf(index, current, delivered);
          return (
            <li
              key={stage}
              className={`${styles.segment} ${styles[state]}`}
              aria-current={state === 'current' ? 'step' : undefined}
            >
              <VisuallyHidden>
                <StageName stage={stage} />, {t(`suborder.state.${state}`)}
              </VisuallyHidden>
            </li>
          );
        })}
      </ol>
      <p className={styles.caption}>
        {t('suborder.step', {
          current: formatNumber(step, language),
          total: formatNumber(STAGES.length, language),
        })}
      </p>
    </div>
  );
}

import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/shared/i18n';
import { Icon } from '@/shared/ui';
import { Section } from '../components/Section';
import { formatDateTime } from '../format/dateTime';
import type { Suborder, TimelineEvent } from '../types';
import { localized } from './localized';
import { isKnownTimelineEvent, timelineIcon } from './timelineEvents';
import styles from './OrderTimeline.module.css';

type OrderTimelineProps = {
  events: TimelineEvent[];
  suborders: Suborder[];
};

function EventLabel({ type }: { type: string }) {
  const { t } = useTranslation('orders');
  return isKnownTimelineEvent(type) ? t(`timeline.events.${type}`) : t('timeline.events.unknown');
}

/** What happened to the order and when, oldest first, straight from the API's timeline. */
export function OrderTimeline({ events, suborders }: OrderTimelineProps) {
  const { t } = useTranslation('orders');
  const { language } = useLanguage();
  const separateDeliveries = suborders.length > 1;

  const sellerOf = (suborderId: string | null): string | null => {
    if (!separateDeliveries || suborderId === null) return null;
    const seller = suborders.find((suborder) => suborder.id === suborderId)?.seller;
    return seller === undefined ? null : localized(seller.name, language);
  };

  return (
    <Section title={t('timeline.title')}>
      <ol className={styles.list}>
        {events.map((event, index) => {
          const seller = sellerOf(event.suborder_id);
          return (
            <li key={`${event.type}-${event.at}-${String(index)}`} className={styles.item}>
              <span className={styles.marker}>
                <Icon name={timelineIcon(event.type)} size={18} />
              </span>
              <div className={styles.content}>
                <p className={styles.label}>
                  <EventLabel type={event.type} />
                  {seller !== null && <span className={styles.seller}> · {seller}</span>}
                </p>
                <p className={styles.time}>{formatDateTime(event.at, language)}</p>
                {event.type === 'eta_revised' && event.note !== null && (
                  <p className={styles.note}>{t('timeline.reason', { reason: event.note })}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}

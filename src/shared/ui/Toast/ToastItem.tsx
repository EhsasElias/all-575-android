import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon, type IconName } from '../Icon/Icon';
import { IconButton } from '../IconButton/IconButton';
import type { ToastVariant } from './toastContext';
import styles from './Toast.module.css';

const ICONS: Record<ToastVariant, IconName> = {
  info: 'info',
  success: 'check-circle',
  error: 'alert-circle',
};

type ToastItemProps = {
  id: number;
  message: string;
  variant: ToastVariant;
  durationMs: number;
  onDismiss: (id: number) => void;
};

/** True while the pointer or keyboard focus is on the element. */
function useInteracting(ref: RefObject<HTMLElement | null>): boolean {
  const [interacting, setInteracting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const start = () => {
      setInteracting(true);
    };
    const stop = () => {
      setInteracting(false);
    };
    element.addEventListener('mouseenter', start);
    element.addEventListener('mouseleave', stop);
    element.addEventListener('focusin', start);
    element.addEventListener('focusout', stop);
    return () => {
      element.removeEventListener('mouseenter', start);
      element.removeEventListener('mouseleave', stop);
      element.removeEventListener('focusin', start);
      element.removeEventListener('focusout', stop);
    };
  }, [ref]);

  return interacting;
}

export function ToastItem({ id, message, variant, durationMs, onDismiss }: ToastItemProps) {
  const { t } = useTranslation();
  const toastRef = useRef<HTMLDivElement>(null);
  const paused = useInteracting(toastRef);
  const dismiss = useCallback(() => {
    onDismiss(id);
  }, [id, onDismiss]);

  // Reading time matters: the toast waits while the pointer or focus is on it.
  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(dismiss, durationMs);
    return () => {
      clearTimeout(timer);
    };
  }, [paused, durationMs, dismiss]);

  return (
    <div ref={toastRef} className={styles.toast} data-variant={variant}>
      <Icon name={ICONS[variant]} className={styles.icon} />
      <p className={styles.message}>{message}</p>
      <IconButton label={t('actions.dismiss')} onClick={dismiss}>
        <Icon name="close" size={20} />
      </IconButton>
    </div>
  );
}

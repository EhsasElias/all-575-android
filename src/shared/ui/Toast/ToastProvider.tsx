import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { ToastContext, type ToastApi, type ToastOptions, type ToastVariant } from './toastContext';
import { ToastItem } from './ToastItem';
import styles from './Toast.module.css';

const DEFAULT_DURATION_MS = 6000;

type ActiveToast = {
  id: number;
  message: string;
  variant: ToastVariant;
  durationMs: number;
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ActiveToast[]>([]);
  const nextId = useRef(1);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ message, variant = 'info', durationMs = DEFAULT_DURATION_MS }: ToastOptions) => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, message, variant, durationMs }]);
      return id;
    },
    [],
  );

  const api = useMemo<ToastApi>(() => ({ showToast, dismissToast }), [showToast, dismissToast]);

  return (
    <ToastContext value={api}>
      {children}
      {/* The live region stays mounted so screen readers announce each toast as it is added. */}
      <div className={styles.viewport} role="status" aria-live="polite">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            id={toast.id}
            message={toast.message}
            variant={toast.variant}
            durationMs={toast.durationMs}
            onDismiss={dismissToast}
          />
        ))}
      </div>
    </ToastContext>
  );
}

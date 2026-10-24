import type { ReactNode } from 'react';
import { Button, Sheet } from '@/shared/ui';
import styles from './ConfirmSheet.module.css';

type ConfirmSheetProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  pending: boolean;
  /** Shown inside the dialog when the confirmed action failed, so the customer can try again. */
  errorMessage?: string | undefined;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
};

/** Asks before something that cannot be undone. The dialog stays open while it works, and when it fails. */
export function ConfirmSheet({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  pending,
  errorMessage,
  onConfirm,
  onCancel,
  children,
}: ConfirmSheetProps) {
  return (
    <Sheet
      open={open}
      title={title}
      placement="center"
      onClose={() => {
        if (!pending) onCancel();
      }}
      footer={
        <>
          <Button loading={pending} onClick={onConfirm}>
            {confirmLabel}
          </Button>
          <Button variant="secondary" onClick={onCancel} disabled={pending}>
            {cancelLabel}
          </Button>
        </>
      }
    >
      <p className={styles.message}>{message}</p>
      {children}
      {errorMessage && (
        <p role="alert" className={styles.error}>
          {errorMessage}
        </p>
      )}
    </Sheet>
  );
}

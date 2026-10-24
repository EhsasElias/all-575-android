import type { ComponentProps } from 'react';
import { cx } from '@/shared/lib';
import styles from './IconButton.module.css';

type IconButtonProps = Omit<ComponentProps<'button'>, 'aria-label'> & {
  /** The accessible name. Icon-only buttons have no visible text, so it is required. */
  label: string;
};

export function IconButton({
  label,
  type = 'button',
  className,
  children,
  ...rest
}: IconButtonProps) {
  return (
    <button {...rest} type={type} aria-label={label} className={cx(styles.iconButton, className)}>
      {children}
    </button>
  );
}

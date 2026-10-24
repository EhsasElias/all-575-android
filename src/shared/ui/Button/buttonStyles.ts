import { cx } from '@/shared/lib';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'md' | 'lg';

export type ButtonStyleProps = {
  variant?: ButtonVariant | undefined;
  size?: ButtonSize | undefined;
  fullWidth?: boolean | undefined;
};

export function buttonClassName(
  { variant = 'primary', size = 'md', fullWidth = false }: ButtonStyleProps,
  className?: string,
): string {
  return cx(
    styles.button,
    styles[variant],
    size === 'lg' && styles.large,
    fullWidth && styles.fullWidth,
    className,
  );
}

export const spinnerClassName = styles.spinner;

import type { ComponentProps, MouseEvent } from 'react';
import { buttonClassName, spinnerClassName, type ButtonStyleProps } from './buttonStyles';

export type ButtonProps = ComponentProps<'button'> &
  ButtonStyleProps & {
    loading?: boolean;
  };

export function Button({
  variant,
  size,
  fullWidth,
  loading = false,
  type = 'button',
  className,
  children,
  onClick,
  ...rest
}: ButtonProps) {
  // The button stays focusable while loading (aria-disabled, not disabled), so
  // focus is not lost when the request ends; clicks are ignored instead.
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (loading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  return (
    <button
      {...rest}
      type={type}
      className={buttonClassName({ variant, size, fullWidth }, className)}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      onClick={handleClick}
    >
      {loading && <span className={spinnerClassName} aria-hidden="true" />}
      {children}
    </button>
  );
}

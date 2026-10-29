import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { cx } from '@/shared/lib';
import styles from './Logo.module.css';
import { LOGO_HEIGHT, LOGO_WIDTH, LogoArt } from './logoArt';

type LogoProps = {
  /** Width in pixels; the height follows the artwork's ratio. */
  size?: number;
  className?: string | undefined;
  /** Hide the logo from assistive technology, for use inside a control that already has a name. */
  decorative?: boolean;
};

/** The ALL 5.75 logo. The background is white in light mode and transparent in dark mode. */
export function Logo({ size = 40, className, decorative = false }: LogoProps) {
  const { t } = useTranslation();
  // The artwork's gradient and clip path are referenced by id, so every instance needs its own.
  const uniqueId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const accessibility = decorative
    ? { 'aria-hidden': true }
    : { role: 'img', 'aria-label': t('appName') };

  return (
    <LogoArt
      rainbowId={`all575-logo-rainbow-${uniqueId}`}
      clipId={`all575-logo-clip-${uniqueId}`}
      width={size}
      height={(size * LOGO_HEIGHT) / LOGO_WIDTH}
      className={cx(styles.logo, className)}
      focusable="false"
      {...accessibility}
    />
  );
}

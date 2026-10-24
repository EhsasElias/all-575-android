import { useLanguage } from '@/shared/i18n';
import type { IconName } from '@/shared/ui';

type DirectionalIcons = { back: IconName; forward: IconName };

/** Chevrons are drawn left or right on screen, so "forward" points left in Arabic. */
export function useDirectionalIcons(): DirectionalIcons {
  const { direction } = useLanguage();
  return direction === 'rtl'
    ? { back: 'chevron-right', forward: 'chevron-left' }
    : { back: 'chevron-left', forward: 'chevron-right' };
}

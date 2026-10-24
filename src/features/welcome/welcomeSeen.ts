import { getPreference, setPreference } from '@/shared/storage';

export function hasSeenWelcome(): boolean {
  return getPreference('welcomeSeen') === 'true';
}

export function markWelcomeSeen(): void {
  setPreference('welcomeSeen', 'true');
}

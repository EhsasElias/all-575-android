import { useTranslation } from 'react-i18next';
import { formatNumber, useLanguage } from '@/shared/i18n';
import type { AuthFailure } from './authFailure';
import type { Channel } from './contact';
import { formatCountdown } from './formatCountdown';

/** The sentence for each failure, in the current language. */
export function useFailureText(): (failure: AuthFailure, channel: Channel) => string {
  const { t } = useTranslation('auth');
  const { language } = useLanguage();

  return (failure, channel) => {
    switch (failure.kind) {
      case 'otp-invalid':
        return failure.attemptsRemaining === null
          ? t('failure.otpInvalidUnknown')
          : t('failure.otpInvalid', {
              attempts: formatNumber(failure.attemptsRemaining, language),
            });
      case 'otp-expired':
        return t('failure.otpExpired');
      case 'otp-locked':
        return t('failure.otpLocked');
      case 'otp-cooldown':
        return failure.retryAfterSeconds === null
          ? t('failure.cooldownUnknown')
          : t('failure.cooldown', { time: formatCountdown(failure.retryAfterSeconds) });
      case 'rate-limited':
        return failure.retryAfterSeconds === null
          ? t('failure.rateLimitedUnknown')
          : t('failure.rateLimited', { time: formatCountdown(failure.retryAfterSeconds) });
      case 'account-inactive':
        return t('failure.accountInactive');
      case 'field':
        if (failure.field === 'code') return t('code.incomplete');
        return t(channel === 'phone' ? 'contact.phoneInvalid' : 'contact.emailInvalid');
      case 'offline':
        return t('failure.offline');
      case 'unknown':
        return t('failure.unknown');
    }
  };
}

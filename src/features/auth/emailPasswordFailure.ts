import { FirebaseError } from 'firebase/app';
import { errorCode, isApiError } from '@/shared/api';

type FailureKey =
  | 'emailPassword.accountConflict'
  | 'failure.accountInactive'
  | 'emailPassword.notReady'
  | 'emailPassword.tryAgain'
  | 'emailPassword.emailExists'
  | 'emailPassword.invalidEmail'
  | 'emailPassword.weakPassword'
  | 'emailPassword.invalidCredentials'
  | 'emailPassword.tooMany'
  | 'failure.offline';

export function failureKey(error: unknown): FailureKey {
  if (isApiError(error)) {
    const code = errorCode(error);
    if (code === 'account_link_required') return 'emailPassword.accountConflict';
    if (code === 'account_inactive') return 'failure.accountInactive';
    if (code === 'firebase_unavailable') return 'emailPassword.notReady';
    return 'emailPassword.tryAgain';
  }
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'auth/email-already-in-use':
        return 'emailPassword.emailExists';
      case 'auth/invalid-email':
        return 'emailPassword.invalidEmail';
      case 'auth/weak-password':
        return 'emailPassword.weakPassword';
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'emailPassword.invalidCredentials';
      case 'auth/too-many-requests':
        return 'emailPassword.tooMany';
      case 'auth/network-request-failed':
        return 'failure.offline';
      default:
        return 'emailPassword.tryAgain';
    }
  }
  return 'emailPassword.tryAgain';
}

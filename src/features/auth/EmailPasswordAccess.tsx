import { useState, type SubmitEvent } from 'react';
import { FirebaseError } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getIdToken,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { errorCode, http, isApiError, type Data, type Schemas } from '@/shared/api';
import { getFirebaseAuth } from '@/shared/firebase/firebase';
import { routePaths } from '@/shared/lib';
import { useSession } from '@/shared/session';
import { Button, ErrorState, Skeleton, TextField, useToast } from '@/shared/ui';
import { ConsentForm } from './ConsentForm';
import { SignInSteps } from './SignInSteps';
import { currentDeviceName } from './deviceName';
import { useConsentVersions } from './useConsentVersions';
import type { ConsentChoice } from './authApi';
import styles from './StepLayout.module.css';
import formStyles from './EmailPasswordAccess.module.css';

type LoginReply = {
  token: string;
  user: Schemas['UserResource'];
  is_new_user: boolean;
};

type Props = { createAccount: boolean };

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

function failureKey(error: unknown): FailureKey {
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

/**
 * Firebase authenticates email/password. Only a confirmed Firebase email ID token
 * is exchanged for the application's regular Laravel Sanctum customer session.
 * Existing Laravel phone/email OTP remains available as an explicit alternative.
 */
export function EmailPasswordAccess({ createAccount }: Props) {
  const { t } = useTranslation('auth');
  const session = useSession();
  const { showToast } = useToast();
  const legal = useConsentVersions(null);
  const [useOtp, setUseOtp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [needsConsent, setNeedsConsent] = useState(false);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState('');
  const [notice, setNotice] = useState('');

  async function exchange(consents: ConsentChoice | null): Promise<void> {
    const auth = getFirebaseAuth();
    const currentUser = auth.currentUser;
    if (currentUser === null || !currentUser.emailVerified) {
      throw new Error('Verified Firebase email session required');
    }

    const data = (
      await http.post<Data<LoginReply>>('/auth/firebase/login', {
      id_token: await getIdToken(currentUser),
      device_name: currentDeviceName(),
      ...(consents === null
        ? {}
        : {
            consents: {
              terms_version: consents.terms,
              privacy_version: consents.privacy,
              marketing: consents.marketing,
            },
          }),
      })
    ).data;

    await session.signIn(data.token, data.user);
    showToast({
      message: t(data.is_new_user ? 'welcome.newAccount' : 'welcome.returning'),
      variant: 'success',
    });
  }

  async function finish(consents: ConsentChoice | null): Promise<void> {
    setPending(true);
    setFailure('');
    setNotice('');
    try {
      await exchange(consents);
    } catch (error) {
      if (isApiError(error) && errorCode(error) === 'consent_required') {
        setNeedsConsent(true);
      } else {
        setFailure(t(failureKey(error)));
      }
    } finally {
      setPending(false);
    }
  }

  async function submit(event: SubmitEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (pending) return;

    setFailure('');
    setNotice('');
    if (createAccount && (!termsAccepted || !privacyAccepted)) {
      setFailure(t('emailPassword.acceptLegal'));
      return;
    }
    if (createAccount && legal.status !== 'ready') {
      setFailure(t('emailPassword.tryAgain'));
      return;
    }
    if (createAccount && password.length < 12) {
      setFailure(t('emailPassword.weakPassword'));
      return;
    }

    setPending(true);
    try {
      const auth = getFirebaseAuth();
      if (createAccount) {
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        try {
          await sendEmailVerification(credential.user);
          setNotice(t('emailPassword.verificationSent'));
          setPassword('');
        } finally {
          // A new, unverified account must never remain authenticated in the app.
          await signOut(auth);
        }
      } else {
        const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
        if (!credential.user.emailVerified) {
          try {
            await sendEmailVerification(credential.user);
            setNotice(t('emailPassword.verificationRequired'));
            setPassword('');
          } finally {
            await signOut(auth);
          }
        } else {
          await exchange(null);
        }
      }
    } catch (error) {
      if (isApiError(error) && errorCode(error) === 'consent_required') {
        setNeedsConsent(true);
      } else {
        setFailure(t(failureKey(error)));
      }
    } finally {
      setPending(false);
    }
  }

  async function resetPassword(): Promise<void> {
    if (pending) return;
    if (email.trim() === '') {
      setFailure(t('emailPassword.enterEmail'));
      return;
    }
    setPending(true);
    setFailure('');
    setNotice('');
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
      setNotice(t('emailPassword.resetSent'));
    } catch (error) {
      setFailure(t(failureKey(error)));
    } finally {
      setPending(false);
    }
  }

  if (useOtp) {
    return (
      <div className={styles.step}>
        <Button variant="ghost" onClick={() => setUseOtp(false)}>
          {t('emailPassword.backToEmail')}
        </Button>
        <SignInSteps />
      </div>
    );
  }

  if (needsConsent) {
    return (
      <div className={styles.step}>
        <h2 className={styles.stepTitle}>{t('consent.title')}</h2>
        {legal.status === 'loading' && <Skeleton height="8rem" />}
        {legal.status === 'error' && <ErrorState headingLevel={3} onRetry={legal.retry} />}
        {legal.status === 'ready' && (
          <ConsentForm
            channel="email"
            versions={legal.versions}
            versionsChanged={false}
            verify={{ pending, failure: null }}
            onAccept={(choice) => {
              void finish(choice);
            }}
          />
        )}
        {failure && <p role="alert" className={styles.alert}>{failure}</p>}
      </div>
    );
  }

  return (
    <div className={styles.step}>
      <form
        className={styles.form}
        onSubmit={(event) => {
          void submit(event);
        }}
      >
        <TextField
          name="email"
          type="email"
          label={t('emailPassword.email')}
          autoComplete="email"
          autoCapitalize="none"
          dir="ltr"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <TextField
          name="password"
          type="password"
          label={t('emailPassword.password')}
          autoComplete={createAccount ? 'new-password' : 'current-password'}
          minLength={createAccount ? 12 : undefined}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          hint={createAccount ? t('emailPassword.passwordHint') : undefined}
        />
        {createAccount && (
          <div className={formStyles.legal}>
            {legal.status === 'loading' && <Skeleton height="3rem" />}
            {legal.status === 'error' && <ErrorState headingLevel={3} onRetry={legal.retry} />}
            {legal.status === 'ready' && (
              <>
                <label>
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(event) => setTermsAccepted(event.target.checked)}
                  />
                  {t('emailPassword.agreeTerms')}{' '}
                  <Link to={routePaths.terms}>{t('emailPassword.terms')}</Link> (
                  {legal.versions.terms})
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={privacyAccepted}
                    onChange={(event) => setPrivacyAccepted(event.target.checked)}
                  />
                  {t('emailPassword.agreePrivacy')}{' '}
                  <Link to={routePaths.privacy}>{t('emailPassword.privacy')}</Link> (
                  {legal.versions.privacy})
                </label>
              </>
            )}
          </div>
        )}
        {failure && <p role="alert" className={styles.alert}>{failure}</p>}
        {notice && <p role="status" className={formStyles.notice}>{notice}</p>}
        <Button type="submit" size="lg" fullWidth loading={pending}>
          {t(createAccount ? 'emailPassword.register' : 'emailPassword.login')}
        </Button>
      </form>
      {!createAccount && (
        <Button
          variant="ghost"
          onClick={() => {
            void resetPassword();
          }}
          disabled={pending}
        >
          {t('emailPassword.forgot')}
        </Button>
      )}
      <div className={formStyles.alternative}>
        <span>{t('emailPassword.or')}</span>
        <Button variant="secondary" fullWidth onClick={() => setUseOtp(true)}>
          {t('emailPassword.useOtp')}
        </Button>
      </div>
    </div>
  );
}

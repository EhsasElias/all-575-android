import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useSearchParams } from 'react-router';
import { routePaths } from '@/shared/lib';
import { useSession } from '@/shared/session';
import { ButtonLink, Skeleton } from '@/shared/ui';
import { afterSignInPath } from './afterSignIn';
import { SignInSteps } from './SignInSteps';
import { BiometricSignIn } from './BiometricSignIn';
import styles from './SignInScreen.module.css';

const EmailPasswordAccess = lazy(async () => {
  const module = await import('./EmailPasswordAccess');
  return { default: module.EmailPasswordAccess };
});

/** Customer sign-in with a feature-gated Firebase email/password option and existing OTP fallback. */
export function SignInScreen({ createAccount = false }: { createAccount?: boolean }) {
  const { t } = useTranslation('auth');
  const { t: access } = useTranslation('access');
  const { status } = useSession();
  const [searchParams] = useSearchParams();
  const emailLoginEnabled = import.meta.env.VITE_FIREBASE_AUTH_ENABLED === 'true';
  const checkoutEntry = searchParams.get('next')?.startsWith('/checkout') ?? false;

  if (status === 'signed-in') {
    return <Navigate to={afterSignInPath(searchParams.get('next'))} replace />;
  }

  return (
    <section className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>{createAccount ? access('createTitle') : t('title')}</h1>
        <p className={styles.intro}>
          {emailLoginEnabled
            ? t(createAccount ? 'emailPassword.introRegister' : 'emailPassword.introSignIn')
            : access(createAccount ? 'createIntro' : 'signInIntro')}
        </p>
      </header>
      {checkoutEntry && (
        <p className={styles.intro}>{t('emailPassword.checkoutRequired')}</p>
      )}
      {status === 'loading' ? (
        <div role="status" aria-busy="true" aria-label={t('loading')} className={styles.skeleton}>
          <Skeleton height="1.5rem" width="60%" />
          <Skeleton height="3rem" />
          <Skeleton height="3.25rem" />
        </div>
      ) : emailLoginEnabled ? (
        <Suspense fallback={<Skeleton height="10rem" />}>
          <EmailPasswordAccess createAccount={createAccount} />
        </Suspense>
      ) : (
        <SignInSteps />
      )}
      <ButtonLink
        variant="ghost"
        to={`${createAccount ? routePaths.signIn : routePaths.createAccount}?${searchParams.toString()}`}
      >
        {access(createAccount ? 'haveAccount' : 'newAccount')}
      </ButtonLink>
      {!createAccount && status === 'guest' && <BiometricSignIn />}
      <ButtonLink variant="ghost" to={routePaths.home} className={styles.guest}>
        {emailLoginEnabled ? t('emailPassword.continueShoppingAsGuest') : t('continueAsGuest')}
      </ButtonLink>
    </section>
  );
}

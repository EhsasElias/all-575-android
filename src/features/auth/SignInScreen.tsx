import { useTranslation } from 'react-i18next';
import { Navigate, useSearchParams } from 'react-router';
import { routePaths } from '@/shared/lib';
import { useSession } from '@/shared/session';
import { ButtonLink, Skeleton } from '@/shared/ui';
import { afterSignInPath } from './afterSignIn';
import { SignInSteps } from './SignInSteps';
import styles from './SignInScreen.module.css';

/** Passwordless sign-in. A customer who is already signed in is sent on to where they were going. */
export function SignInScreen() {
  const { t } = useTranslation('auth');
  const { status } = useSession();
  const [searchParams] = useSearchParams();

  if (status === 'signed-in') {
    return <Navigate to={afterSignInPath(searchParams.get('next'))} replace />;
  }

  return (
    <section className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('title')}</h1>
        <p className={styles.intro}>{t('intro')}</p>
      </header>
      {status === 'loading' ? (
        <div role="status" aria-busy="true" aria-label={t('loading')} className={styles.skeleton}>
          <Skeleton height="1.5rem" width="60%" />
          <Skeleton height="3rem" />
          <Skeleton height="3.25rem" />
        </div>
      ) : (
        <SignInSteps />
      )}
      <ButtonLink variant="ghost" to={routePaths.home} className={styles.guest}>
        {t('continueAsGuest')}
      </ButtonLink>
    </section>
  );
}

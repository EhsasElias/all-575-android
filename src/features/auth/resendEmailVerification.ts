import { sendEmailVerification, signInWithEmailAndPassword, signOut, type Auth } from 'firebase/auth';

/**
 * Firebase requires a recently authenticated user to resend an email action.
 * This short-lived Firebase session never becomes a Laravel customer session.
 */
export async function resendEmailVerification(
  auth: Auth,
  email: string,
  password: string,
): Promise<boolean> {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  try {
    if (credential.user.emailVerified) return false;
    await sendEmailVerification(credential.user);
    return true;
  } finally {
    await signOut(auth);
  }
}

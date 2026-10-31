import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

/** Firebase is initialized only when the email login feature is enabled. */
export function getFirebaseAuth() {
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  if (!config.apiKey || !config.authDomain || !config.projectId || !config.appId) {
    throw new Error('Firebase web app configuration is missing');
  }

  const app = getApps().find((candidate) => candidate.name === 'market575-customer')
    ?? initializeApp(config, 'market575-customer');

  return getAuth(app);
}

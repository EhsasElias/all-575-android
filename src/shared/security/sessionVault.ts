import {
  createSecureTokenStore,
  loadNativeStorage,
  type SecureKeyValueStorage,
} from '../api/secure-token-store';
import { authenticateBiometry, hasStrongBiometry, isNativeBiometry } from './nativeBiometry';

const ENABLED_KEY = 'biometric-session-enabled';

type VaultOptions = {
  native: () => boolean;
  available: () => Promise<boolean>;
  authenticate: (reason: string) => Promise<void>;
  loadStorage: () => Promise<SecureKeyValueStorage>;
};

/** Opt-in native session unlock. Both the token and policy live in encrypted storage. */
export function createSessionVault({ native, available, authenticate, loadStorage }: VaultOptions) {
  const base = createSecureTokenStore(loadStorage);
  let unlocked = false;
  let revision = 0;
  const enabled = async () =>
    native() && (await (await loadStorage()).getItem(ENABLED_KEY)) === 'true';
  const lock = () => {
    unlocked = false;
    revision++;
  };

  const store = {
    get: async () => {
      if (!native()) return null;
      const current = revision;
      if ((await enabled()) && !unlocked) return null;
      const token = await base.get();
      // A background event or sign-out during a storage read must not release a token.
      return revision === current ? token : null;
    },
    set: async (token: string) => {
      if (!native()) throw new Error('Native storage unavailable');
      lock();
      // A newly verified OTP may belong to a different account. Enroll it separately.
      await base.clear();
      await (await loadStorage()).removeItem(ENABLED_KEY);
      await base.set(token);
    },
    clear: async () => {
      lock();
      if (!native()) return;
      await base.clear();
      await (await loadStorage()).removeItem(ENABLED_KEY);
    },
  };

  return {
    store,
    lock,
    enabled,
    state: async () => {
      if (!native()) return { available: false, enabled: false };
      return { available: await available(), enabled: await enabled() };
    },
    enable: async (reason: string) => {
      if (!native() || !(await available()) || (await store.get()) === null)
        throw new Error('Verify a session first');
      const current = revision;
      await authenticate(reason);
      if (current !== revision) throw new Error('Session changed');
      await (await loadStorage()).setItem(ENABLED_KEY, 'true');
      if (current !== revision) throw new Error('Session changed');
      unlocked = true;
    },
    disable: async (reason: string) => {
      if ((await store.get()) === null) throw new Error('Unlock first');
      const current = revision;
      await authenticate(reason);
      if (current !== revision) throw new Error('Session changed');
      await (await loadStorage()).removeItem(ENABLED_KEY);
    },
    unlock: async (reason: string) => {
      if (!(await enabled()) || !(await available())) throw new Error('Biometry unavailable');
      const current = revision;
      await authenticate(reason);
      if (current !== revision) throw new Error('Session changed');
      if ((await base.get()) === null) throw new Error('Session missing');
      if (current !== revision) throw new Error('Session changed');
      unlocked = true;
    },
  };
}

export const sessionVault = createSessionVault({
  native: isNativeBiometry,
  available: hasStrongBiometry,
  authenticate: authenticateBiometry,
  loadStorage: loadNativeStorage,
});

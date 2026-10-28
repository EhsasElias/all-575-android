import { describe, expect, it, vi } from 'vitest';
import { createSessionVault } from './sessionVault';

function setup(native = true) {
  const data = new Map<string, string>();
  const storage = {
    getItem: vi.fn((key: string) => Promise.resolve(data.get(key) ?? null)),
    setItem: vi.fn((key: string, value: string) => {
      data.set(key, value);
      return Promise.resolve();
    }),
    removeItem: vi.fn((key: string) => {
      data.delete(key);
      return Promise.resolve();
    }),
  };
  const authenticate = vi.fn<(reason: string) => Promise<void>>(() => Promise.resolve());
  const options = {
    native: () => native,
    available: () => Promise.resolve(true),
    authenticate,
    loadStorage: () => Promise.resolve(storage),
  };
  return { data, storage, authenticate, options, vault: createSessionVault(options) };
}

describe('native biometric session vault', () => {
  it('requires a verified session before enrollment', async () => {
    const { vault, authenticate } = setup();
    await expect(vault.enable('Enable')).rejects.toThrow();
    expect(authenticate).not.toHaveBeenCalled();
  });

  it('never uses simulated browser biometrics', async () => {
    const { vault, data, authenticate } = setup(false);
    data.set('access-token', 'private');
    data.set('biometric-session-enabled', 'true');
    await expect(vault.state()).resolves.toEqual({ available: false, enabled: false });
    await expect(vault.unlock('Unlock')).rejects.toThrow();
    await expect(vault.store.get()).resolves.toBeNull();
    await expect(vault.store.set('must-not-persist')).rejects.toThrow();
    expect(authenticate).not.toHaveBeenCalled();
  });

  it('blocks requests after restart until native authentication succeeds', async () => {
    const { vault, options, authenticate } = setup();
    await vault.store.set('verified-token');
    await vault.enable('Enable');
    const reopened = createSessionVault(options);
    await expect(reopened.store.get()).resolves.toBeNull();
    expect(authenticate).toHaveBeenCalledTimes(1);
    await reopened.unlock('Unlock');
    await expect(reopened.store.get()).resolves.toBe('verified-token');
  });

  it('keeps the token inaccessible after cancellation', async () => {
    const { vault, authenticate } = setup();
    await vault.store.set('verified-token');
    await vault.enable('Enable');
    vault.lock();
    authenticate.mockRejectedValueOnce(new Error('Cancelled'));
    await expect(vault.unlock('Unlock')).rejects.toThrow();
    await expect(vault.store.get()).resolves.toBeNull();
  });

  it('does not unlock if the app backgrounds during the prompt', async () => {
    const { vault, authenticate } = setup();
    await vault.store.set('verified-token');
    await vault.enable('Enable');
    vault.lock();
    authenticate.mockImplementationOnce(() => {
      vault.lock();
      return Promise.resolve();
    });
    await expect(vault.unlock('Unlock')).rejects.toThrow('Session changed');
    await expect(vault.store.get()).resolves.toBeNull();
  });

  it('does not leak an in-flight token read when the app locks', async () => {
    const { vault, storage, data } = setup();
    await vault.store.set('verified-token');
    await vault.enable('Enable');
    storage.getItem.mockImplementation((key) => {
      if (key === 'access-token') vault.lock();
      return Promise.resolve(data.get(key) ?? null);
    });
    await expect(vault.store.get()).resolves.toBeNull();
  });

  it('requires fresh enrollment when OTP verifies another session', async () => {
    const { vault } = setup();
    await vault.store.set('first-account');
    await vault.enable('Enable');
    vault.lock();
    await vault.store.set('second-account');
    await expect(vault.enabled()).resolves.toBe(false);
    await expect(vault.store.get()).resolves.toBe('second-account');
  });

  it('forgets both the enrollment and token on sign-out', async () => {
    const { vault, options } = setup();
    await vault.store.set('verified-token');
    await vault.enable('Enable');
    await vault.store.clear();
    const reopened = createSessionVault(options);
    await expect(reopened.enabled()).resolves.toBe(false);
    await expect(reopened.store.get()).resolves.toBeNull();
    await expect(reopened.unlock('Unlock')).rejects.toThrow();
  });

  it('does not trust unavailable or unenrolled hardware', async () => {
    const { vault, options } = setup();
    await vault.store.set('verified-token');
    await vault.enable('Enable');
    const reopened = createSessionVault({ ...options, available: () => Promise.resolve(false) });
    await expect(reopened.unlock('Unlock')).rejects.toThrow();
    await expect(reopened.store.get()).resolves.toBeNull();
  });

  it('requires native authentication to turn protection off', async () => {
    const { vault, authenticate, options } = setup();
    await vault.store.set('verified-token');
    await vault.enable('Enable');
    authenticate.mockRejectedValueOnce(new Error('Cancelled'));
    await expect(vault.disable('Disable')).rejects.toThrow();
    await expect(vault.enabled()).resolves.toBe(true);
    await vault.disable('Disable');
    await expect(createSessionVault(options).store.get()).resolves.toBe('verified-token');
  });
});

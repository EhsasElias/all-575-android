import { useRef, useState } from 'react';
import { clearSavedServer, env, normalizeServerAddress, saveServer } from '@/shared/lib';
import { checkServer } from './checkServer';
import { restartApp } from './restartApp';

export type CheckState = 'idle' | 'checking' | 'connected' | 'unreachable';

export function useServerForm() {
  const [value, setValue] = useState(env.apiBaseUrl);
  const [check, setCheck] = useState<CheckState>('idle');
  const [invalid, setInvalid] = useState(false);
  const [notSaved, setNotSaved] = useState(false);
  // An answer that arrives after the tester has typed something else is about an address they no longer see.
  const attempt = useRef(0);

  function change(next: string): void {
    attempt.current += 1;
    setValue(next);
    setCheck('idle');
    setInvalid(false);
    setNotSaved(false);
  }

  /** The address to use, or null after showing why not. */
  function validAddress(): string | null {
    const address = normalizeServerAddress(value);
    setInvalid(address === null);
    return address;
  }

  async function runCheck(): Promise<void> {
    const address = validAddress();
    if (address === null) return;
    attempt.current += 1;
    const mine = attempt.current;
    setCheck('checking');
    const connected = await checkServer(address);
    if (mine === attempt.current) setCheck(connected ? 'connected' : 'unreachable');
  }

  function save(): void {
    const address = validAddress();
    if (address === null) return;
    if (!saveServer(address)) {
      setNotSaved(true);
      return;
    }
    restartApp();
  }

  function reset(): void {
    clearSavedServer();
    restartApp();
  }

  return { value, check, invalid, notSaved, change, runCheck, save, reset };
}

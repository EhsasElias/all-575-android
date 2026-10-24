import { Capacitor } from '@capacitor/core';

/** The label shown in the customer's device list. */
export function currentDeviceName(): string {
  return Capacitor.getPlatform() === 'android' ? 'Android app' : 'Web browser';
}

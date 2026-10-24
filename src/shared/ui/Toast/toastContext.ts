import { createContext, useContext } from 'react';

export type ToastVariant = 'info' | 'success' | 'error';

export type ToastOptions = {
  message: string;
  variant?: ToastVariant;
  durationMs?: number;
};

export type ToastApi = {
  showToast: (options: ToastOptions) => number;
  dismissToast: (id: number) => void;
};

export const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error('useToast must be used inside <ToastProvider>');
  return api;
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { isApiError } from '@/shared/api';
import { downloadSpendingCsv } from '../api/ordersApi';
import type { DateRange } from '../types';
import { csvFilename, saveBlob } from './saveFile';

export type ExportState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; filename: string }
  | { status: 'error'; reason: 'invalidDates' | 'tooManyRequests' | 'failed' };

const IDLE: ExportState = { status: 'idle' };

function failureOf(error: unknown): 'invalidDates' | 'tooManyRequests' | 'failed' {
  if (!isApiError(error)) return 'failed';
  if (error.kind === 'validation') return 'invalidDates';
  return error.kind === 'rate-limited' ? 'tooManyRequests' : 'failed';
}

/** Downloads the period's CSV from the API and saves it. One download at a time; leaving the page cancels it. */
export function useCsvExport({ from, to }: DateRange) {
  const [state, setState] = useState<ExportState>(IDLE);
  const request = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      request.current?.abort();
    },
    [],
  );

  const start = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setState({ status: 'loading' });
    try {
      const range = { from, to };
      const file = await downloadSpendingCsv(range, controller.signal);
      const filename = csvFilename(file.filename, range);
      saveBlob(file.blob, filename);
      setState({ status: 'done', filename });
    } catch (error) {
      if (controller.signal.aborted) return;
      setState({ status: 'error', reason: failureOf(error) });
    }
  }, [from, to]);

  return { state, start };
}

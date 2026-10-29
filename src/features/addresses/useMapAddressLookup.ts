import { useEffect, useRef, useState } from 'react';
import { reverseMapAddress, type MapAddress } from './api';
import type { MapPin } from './mapTypes';

export type LookupStatus = 'idle' | 'loading' | 'filled' | 'empty' | 'outside' | 'failed';
type Job = { pin: MapPin; onFound: (address: MapAddress) => void; version: number };

/** Look up deliberate pin selections only, never an existing address on page load. */
export function useMapAddressLookup() {
  const [job, setJob] = useState<Job | null>(null);
  const [status, setStatus] = useState<LookupStatus>('idle');
  const version = useRef(0);

  const lookup = (pin: MapPin, onFound: Job['onFound']) => {
    version.current += 1;
    setStatus('loading');
    setJob({ pin, onFound, version: version.current });
  };

  useEffect(() => {
    if (!job) return;
    const controller = new AbortController();
    const run = async () => {
      try {
        const data = await reverseMapAddress(job.pin, controller.signal);
        if (controller.signal.aborted || version.current !== job.version) return;
        if (data.country_code !== 'sa') {
          setStatus(data.country_code ? 'outside' : 'empty');
          return;
        }
        job.onFound(data);
        const available = [
          data.region,
          data.city,
          data.district,
          data.street,
          data.building_number,
          data.postal_code,
        ];
        setStatus(available.some(Boolean) ? 'filled' : 'empty');
      } catch {
        if (!controller.signal.aborted && version.current === job.version) setStatus('failed');
      }
    };
    // A quick drag/tap sequence should request only the final resting point.
    const timer = setTimeout(() => void run(), 600);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [job]);

  return {
    status,
    lookup,
    retry: () => {
      if (job) lookup(job.pin, job.onFound);
    },
  };
}

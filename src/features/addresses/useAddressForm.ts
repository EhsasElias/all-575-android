import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { errorCode, isApiError } from '@/shared/api';
import { useSession } from '@/shared/session';
import { saveAddress, type Address, type AddressPayload } from './api';
import {
  buildAddressPayload,
  emptyAddressValues,
  valuesFromAddress,
  type AddressField,
  type AddressValues,
} from './addressFields';
import type { MapPin } from './mapTypes';
import { LOCATION_FIELDS, MAP_FIELDS } from './mapAddressFields';
import { useMapAddressLookup } from './useMapAddressLookup';
import { addressKeys } from './queryKeys';
import {
  clearProblem,
  firstProblemKey,
  isValidPin,
  normalizeValues,
  problemsFromServer,
  validateAddress,
  type AddressProblems,
  type ProblemKey,
} from './splRules';

export type SaveFailure = 'limit' | 'fields' | 'network' | null;

function initialValues(address: Address | null, name: string, phone: string): AddressValues {
  if (address) return valuesFromAddress(address);
  // A new address is usually for the customer themselves.
  return { ...emptyAddressValues, recipientName: name, recipientPhone: phone };
}

function failureOf(error: unknown): SaveFailure {
  if (error === null) return null;
  if (errorCode(error) === 'address_limit_reached') return 'limit';
  return isApiError(error) && error.kind === 'validation' ? 'fields' : 'network';
}

/** All the state of the address form: values, the pin, what is wrong, and saving. */
export function useAddressForm(address: Address | null) {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [values, setValues] = useState(() =>
    initialValues(address, user?.name ?? '', user?.phone ?? ''),
  );
  const [pin, setPin] = useState<MapPin | null>(() =>
    address ? { lat: address.lat, lng: address.lng } : null,
  );
  const [makeDefault, setMakeDefault] = useState(false);
  const [problems, setProblems] = useState<AddressProblems>({});
  const [saved, setSaved] = useState<Address | null>(null);
  // Once a new address exists, saving again (e.g. after moving the pin) updates it instead of adding another.
  const [existingId, setExistingId] = useState<number | null>(address?.id ?? null);
  const edits = useRef<Partial<Record<AddressField, number>>>({});
  const mapLookup = useMapAddressLookup();

  const mutation = useMutation({
    mutationFn: (payload: AddressPayload) => saveAddress(existingId, payload),
    onSuccess: (result) => {
      setSaved(result);
      setExistingId(result.id);
      setProblems({});
      void queryClient.invalidateQueries({ queryKey: addressKeys.all });
    },
    onError: (error) => {
      if (isApiError(error) && error.kind === 'validation') {
        setProblems(problemsFromServer(error.fieldErrors));
      }
    },
  });

  const setField = (field: AddressField, value: string) => {
    edits.current[field] = (edits.current[field] ?? 0) + 1;
    setValues((current) => ({ ...current, [field]: value }));
    setProblems((current) => clearProblem(current, field));
  };

  const placePin = (next: MapPin) => {
    const moved = pin !== null && (pin.lat !== next.lat || pin.lng !== next.lng);
    setPin(next);
    setProblems((current) => clearProblem(current, 'pin'));
    const beforeLookup = { ...edits.current };
    // Never leave details from another location attached to the newly selected pin.
    setValues((current) => {
      const updated = { ...current };
      if (moved) for (const field of LOCATION_FIELDS) updated[field] = '';
      return updated;
    });
    mapLookup.lookup(next, (found) => {
      setValues((current) => {
        const updated = { ...current };
        for (const { field, source } of MAP_FIELDS) {
          if (edits.current[field] === beforeLookup[field] && (moved || current[field] === '')) {
            updated[field] = found[source] ?? '';
          }
        }
        return updated;
      });
      setProblems((current) => {
        let updated = current;
        for (const field of LOCATION_FIELDS) updated = clearProblem(updated, field);
        return updated;
      });
    });
  };

  /** Returns the first field with a problem (to focus it), or null when the form was sent. */
  const submit = (): ProblemKey | null => {
    if (mapLookup.status === 'loading') return 'pin';
    const normalized = normalizeValues(values);
    const found = validateAddress(normalized, pin);
    setProblems(found);
    const first = firstProblemKey(found);
    if (first !== null || !isValidPin(pin)) return first ?? 'pin';
    setValues(normalized);
    mutation.mutate(buildAddressPayload(normalized, pin, makeDefault));
    return null;
  };

  return {
    values,
    pin,
    makeDefault,
    problems,
    saved,
    isSaving: mutation.isPending,
    failure: failureOf(mutation.error),
    isNew: address === null,
    setField,
    placePin,
    lookupStatus: mapLookup.status,
    retryLookup: mapLookup.retry,
    setMakeDefault,
    dismissSaved: () => {
      setSaved(null);
    },
    submit,
  };
}

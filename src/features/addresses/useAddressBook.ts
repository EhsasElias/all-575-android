import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/shared/ui';
import { deleteAddress, listAddresses, makeDefaultAddress, type Address } from './api';
import { addressKeys } from './queryKeys';

function addressName(address: Address): string {
  return address.label ?? address.recipient_name;
}

/** The saved addresses and the two things you can do to one from the list: make it default, delete it. */
export function useAddressBook() {
  const { t } = useTranslation('addresses');
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [pendingDelete, setPendingDelete] = useState<Address | null>(null);

  const list = useQuery({
    queryKey: addressKeys.list,
    queryFn: ({ signal }) => listAddresses(signal),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: addressKeys.all });
  const failed = () => {
    showToast({ message: t('list.toast.failed'), variant: 'error' });
  };

  const setDefault = useMutation({
    mutationFn: (address: Address) => makeDefaultAddress(address.id),
    onSuccess: async (_result, address) => {
      await refresh();
      showToast({
        message: t('list.toast.defaultSet', { name: addressName(address) }),
        variant: 'success',
      });
    },
    onError: failed,
  });

  const remove = useMutation({
    mutationFn: (address: Address) => deleteAddress(address.id),
    onSuccess: async () => {
      setPendingDelete(null);
      await refresh();
      showToast({ message: t('list.toast.deleted'), variant: 'success' });
    },
    onError: () => {
      setPendingDelete(null);
      failed();
    },
  });

  return {
    list,
    addressName,
    pendingDelete,
    askToDelete: setPendingDelete,
    cancelDelete: () => {
      setPendingDelete(null);
    },
    confirmDelete: () => {
      if (pendingDelete) remove.mutate(pendingDelete);
    },
    isDeleting: remove.isPending,
    setDefault: (address: Address) => {
      setDefault.mutate(address);
    },
    /** The address whose "set as default" is in flight, to show a spinner on that one button only. */
    settingDefaultId: setDefault.isPending ? setDefault.variables.id : null,
  };
}

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

export default function useAddresses({
  api,
  currentUser,
  lang,
  showToast,
}) {
  const [
    addresses,
    setAddresses,
  ] = useState([]);

  const [
    addressesLoading,
    setAddressesLoading,
  ] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Load Addresses
  |--------------------------------------------------------------------------
  */

  const loadAddresses =
    useCallback(async () => {
      if (!currentUser) {
        setAddresses([]);
        return;
      }

      setAddressesLoading(true);

      try {
        const response =
          await api.getAddresses();

        const data =
          response?.data ||
          response ||
          [];

        setAddresses(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (error) {
        console.error(
          'Addresses load error:',
          error
        );

        setAddresses([]);
      } finally {
        setAddressesLoading(false);
      }
    }, [
      api,
      currentUser,
    ]);

  /*
  |--------------------------------------------------------------------------
  | Reload when account changes
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadAddresses();
  }, [
    loadAddresses,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Create Address
  |--------------------------------------------------------------------------
  */

  async function createAddress(
    payload
  ) {
    try {
      await api.createAddress(
        payload
      );

      await loadAddresses();

      showToast(
        lang === 'ar'
          ? 'تم حفظ العنوان'
          : 'Address saved'
      );

      return true;
    } catch (error) {
      console.error(
        'Create address error:',
        error
      );

      showToast(
        error?.message ||
        (
          lang === 'ar'
            ? 'تعذر حفظ العنوان'
            : 'Could not save address'
        )
      );

      return false;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Update Address
  |--------------------------------------------------------------------------
  */

  async function updateAddress(
    id,
    payload
  ) {
    try {
      await api.updateAddress(
        id,
        payload
      );

      await loadAddresses();

      showToast(
        lang === 'ar'
          ? 'تم تحديث العنوان'
          : 'Address updated'
      );

      return true;
    } catch (error) {
      console.error(
        'Update address error:',
        error
      );

      showToast(
        error?.message ||
        (
          lang === 'ar'
            ? 'تعذر تحديث العنوان'
            : 'Could not update address'
        )
      );

      return false;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Default Address
  |--------------------------------------------------------------------------
  */

  async function setDefaultAddress(
    id
  ) {
    try {
      await api.setDefaultAddress(
        id
      );

      await loadAddresses();

      showToast(
        lang === 'ar'
          ? 'تم تعيين العنوان الافتراضي'
          : 'Default address updated'
      );
    } catch (error) {
      console.error(
        'Default address error:',
        error
      );

      showToast(
        lang === 'ar'
          ? 'تعذر تعيين العنوان'
          : 'Could not set default address'
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Delete Address
  |--------------------------------------------------------------------------
  */

  async function deleteAddress(
    id
  ) {
    try {
      await api.deleteAddress(
        id
      );

      await loadAddresses();

      showToast(
        lang === 'ar'
          ? 'تم حذف العنوان'
          : 'Address deleted'
      );
    } catch (error) {
      console.error(
        'Delete address error:',
        error
      );

      showToast(
        lang === 'ar'
          ? 'تعذر حذف العنوان'
          : 'Could not delete address'
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Default Address
  |--------------------------------------------------------------------------
  */

  const defaultAddress =
    addresses.find(
      (address) =>
        Boolean(
          address.is_default
        )
    ) ||
    addresses[0] ||
    null;

  return {
    addresses,
    addressesLoading,
    defaultAddress,
    createAddress,
    updateAddress,
    setDefaultAddress,
    deleteAddress,
    reloadAddresses:
      loadAddresses,
  };
}
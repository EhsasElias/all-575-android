import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

export default function useCart({
  api,
  currentUser,
  lang,
  showToast,
  go,
}) {
  const [
    cart,
    setCart,
  ] = useState({
    items: [],
    items_count: 0,
    subtotal: 0,
    currency: 'SAR',
  });

  const [
    cartLoading,
    setCartLoading,
  ] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Load Cart
  |--------------------------------------------------------------------------
  */

  const loadCart =
    useCallback(async () => {
      if (!currentUser) {
        setCart({
          items: [],
          items_count: 0,
          subtotal: 0,
          currency: 'SAR',
        });

        return;
      }

      setCartLoading(true);

      try {
        const response =
          await api.getCart();

        const data =
          response?.data ||
          response ||
          {};

        setCart({
          items:
            Array.isArray(data.items)
              ? data.items
              : [],

          items_count:
            Number(
              data.items_count || 0
            ),

          subtotal:
            Number(
              data.subtotal || 0
            ),

          currency:
            data.currency ||
            'SAR',
        });
      } catch (error) {
        console.error(
          'Cart load error:',
          error
        );

        setCart({
          items: [],
          items_count: 0,
          subtotal: 0,
          currency: 'SAR',
        });
      } finally {
        setCartLoading(false);
      }
    }, [
      api,
      currentUser,
    ]);

  /*
  |--------------------------------------------------------------------------
  | Reload cart when account changes
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadCart();
  }, [
    loadCart,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Add Item
  |--------------------------------------------------------------------------
  */

  async function addToCart(
    productId,
    quantity = 1
  ) {
    if (!currentUser) {
      showToast(
        lang === 'ar'
          ? 'سجل الدخول أولاً لإضافة المنتجات إلى السلة'
          : 'Sign in first to add products to your cart'
      );

      go('login');

      return;
    }

    try {
      await api.addCartItem(
        Number(productId),
        quantity
      );

      await loadCart();

      showToast(
        lang === 'ar'
          ? 'تمت الإضافة إلى السلة'
          : 'Added to cart'
      );
    } catch (error) {
      console.error(
        'Add cart error:',
        error
      );

      showToast(
        error?.message ||
        (
          lang === 'ar'
            ? 'تعذر إضافة المنتج إلى السلة'
            : 'Could not add product to cart'
        )
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Change Quantity
  |--------------------------------------------------------------------------
  */

  async function changeCartQuantity(
    productId,
    quantity
  ) {
    if (!currentUser) {
      return;
    }

    const nextQuantity =
      Number(quantity);

    try {
      if (nextQuantity <= 0) {
        await api.removeCartItem(
          Number(productId)
        );
      } else {
        await api.updateCartItem(
          Number(productId),
          nextQuantity
        );
      }

      await loadCart();
    } catch (error) {
      console.error(
        'Update cart error:',
        error
      );

      showToast(
        error?.message ||
        (
          lang === 'ar'
            ? 'تعذر تحديث السلة'
            : 'Could not update cart'
        )
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Remove Item
  |--------------------------------------------------------------------------
  */

  async function removeFromCart(
    productId
  ) {
    if (!currentUser) {
      return;
    }

    try {
      await api.removeCartItem(
        Number(productId)
      );

      await loadCart();

      showToast(
        lang === 'ar'
          ? 'تم حذف المنتج من السلة'
          : 'Removed from cart'
      );
    } catch (error) {
      console.error(
        'Remove cart error:',
        error
      );

      showToast(
        error?.message ||
        (
          lang === 'ar'
            ? 'تعذر حذف المنتج'
            : 'Could not remove product'
        )
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Clear Cart
  |--------------------------------------------------------------------------
  */

  async function clearCart() {
    if (!currentUser) {
      return;
    }

    try {
      await api.clearCart();

      await loadCart();

      showToast(
        lang === 'ar'
          ? 'تم تفريغ السلة'
          : 'Cart cleared'
      );
    } catch (error) {
      console.error(
        'Clear cart error:',
        error
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Normalized UI Items
  |--------------------------------------------------------------------------
  */

  const cartItems =
    useMemo(() => {
      return cart.items
        .map(
          (item) => ({
            id:
              Number(item.id),

            product:
              item.product,

            qty:
              Number(
                item.quantity || 0
              ),

            unitPrice:
              Number(
                item.unit_price || 0
              ),

            lineTotal:
              Number(
                item.line_total || 0
              ),

            available:
              item.available !== false,
          })
        )
        .filter(
          (item) =>
            item.product
        );
    }, [
      cart.items,
    ]);

  return {
    cart,
    cartItems,

    cartCount:
      Number(
        cart.items_count || 0
      ),

    cartTotal:
      Number(
        cart.subtotal || 0
      ),

    cartLoading,

    addToCart,

    changeCartQuantity,

    removeFromCart,

    clearCart,

    reloadCart:
      loadCart,
  };
}
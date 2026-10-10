import {
  useCallback,
  useEffect,
  useState,
} from 'react';

export default function useOrders({
  api,
  currentUser,
}) {
  const [
    orders,
    setOrders,
  ] = useState([]);

  const [
    ordersLoading,
    setOrdersLoading,
  ] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Normalize one order
  |--------------------------------------------------------------------------
  */

  function normalizeOrder(
    order
  ) {
    return {
      ...order,

      id:
        Number(order.id),

      number:
        order.order_number ||
        order.number ||
        order.id,

      total:
        Number(
          order.total || 0
        ),

      subtotal:
        Number(
          order.subtotal || 0
        ),

      deliveryFee:
        Number(
          order.delivery_fee || 0
        ),

      status:
        order.status ||
        'pending',

      paymentMethod:
        order.payment_method ||
        'cash_on_delivery',

      paymentStatus:
        order.payment_status ||
        'pending',

      createdAt:
        order.created_at ||
        null,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Load Orders
  |--------------------------------------------------------------------------
  */

  const loadOrders =
    useCallback(async () => {
      if (!currentUser) {
        setOrders([]);
        return;
      }

      setOrdersLoading(true);

      try {
        const response =
          await api.getOrders();

        const data =
          response?.data ||
          response ||
          [];

        const list =
          Array.isArray(data)
            ? data
            : [];

        setOrders(
          list.map(
            normalizeOrder
          )
        );
      } catch (error) {
        console.error(
          'Orders load error:',
          error
        );

        setOrders([]);
      } finally {
        setOrdersLoading(false);
      }
    }, [
      api,
      currentUser,
    ]);

  /*
  |--------------------------------------------------------------------------
  | Load after login / refresh
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadOrders();
  }, [
    loadOrders,
  ]);

  return {
    orders,
    ordersLoading,
    reloadOrders:
      loadOrders,
  };
}
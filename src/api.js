import {
  Capacitor,
  CapacitorHttp,
} from '@capacitor/core';

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || ''
).replace(/\/$/, '');

const TOKEN_KEY = 'all575_access_token';

/*
|--------------------------------------------------------------------------
| Access Token
|--------------------------------------------------------------------------
|
| نحفظ الـ token في sessionStorage حتى يبقى بعد Refresh.
| لاحقًا في Android سنستخدم Secure Storage.
|
*/

let accessToken =
  typeof window !== 'undefined'
    ? sessionStorage.getItem(TOKEN_KEY)
    : null;

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token) {
  accessToken = token || null;

  if (typeof window === 'undefined') {
    return;
  }

  if (accessToken) {
    sessionStorage.setItem(
      TOKEN_KEY,
      accessToken
    );
  } else {
    sessionStorage.removeItem(
      TOKEN_KEY
    );
  }
}

/*
|--------------------------------------------------------------------------
| Main Request Helper
|--------------------------------------------------------------------------
*/

async function request(
  path,
  options = {}
) {
  const url =
    `${API_BASE}${path}`;

  const headers = {
    Accept:
      'application/json',

    ...(options.body
      ? {
        'Content-Type':
          'application/json',
      }
      : {}),

    ...(accessToken
      ? {
        Authorization:
          `Bearer ${accessToken}`,
      }
      : {}),

    ...(options.headers || {}),
  };

  /*
  |--------------------------------------------------------------------------
  | Android / iOS
  |--------------------------------------------------------------------------
  */

  if (
    Capacitor.isNativePlatform()
  ) {
    const response =
      await CapacitorHttp.request({
        url,

        method:
          options.method ||
          'GET',

        headers,

        ...(options.body
          ? {
            data:
              JSON.parse(
                options.body
              ),
          }
          : {}),
      });

    const body =
      response.data;

    if (
      response.status < 200 ||
      response.status >= 300
    ) {
      const error =
        new Error(
          body?.message ||
          `API request failed: ${response.status}`
        );

      error.status =
        response.status;

      error.errors =
        body?.errors || null;

      throw error;
    }

    if (
      response.status === 204
    ) {
      return null;
    }

    return body;
  }
  /*
  |--------------------------------------------------------------------------
  | Browser
  |--------------------------------------------------------------------------
  */

  const response =
    await fetch(
      url,
      {
        ...options,
        headers,
      }
    );

  const body =
    await response
      .json()
      .catch(() => null);

  if (!response.ok) {
    const error =
      new Error(
        body?.message ||
        `API request failed: ${response.status}`
      );

    error.status =
      response.status;

    error.errors =
      body?.errors || null;

    throw error;
  }

  if (
    response.status === 204
  ) {
    return null;
  }

  return body;
}

/*
|--------------------------------------------------------------------------
| API
|--------------------------------------------------------------------------
*/

export const api = {
  /*
  |--------------------------------------------------------------------------
  | Home
  |--------------------------------------------------------------------------
  */

  getHome: () =>
    request(
      '/api/v1/home'
    ),

  /*
  |--------------------------------------------------------------------------
  | Authentication
  |--------------------------------------------------------------------------
  */

  register: (payload) =>
    request(
      '/api/v1/register',
      {
        method: 'POST',

        body:
          JSON.stringify(
            payload
          ),
      }
    ),

  login: (payload) =>
    request(
      '/api/v1/login',
      {
        method: 'POST',

        body:
          JSON.stringify(
            payload
          ),
      }
    ),

  me: () =>
    request(
      '/api/v1/me'
    ),

  logout: () =>
    request(
      '/api/v1/logout',
      {
        method: 'POST',
      }
    ),

  logoutAll: () =>
    request(
      '/api/v1/logout-all',
      {
        method: 'POST',
      }
    ),

  /*
  |--------------------------------------------------------------------------
  | Products
  |--------------------------------------------------------------------------
  */

  getProducts: () =>
    request(
      '/api/v1/products'
    ),

  getProduct: (id) =>
    request(
      `/api/v1/products/${id}`
    ),

  /*
  |--------------------------------------------------------------------------
  | Favorites
  |--------------------------------------------------------------------------
  */

  getFavorites: () =>
    request(
      '/api/v1/favorites'
    ),

  addFavorite: (
    productId
  ) =>
    request(
      '/api/v1/favorites',
      {
        method: 'POST',

        body:
          JSON.stringify({
            product_id:
              productId,
          }),
      }
    ),

  removeFavorite: (
    productId
  ) =>
    request(
      `/api/v1/favorites/${productId}`,
      {
        method: 'DELETE',
      }
    ),

  /*
  |--------------------------------------------------------------------------
  | Cart
  |--------------------------------------------------------------------------
  */

  getCart: () =>
    request(
      '/api/v1/cart'
    ),

  addCartItem: (
    productId,
    quantity = 1
  ) =>
    request(
      '/api/v1/cart/items',
      {
        method: 'POST',

        body:
          JSON.stringify({
            product_id:
              productId,

            quantity,
          }),
      }
    ),

  updateCartItem: (
    productId,
    quantity
  ) =>
    request(
      `/api/v1/cart/items/${productId}`,
      {
        method: 'PATCH',

        body:
          JSON.stringify({
            quantity,
          }),
      }
    ),

  removeCartItem: (
    productId
  ) =>
    request(
      `/api/v1/cart/items/${productId}`,
      {
        method: 'DELETE',
      }
    ),

  clearCart: () =>
    request(
      '/api/v1/cart',
      {
        method: 'DELETE',
      }
    ),

  /*
  |--------------------------------------------------------------------------
  | Addresses
  |--------------------------------------------------------------------------
  */

  getAddresses: () =>
    request(
      '/api/v1/addresses'
    ),

  createAddress: (
    payload
  ) =>
    request(
      '/api/v1/addresses',
      {
        method: 'POST',

        body:
          JSON.stringify(
            payload
          ),
      }
    ),

  updateAddress: (
    id,
    payload
  ) =>
    request(
      `/api/v1/addresses/${id}`,
      {
        method: 'PUT',

        body:
          JSON.stringify(
            payload
          ),
      }
    ),

  setDefaultAddress: (
    id
  ) =>
    request(
      `/api/v1/addresses/${id}/default`,
      {
        method: 'PATCH',
      }
    ),

  deleteAddress: (
    id
  ) =>
    request(
      `/api/v1/addresses/${id}`,
      {
        method: 'DELETE',
      }
    ),

  /*
  |--------------------------------------------------------------------------
  | Checkout
  |--------------------------------------------------------------------------
  */

  createOrder: (
    payload
  ) =>
    request(
      '/api/v1/checkout',
      {
        method: 'POST',

        body:
          JSON.stringify(
            payload
          ),
      }
    ),

  /*
  |--------------------------------------------------------------------------
  | Customer Orders
  |--------------------------------------------------------------------------
  */

  getOrders: () =>
    request(
      '/api/v1/orders'
    ),

  getOrder: (id) =>
    request(
      `/api/v1/orders/${id}`
    ),

  cancelOrder: (
    id
  ) =>
    request(
      `/api/v1/orders/${id}/cancel`,
      {
        method: 'POST',
      }
    ),

  /*
  |--------------------------------------------------------------------------
  | Notifications
  |--------------------------------------------------------------------------
  */

  getNotifications: () =>
    request(
      '/api/v1/notifications'
    ),

  getUnreadNotifications:
    () =>
      request(
        '/api/v1/notifications/unread'
      ),

  markNotificationAsRead:
    (id) =>
      request(
        `/api/v1/notifications/${id}/read`,
        {
          method: 'PATCH',
        }
      ),

  markAllNotificationsAsRead:
    () =>
      request(
        '/api/v1/notifications/read-all',
        {
          method: 'PATCH',
        }
      ),

  deleteNotification: (
    id
  ) =>
    request(
      `/api/v1/notifications/${id}`,
      {
        method: 'DELETE',
      }
    ),

  /*
  |--------------------------------------------------------------------------
  | Seller Applications
  |--------------------------------------------------------------------------
  */

  getSellerApplications:
    () =>
      request(
        '/api/v1/seller-applications'
      ),

  createSellerApplication:
    (payload) =>
      request(
        '/api/v1/seller-applications',
        {
          method: 'POST',

          body:
            JSON.stringify(
              payload
            ),
        }
      ),

  /*
  |--------------------------------------------------------------------------
  | Seller Dashboard
  |--------------------------------------------------------------------------
  */

  getSellerDashboard:
    () =>
      request(
        '/api/v1/seller/dashboard'
      ),

  getSellerProfile: () =>
    request(
      '/api/v1/seller/profile'
    ),

  updateSellerProfile:
    (payload) =>
      request(
        '/api/v1/seller/profile',
        {
          method: 'PUT',

          body:
            JSON.stringify(
              payload
            ),
        }
      ),

  /*
  |--------------------------------------------------------------------------
  | Seller Products
  |--------------------------------------------------------------------------
  */

  getSellerProducts: () =>
    request(
      '/api/v1/seller/products'
    ),

  createSellerProduct:
    (payload) =>
      request(
        '/api/v1/seller/products',
        {
          method: 'POST',

          body:
            JSON.stringify(
              payload
            ),
        }
      ),

  updateSellerProduct: (
    id,
    payload
  ) =>
    request(
      `/api/v1/seller/products/${id}`,
      {
        method: 'PUT',

        body:
          JSON.stringify(
            payload
          ),
      }
    ),

  deleteSellerProduct:
    (id) =>
      request(
        `/api/v1/seller/products/${id}`,
        {
          method: 'DELETE',
        }
      ),

  /*
  |--------------------------------------------------------------------------
  | Seller Orders
  |--------------------------------------------------------------------------
  */

  getSellerOrders: () =>
    request(
      '/api/v1/seller/orders'
    ),

  getSellerOrder: (
    id
  ) =>
    request(
      `/api/v1/seller/orders/${id}`
    ),

  /*
  |--------------------------------------------------------------------------
  | Admin Dashboard
  |--------------------------------------------------------------------------
  */

  getAdminDashboard: () =>
    request(
      '/api/v1/admin/dashboard'
    ),

  /*
  |--------------------------------------------------------------------------
  | Admin Orders
  |--------------------------------------------------------------------------
  */

  getAdminOrders: () =>
    request(
      '/api/v1/admin/orders'
    ),

  getAdminOrder: (id) =>
    request(
      `/api/v1/admin/orders/${id}`
    ),

  updateOrderStatus: (
    id,
    status,
    note = null
  ) =>
    request(
      `/api/v1/admin/orders/${id}/status`,
      {
        method: 'PATCH',

        body:
          JSON.stringify({
            status,
            note,
          }),
      }
    ),

  /*
  |--------------------------------------------------------------------------
  | Admin Seller Applications
  |--------------------------------------------------------------------------
  */

  getAdminSellerApplications:
    () =>
      request(
        '/api/v1/admin/seller-applications'
      ),

  reviewSellerApplication:
    (
      id,
      payload
    ) =>
      request(
        `/api/v1/admin/seller-applications/${id}/review`,
        {
          method: 'PATCH',

          body:
            JSON.stringify(
              payload
            ),
        }
      ),

  /*
  |--------------------------------------------------------------------------
  | Admin Products
  |--------------------------------------------------------------------------
  */

  getAdminProducts: () =>
    request(
      '/api/v1/admin/products'
    ),

  createAdminProduct: (
    payload
  ) =>
    request(
      '/api/v1/admin/products',
      {
        method: 'POST',

        body:
          JSON.stringify(
            payload
          ),
      }
    ),

  updateAdminProduct: (
    id,
    payload
  ) =>
    request(
      `/api/v1/admin/products/${id}`,
      {
        method: 'PUT',

        body:
          JSON.stringify(
            payload
          ),
      }
    ),

  deleteAdminProduct: (
    id
  ) =>
    request(
      `/api/v1/admin/products/${id}`,
      {
        method: 'DELETE',
      }
    ),

  /*
  | Kept because older App.jsx code
  | may still call api.saveProduct().
  */

  saveProduct: (
    payload
  ) =>
    request(
      '/api/v1/admin/products',
      {
        method: 'POST',

        body:
          JSON.stringify(
            payload
          ),
      }
    ),
};

/*
|--------------------------------------------------------------------------
| API Mode
|--------------------------------------------------------------------------
*/

export function shouldUseApi() {
  return true;
}
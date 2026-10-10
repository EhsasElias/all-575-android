import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import { Icon } from './icons';

import {
  PRICE,
  translations,
} from './data';

import {
  loadPreferences,
  savePreferences,
} from './persistence';

import {
  api,
  getAccessToken,
  setAccessToken,
  shouldUseApi,
} from './api';

import {
  emptyStore,
  mapHomeResponse,
} from './homeData';

import RegisterPage from './RegisterPage';
import AddressesPage from './AddressesPage';
import OrderDetailsPage from './OrderDetailsPage';
import NotificationsPage from './NotificationsPage';
import SellerDashboardPage from './SellerDashboardPage';
import SellerProductsPage from './SellerProductsPage';
import SellerProductFormPage from './SellerProductFormPage';
import SellerOrdersPage from './SellerOrdersPage';
import SellerOrderDetailsPage from './SellerOrderDetailsPage';
import SellerProfilePage from './SellerProfilePage';
import AdminDashboardPage from './AdminDashboardPage';
import AdminSellerApplicationsPage from './AdminSellerApplicationsPage';
import AdminProductsPage from './AdminProductsPage';
import AdminOrdersPage from './AdminOrdersPage';
import useFavorites from './useFavorites';
import useCart from './useCart';
import useAddresses from './useAddresses';
import useOrders from './useOrders';
import useNotifications from './useNotifications';

function money(lang, value) {
  return lang === 'ar'
    ? `${Number(value)
      .toFixed(2)
      .replace('.', ',')} ر.س`
    : `${Number(value).toFixed(2)} SAR`;
}

function App() {
  const [store, setStore] =
    useState(emptyStore);

  const [prefs, setPrefs] =
    useState(loadPreferences);

  const [view, setView] =
    useState(
      location.hash === '#admin'
        ? 'admin'
        : 'home'
    );

  const [search, setSearch] =
    useState('');

  const [category, setCategory] =
    useState('all');

  const [slide, setSlide] =
    useState(0);

  const [
    selectedProduct,
    setSelectedProduct,
  ] = useState(null);

  const [
    selectedOrderId,
    setSelectedOrderId,
  ] = useState(null);

  const [toast, setToast] =
    useState('');

  const [
    checkout,
    setCheckout,
  ] = useState({
    notes: '',
  });

  const [
    selectedAddressId,
    setSelectedAddressId,
  ] = useState(null);

  const [
    orderLoading,
    setOrderLoading,
  ] = useState(false);

  const [
    sellerForm,
    setSellerForm,
  ] = useState({
    storeName: '',
    phone: '',
    category: 'food',
  });

  const [
    selectedSellerProduct,
    setSelectedSellerProduct,
  ] = useState(null);

  const [
    selectedSellerOrderId,
    setSelectedSellerOrderId,
  ] = useState(null);

  const [
    homeLoading,
    setHomeLoading,
  ] = useState(true);

  const [
    homeError,
    setHomeError,
  ] = useState('');

  /*
  |--------------------------------------------------------------------------
  | Authentication
  |--------------------------------------------------------------------------
  */

  const [
    currentUser,
    setCurrentUser,
  ] = useState(null);

  const [
    authForm,
    setAuthForm,
  ] = useState({
    email: '',
    password: '',
  });

  const [
    authLoading,
    setAuthLoading,
  ] = useState(false);

  const [
    authChecking,
    setAuthChecking,
  ] = useState(true);

  /*
  |--------------------------------------------------------------------------
  | Language / Theme
  |--------------------------------------------------------------------------
  */

  const lang = prefs.lang;

  const t = translations[lang];

  const dir =
    lang === 'ar'
      ? 'rtl'
      : 'ltr';

  const {
    favoriteIds,
    favoritesLoading,
    toggleFavorite,
  } = useFavorites({
    api,
    currentUser,
    lang,
    showToast,
    go,
  });

  const {
    cartItems: apiCartItems,
    cartCount,
    cartTotal,
    cartLoading,
    addToCart,
    changeCartQuantity,
    removeFromCart,
    clearCart,
    reloadCart,
  } = useCart({
    api,
    currentUser,
    lang,
    showToast,
    go,
  });

  const {
    addresses,
    addressesLoading,
    defaultAddress,
    createAddress,
    updateAddress,
    setDefaultAddress,
    deleteAddress,
  } = useAddresses({
    api,
    currentUser,
    lang,
    showToast,
  });

  const {
    orders,
    ordersLoading,
    reloadOrders,
  } = useOrders({
    api,
    currentUser,
  });

  const {
    notifications,
    unreadCount,
    notificationsLoading,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    refreshNotifications,
  } = useNotifications({
    api,
    currentUser,
  });

  useEffect(() => {
    if (!currentUser) {
      setSelectedAddressId(null);
      return;
    }

    if (!addresses.length) {
      setSelectedAddressId(null);
      return;
    }

    const selectedStillExists =
      addresses.some(
        (address) =>
          Number(address.id) ===
          Number(selectedAddressId)
      );

    if (!selectedStillExists) {
      setSelectedAddressId(
        Number(
          defaultAddress?.id ||
          addresses[0].id
        )
      );
    }
  }, [
    currentUser,
    addresses,
    defaultAddress,
    selectedAddressId,
  ]);

  useEffect(() => {
    document.documentElement.lang =
      lang;

    document.documentElement.dir =
      dir;

    document.documentElement.dataset.theme =
      prefs.theme;

    savePreferences(prefs);
  }, [
    prefs,
    lang,
    dir,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Load Home
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadHome();
  }, []);

  async function loadHome() {
    setHomeLoading(true);
    setHomeError('');

    try {
      const response =
        await api.getHome();

      setStore(
        mapHomeResponse(
          response?.data || {}
        )
      );

      setSlide(0);
    } catch (error) {
      console.error(
        'Home API error:',
        error
      );

      setStore(emptyStore);

      setHomeError(
        lang === 'ar'
          ? 'تعذر تحميل بيانات المتجر من الخادم.'
          : 'Could not load store data from the server.'
      );
    } finally {
      setHomeLoading(false);
    }
  }

  useEffect(() => {
    restoreLogin();
  }, []);

  async function restoreLogin() {
    const token =
      getAccessToken();

    if (!token) {
      setAuthChecking(false);
      return;
    }

    try {
      const response =
        await api.me();

      const user =
        response?.user ||
        response?.data ||
        response;

      setCurrentUser(user);
    } catch (error) {
      console.error(
        'Restore login error:',
        error
      );

      setAccessToken(null);
      setCurrentUser(null);
    } finally {
      setAuthChecking(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Slider
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (
      !store.slides.length ||
      view !== 'home'
    ) {
      return;
    }

    const id =
      setInterval(() => {
        setSlide(
          (current) =>
            (
              current + 1
            ) %
            store.slides.length
        );
      }, 5500);

    return () =>
      clearInterval(id);
  }, [
    store.slides.length,
    view,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Cart / Favorites
  |--------------------------------------------------------------------------
  */

  const cartItems =
    useMemo(() => {
      return apiCartItems
        .map((item) => {
          const rawProduct =
            item.product || {};

          const productId =
            Number(rawProduct.id);

          const homeProduct =
            store.products.find(
              (product) =>
                product.id ===
                productId
            );

          if (homeProduct) {
            return {
              ...item,
              product: homeProduct,
            };
          }

          const productCategory =
            store.categories.find(
              (categoryItem) =>
                categoryItem.id ===
                Number(
                  rawProduct.category_id
                )
            );

          return {
            ...item,

            product: {
              id: productId,

              category:
                rawProduct.category_id == null
                  ? null
                  : Number(
                      rawProduct.category_id
                    ),

              sellerId:
                rawProduct.seller_id == null
                  ? null
                  : Number(
                      rawProduct.seller_id
                    ),

              nameAr:
                rawProduct.name_ar ||
                '',

              nameEn:
                rawProduct.name_en ||
                '',

              descriptionAr:
                rawProduct.description_ar ||
                '',

              descriptionEn:
                rawProduct.description_en ||
                '',

              price:
                Number(
                  rawProduct.price ??
                  item.unitPrice ??
                  PRICE
                ),

              stock:
                Number(
                  rawProduct.stock || 0
                ),

              image:
                rawProduct.image ||
                productCategory?.image ||
                '',

              featured:
                Boolean(
                  rawProduct.is_featured
                ),
            },
          };
        })
        .filter(
          (item) =>
            item.product?.id
        );
    }, [
      apiCartItems,
      store.products,
      store.categories,
    ]);

  const favoriteProducts =
    store.products.filter(
      (product) =>
        favoriteIds.includes(
          product.id
        )
    );

  /*
  |--------------------------------------------------------------------------
  | Product Search
  |--------------------------------------------------------------------------
  */

  const filteredProducts =
    useMemo(() => {
      const q =
        search
          .trim()
          .toLowerCase();

      return store.products.filter(
        (product) => {
          const matchesCategory =
            category === 'all' ||
            product.category ===
            category;

          const haystack =
            `${product.nameAr
              } ${product.nameEn
              } ${product.descriptionAr
              } ${product.descriptionEn
              }`
              .toLowerCase();

          return (
            matchesCategory &&
            (
              !q ||
              haystack.includes(q)
            )
          );
        }
      );
    }, [
      store.products,
      search,
      category,
    ]);

  /*
  |--------------------------------------------------------------------------
  | Helpers
  |--------------------------------------------------------------------------
  */

  function showToast(message) {
    setToast(message);

    window.clearTimeout(
      showToast.timer
    );

    showToast.timer =
      window.setTimeout(
        () => setToast(''),
        2200
      );
  }

  function go(next) {
    if (
      next === 'admin' &&
      currentUser?.role !== 'admin'
    ) {
      showToast(
        lang === 'ar'
          ? 'لوحة الإدارة متاحة لحساب المدير فقط'
          : 'Admin dashboard is available to administrators only'
      );

      setView(
        currentUser
          ? 'settings'
          : 'login'
      );

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });

      return;
    }

    if (
      [
        'seller-dashboard',
        'seller-products',
        'seller-product-form',
        'seller-orders',
        'seller-order-details',
        'seller-profile',
      ].includes(next) &&
      currentUser?.role !== 'seller'
    ) {
      showToast(
        lang === 'ar'
          ? 'هذه الصفحة متاحة لحسابات البائعين فقط'
          : 'This page is available to seller accounts only'
      );

      setView(
        currentUser
          ? 'settings'
          : 'login'
      );

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });

      return;
    }

    if (
      next === 'notifications' &&
      currentUser
    ) {
      refreshNotifications();
    }

    setView(next);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  function openOrderDetails(orderId) {
    setSelectedOrderId(
      Number(orderId)
    );

    go('order-details');
  }

  /*
  |--------------------------------------------------------------------------
  | Login
  |--------------------------------------------------------------------------
  */

  async function signIn(event) {
    event.preventDefault();

    if (
      !authForm.email ||
      !authForm.password
    ) {
      showToast(
        lang === 'ar'
          ? 'أدخل البريد الإلكتروني وكلمة المرور'
          : 'Enter email and password'
      );

      return;
    }

    setAuthLoading(true);

    try {
      const response =
        await api.login({
          email:
            authForm.email,

          password:
            authForm.password,

          device_name:
            'All 5.75 Web',
        });

      if (!response?.token) {
        throw new Error(
          lang === 'ar'
            ? 'لم يتم استلام رمز تسجيل الدخول'
            : 'Login token was not returned'
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Store access token
      |--------------------------------------------------------------------------
      */

      setAccessToken(
        response.token
      );

      let user =
        response?.user ||
        null;

      /*
      |--------------------------------------------------------------------------
      | Verify user using /me
      |--------------------------------------------------------------------------
      */

      try {
        const meResponse =
          await api.me();

        user =
          meResponse?.user ||
          meResponse?.data ||
          meResponse ||
          user;
      } catch (error) {
        console.warn(
          'Could not load /me:',
          error
        );
      }

      setCurrentUser(user);

      setAuthForm({
        email: '',
        password: '',
      });

      showToast(
        lang === 'ar'
          ? 'تم تسجيل الدخول بنجاح'
          : 'Signed in successfully'
      );

      go(
        user?.role === 'admin'
          ? 'admin'
          : user?.role === 'seller'
            ? 'seller-dashboard'
            : 'settings'
      );
    } catch (error) {
      console.error(
        'Login error:',
        error
      );

      setAccessToken(null);

      setCurrentUser(null);

      showToast(
        error?.message ||
        (
          lang === 'ar'
            ? 'تعذر تسجيل الدخول'
            : 'Could not sign in'
        )
      );
    } finally {
      setAuthLoading(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Logout
  |--------------------------------------------------------------------------
  */

  async function signOut() {
    try {
      await api.logout();
    } catch (error) {
      console.warn(
        'Logout API error:',
        error
      );
    }

    setAccessToken(null);

    setCurrentUser(null);

    showToast(
      lang === 'ar'
        ? 'تم تسجيل الخروج'
        : 'Signed out'
    );

    go('home');
  }

  /*
  |--------------------------------------------------------------------------
  | Checkout
  |--------------------------------------------------------------------------
  */

  async function placeOrder(
    event
  ) {
    event.preventDefault();

    if (!currentUser) {
      showToast(
        lang === 'ar'
          ? 'سجل الدخول أولاً لإكمال الطلب'
          : 'Sign in first to complete your order'
      );

      go('login');
      return;
    }

    if (cartCount === 0) {
      showToast(
        lang === 'ar'
          ? 'السلة فارغة'
          : 'Your cart is empty'
      );

      return;
    }

    if (!selectedAddressId) {
      showToast(
        lang === 'ar'
          ? 'اختر عنوان التوصيل أولاً'
          : 'Choose a delivery address first'
      );

      return;
    }

    setOrderLoading(true);

    try {
      const response =
        await api.createOrder({
          address_id:
            Number(
              selectedAddressId
            ),

          customer_notes:
            checkout.notes.trim() ||
            null,
        });

      const createdOrder =
        response?.data ||
        response;

      if (createdOrder?.id) {
        const normalizedOrder = {
          ...createdOrder,

          number:
            createdOrder.order_number ||
            createdOrder.number ||
            createdOrder.id,

          total:
            Number(
              createdOrder.total ||
              0
            ),
        };

        setStore(
          (current) => ({
            ...current,

            orders: [
              normalizedOrder,
              ...current.orders.filter(
                (order) =>
                  Number(order.id) !==
                  Number(
                    normalizedOrder.id
                  )
              ),
            ],
          })
        );
      }

      await reloadCart();
      await reloadOrders();

      setCheckout({
        notes: '',
      });

      const orderNumber =
        createdOrder?.order_number ||
        createdOrder?.number ||
        '';

      showToast(
        lang === 'ar'
          ? `تم إنشاء الطلب ${orderNumber}`
          : `Order ${orderNumber} created`
      );

      go('orders');
    } catch (error) {
      console.error(
        'Checkout error:',
        error
      );

      showToast(
        error?.message ||
        (
          lang === 'ar'
            ? 'تعذر إنشاء الطلب'
            : 'Could not create the order'
        )
      );
    } finally {
      setOrderLoading(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Seller Application
  |--------------------------------------------------------------------------
  */

  async function submitSeller(
    event
  ) {
    event.preventDefault();

    if (
      !sellerForm.storeName ||
      !sellerForm.phone
    ) {
      showToast(
        lang === 'ar'
          ? 'أكمل بيانات المتجر'
          : 'Complete store details'
      );

      return;
    }

    const application = {
      id:
        Date.now(),

      ...sellerForm,

      status:
        'pending',

      createdAt:
        new Date()
          .toISOString(),
    };

    if (shouldUseApi()) {
      try {
        await api
          .createSellerApplication(
            application
          );
      } catch (error) {
        console.error(
          'Seller application error:',
          error
        );

        showToast(
          lang === 'ar'
            ? 'تعذر إرسال الطلب'
            : 'Could not send application'
        );

        return;
      }
    } else {
      setStore(
        (current) => ({
          ...current,

          sellerApplications: [
            application,
            ...current
              .sellerApplications,
          ],
        })
      );
    }

    setSellerForm({
      storeName: '',
      phone: '',
      category: 'food',
    });

    showToast(
      t.applicationSent
    );

    go('settings');
  }

  /*
  |--------------------------------------------------------------------------
  | Navigation
  |--------------------------------------------------------------------------
  */

  const nav = [
    [
      'home',
      'home',
      t.home,
    ],

    [
      'categories',
      'grid',
      t.categories,
    ],

    [
      'favorites',
      'heart',
      t.favorites,
    ],

    [
      'cart',
      'cart',
      t.cart,
    ],

    [
      'settings',
      'settings',
      t.settings,
    ],
  ];

  /*
  |--------------------------------------------------------------------------
  | Admin Screen
  |--------------------------------------------------------------------------
  */

  if (
    view === 'admin' ||
    view === 'admin-seller-applications' ||
    view === 'admin-products' ||
    view === 'admin-orders'
  ) {
    if (authChecking) {
      return (
        <div
          className="app-shell"
          dir={dir}
        >
          <main className="main-content">
            <div className="empty-state">
              <strong>
                {lang === 'ar'
                  ? 'جاري التحقق من الحساب...'
                  : 'Checking account...'}
              </strong>
            </div>
          </main>
        </div>
      );
    }

    if (currentUser?.role !== 'admin') {
      return (
        <div
          className="app-shell"
          dir={dir}
        >
          <main className="main-content">
            <Page
              title={
                lang === 'ar'
                  ? 'لوحة الإدارة'
                  : 'Admin Dashboard'
              }
            >
              <div className="checkout-card">
                <p className="page-lead">
                  {lang === 'ar'
                    ? 'هذه الصفحة متاحة لحساب المدير فقط.'
                    : 'This page is available to administrator accounts only.'}
                </p>

                <button
                  className="primary-btn"
                  type="button"
                  onClick={() =>
                    setView(
                      currentUser
                        ? 'settings'
                        : 'login'
                    )
                  }
                >
                  {lang === 'ar'
                    ? 'العودة'
                    : 'Go back'}
                </button>
              </div>
            </Page>
          </main>
        </div>
      );
    }

    if (
      view ===
      'admin-seller-applications'
    ) {
      return (
        <div
          className="app-shell"
          dir={dir}
        >
          <AdminSellerApplicationsPage
            lang={lang}
            api={api}
            showToast={showToast}
            onBack={() =>
              go('admin')
            }
          />

          <div
            className={
              `toast ${toast
                ? 'show'
                : ''
              }`
            }
          >
            {toast}
          </div>
        </div>
      );
    }

    if (
      view ===
      'admin-products'
    ) {
      return (
        <div
          className="app-shell"
          dir={dir}
        >
          <AdminProductsPage
            lang={lang}
            api={api}
            categories={store.categories}
            sellers={store.sellers}
            showToast={showToast}
            onBack={() =>
              go('admin')
            }
          />

          <div
            className={
              `toast ${toast
                ? 'show'
                : ''
              }`
            }
          >
            {toast}
          </div>
        </div>
      );
    }

    if (
      view ===
      'admin-orders'
    ) {
      return (
        <div
          className="app-shell"
          dir={dir}
        >
          <AdminOrdersPage
            lang={lang}
            api={api}
            showToast={showToast}
            onBack={() =>
              go('admin')
            }
          />

          <div
            className={
              `toast ${toast
                ? 'show'
                : ''
              }`
            }
          >
            {toast}
          </div>
        </div>
      );
    }

    return (
      <div
        className="app-shell"
        dir={dir}
      >
        <AdminDashboardPage
          lang={lang}
          api={api}
          showToast={showToast}
          onOpenOrders={() =>
            go('admin-orders')
          }
          onOpenProducts={() =>
            go('admin-products')
          }
          onOpenApplications={() =>
            go(
              'admin-seller-applications'
            )
          }
        />

        <div
          className={
            `toast ${toast
              ? 'show'
              : ''
            }`
          }
        >
          {toast}
        </div>
      </div>
    );
  }

  const currentSlide =
    store.slides[slide] ||
    store.slides[0];

  /*
  |--------------------------------------------------------------------------
  | Main Customer App
  |--------------------------------------------------------------------------
  */

  return (
    <div className="app-shell">

      <header className="topbar">

        <div
          className="brand-wrap"
          onClick={() =>
            go('home')
          }
          role="button"
          tabIndex="0"
        >
          <div className="brand-mark">
            5,75
          </div>

          <div>
            <strong>
              {lang === 'ar'
                ? store
                  .storeSettings
                  .nameAr
                : store
                  .storeSettings
                  .nameEn}
            </strong>

            <span>
              {t.fixedPrice}
            </span>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <button
            type="button"
            onClick={() =>
              currentUser
                ? go('notifications')
                : go('login')
            }
            aria-label={
              lang === 'ar'
                ? 'الإشعارات'
                : 'Notifications'
            }
            style={{
              position: 'relative',
              width: 44,
              height: 44,
              flex: '0 0 44px',
              display: 'grid',
              placeItems: 'center',
              borderRadius: 14,
              border: '1px solid var(--edge, rgba(0,0,0,.08))',
              background: 'var(--card, #fff)',
              color: 'inherit',
              cursor: 'pointer',
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>

            {currentUser &&
              unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -5,
                    insetInlineEnd: -5,
                    minWidth: 20,
                    height: 20,
                    padding: '0 5px',
                    borderRadius: 999,
                    display: 'grid',
                    placeItems: 'center',
                    background: '#dc2626',
                    color: '#fff',
                    border: '2px solid var(--paper, #fff)',
                    fontSize: 10,
                    fontWeight: 900,
                    lineHeight: 1,
                  }}
                >
                  {unreadCount > 99
                    ? '99+'
                    : unreadCount}
                </span>
              )}
          </button>

          <button
            className="orders-shortcut"
            onClick={() =>
              go('orders')
            }
          >
            <Icon
              name="orders"
              size={19}
            />

            <span>
              {t.orders}
            </span>
          </button>
        </div>

      </header>

      <main className="main-content">

        {/* HOME */}

        {view === 'home' && (
          <>
            {homeLoading && (
              <div className="empty-state">
                <strong>
                  {lang === 'ar'
                    ? 'جاري تحميل المتجر...'
                    : 'Loading store...'}
                </strong>
              </div>
            )}

            {!homeLoading &&
              homeError && (
                <Empty
                  title={
                    homeError
                  }
                  button={
                    lang === 'ar'
                      ? 'إعادة المحاولة'
                      : 'Try again'
                  }
                  onClick={
                    loadHome
                  }
                />
              )}

            {!homeLoading &&
              !homeError && (
                <>
                  {currentSlide && (
                    <section className="hero-section">

                      <div
                        className={
                          `hero-card tone-${currentSlide.tone
                          }`
                        }
                      >

                        <div className="hero-copy">

                          <span className="eyebrow">
                            {money(
                              lang,
                              store
                                .storeSettings
                                .productPrice ??
                              PRICE
                            )}
                          </span>

                          <h1>
                            {lang === 'ar'
                              ? currentSlide.titleAr
                              : currentSlide.titleEn}
                          </h1>

                          <p>
                            {lang === 'ar'
                              ? currentSlide.textAr
                              : currentSlide.textEn}
                          </p>

                          {(
                            lang === 'ar'
                              ? currentSlide.ctaAr
                              : currentSlide.ctaEn
                          ) && (
                              <button
                                onClick={() =>
                                  go(
                                    currentSlide.action
                                  )
                                }
                              >
                                {lang === 'ar'
                                  ? currentSlide.ctaAr
                                  : currentSlide.ctaEn}
                              </button>
                            )}

                        </div>

                        <img
                          src={
                            currentSlide.image
                          }
                          alt=""
                        />

                      </div>

                      {store.slides.length >
                        1 && (
                          <div className="dots">
                            {store.slides.map(
                              (
                                _,
                                index
                              ) => (
                                <button
                                  key={
                                    index
                                  }
                                  className={
                                    index ===
                                      slide
                                      ? 'active'
                                      : ''
                                  }
                                  onClick={() =>
                                    setSlide(
                                      index
                                    )
                                  }
                                  aria-label={
                                    `Slide ${index +
                                    1
                                    }`
                                  }
                                />
                              )
                            )}
                          </div>
                        )}

                    </section>
                  )}

                  <Search
                    value={
                      search
                    }
                    onChange={
                      setSearch
                    }
                    t={t}
                  />

                  <Section
                    title={
                      t.shopByCategory
                    }
                    action={
                      t.viewAll
                    }
                    onAction={() =>
                      go(
                        'categories'
                      )
                    }
                  >
                    <div className="category-strip">

                      {store.categories.map(
                        (item) => (
                          <CategoryCard
                            key={
                              item.id
                            }
                            item={
                              item
                            }
                            lang={
                              lang
                            }
                            onClick={() => {
                              setCategory(
                                item.id
                              );

                              go(
                                'categories'
                              );
                            }}
                          />
                        )
                      )}

                    </div>
                  </Section>

                  <Section
                    title={
                      t.sellers
                    }
                  >
                    <div className="seller-strip">

                      {store.sellers.map(
                        (
                          seller
                        ) => (
                          <SellerCard
                            key={
                              seller.id
                            }
                            seller={
                              seller
                            }
                            lang={
                              lang
                            }
                          />
                        )
                      )}

                    </div>
                  </Section>

                  <Section
                    title={
                      t.picks
                    }
                  >
                    <div className="product-grid">

                      {filteredProducts
                        .slice(
                          0,
                          6
                        )
                        .map(
                          (
                            product
                          ) => (
                            <ProductCard
                              key={
                                product.id
                              }
                              product={
                                product
                              }
                              lang={
                                lang
                              }
                              t={t}
                              favorite={
                                favoriteIds.includes(
                                  product.id
                                )
                              }
                              toggleFavorite={
                                toggleFavorite
                              }
                              addToCart={
                                addToCart
                              }
                              open={() =>
                                setSelectedProduct(
                                  product
                                )
                              }
                            />
                          )
                        )}

                    </div>
                  </Section>
                </>
              )}
          </>
        )}

        {/* CATEGORIES */}

        {view ===
          'categories' && (
            <Page
              title={
                t.categories
              }
            >

              <Search
                value={search}
                onChange={
                  setSearch
                }
                t={t}
              />

              <div className="category-filter">

                <button
                  className={
                    category ===
                      'all'
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    setCategory(
                      'all'
                    )
                  }
                >
                  {lang === 'ar'
                    ? 'الكل'
                    : 'All'}
                </button>

                {store.categories.map(
                  (item) => (
                    <button
                      key={
                        item.id
                      }
                      className={
                        category ===
                          item.id
                          ? 'active'
                          : ''
                      }
                      onClick={() =>
                        setCategory(
                          item.id
                        )
                      }
                    >
                      {lang === 'ar'
                        ? item.nameAr
                        : item.nameEn}
                    </button>
                  )
                )}

              </div>

              <div className="product-grid">

                {filteredProducts.map(
                  (product) => (
                    <ProductCard
                      key={
                        product.id
                      }
                      product={
                        product
                      }
                      lang={
                        lang
                      }
                      t={t}
                      favorite={
                        favoriteIds.includes(
                          product.id
                        )
                      }
                      toggleFavorite={
                        toggleFavorite
                      }
                      addToCart={
                        addToCart
                      }
                      open={() =>
                        setSelectedProduct(
                          product
                        )
                      }
                    />
                  )
                )}

              </div>

            </Page>
          )}

        {/* FAVORITES */}

        {view ===
          'favorites' && (
            <Page
              title={
                t.favorites
              }
            >
              {favoriteProducts.length ? (
                <div className="product-grid">

                  {favoriteProducts.map(
                    (
                      product
                    ) => (
                      <ProductCard
                        key={
                          product.id
                        }
                        product={
                          product
                        }
                        lang={
                          lang
                        }
                        t={t}
                        favorite
                        toggleFavorite={
                          toggleFavorite
                        }
                        addToCart={
                          addToCart
                        }
                        open={() =>
                          setSelectedProduct(
                            product
                          )
                        }
                      />
                    )
                  )}

                </div>
              ) : (
                <Empty
                  title={
                    t.emptyFavorites
                  }
                  button={
                    t.browse
                  }
                  onClick={() =>
                    go(
                      'categories'
                    )
                  }
                />
              )}
            </Page>
          )}

        {/* CART */}

        {view === 'cart' && (
          <Page
            title={
              t.cart
            }
          >

            {cartLoading ? (
              <div className="empty-state">
                <strong>
                  {lang === 'ar'
                    ? 'جاري تحميل السلة...'
                    : 'Loading cart...'}
                </strong>
              </div>
            ) : cartItems.length ? (
              <div className="cart-layout">

                <div className="cart-list">

                  {cartItems.map(
                    ({
                      product,
                      qty,
                    }) => (
                      <div
                        className="cart-row card-corner"
                        key={
                          product.id
                        }
                      >

                        <img
                          src={
                            product.image
                          }
                          alt=""
                        />

                        <div className="cart-copy">

                          <strong>
                            {lang === 'ar'
                              ? product.nameAr
                              : product.nameEn}
                          </strong>

                          <span>
                            {money(
                              lang,
                              product.price ??
                              PRICE
                            )}
                          </span>

                          <div className="qty">

                            <button
                              onClick={() =>
                                changeCartQuantity(
                                  product.id,
                                  qty - 1
                                )
                              }
                            >
                              −
                            </button>

                            <b>
                              {qty}
                            </b>

                            <button
                              onClick={() =>
                                changeCartQuantity(
                                  product.id,
                                  qty + 1
                                )
                              }
                            >
                              +
                            </button>

                          </div>

                        </div>

                      </div>
                    )
                  )}

                </div>

                <aside className="summary-card">

                  <span>
                    {t.total}
                  </span>

                  <strong>
                    {money(
                      lang,
                      cartTotal
                    )}
                  </strong>

                  <button
                    onClick={() =>
                      go(
                        'checkout'
                      )
                    }
                  >
                    {t.checkout}
                  </button>

                </aside>

              </div>
            ) : (
              <Empty
                title={
                  t.emptyCart
                }
                button={
                  t.browse
                }
                onClick={() =>
                  go(
                    'categories'
                  )
                }
              />
            )}

          </Page>
        )}

        {/* CHECKOUT */}

        {view ===
          'checkout' && (
            <Page
              title={
                t.checkoutTitle
              }
            >

              {!currentUser ? (
                <Empty
                  title={
                    lang === 'ar'
                      ? 'سجل الدخول لإكمال الطلب'
                      : 'Sign in to complete your order'
                  }
                  button={
                    lang === 'ar'
                      ? 'تسجيل الدخول'
                      : 'Sign in'
                  }
                  onClick={() =>
                    go('login')
                  }
                />
              ) : addressesLoading ? (
                <div className="empty-state">
                  <strong>
                    {lang === 'ar'
                      ? 'جاري تحميل العناوين...'
                      : 'Loading addresses...'}
                  </strong>
                </div>
              ) : !addresses.length ? (
                <Empty
                  title={
                    lang === 'ar'
                      ? 'أضف عنوان توصيل أولاً'
                      : 'Add a delivery address first'
                  }
                  button={
                    lang === 'ar'
                      ? 'إضافة عنوان'
                      : 'Add address'
                  }
                  onClick={() =>
                    go('addresses')
                  }
                />
              ) : (
                <form
                  className="checkout-card"
                  onSubmit={
                    placeOrder
                  }
                >

                  <h3>
                    {lang === 'ar'
                      ? 'عنوان التوصيل'
                      : 'Delivery address'}
                  </h3>

                  <div
                    className="settings-grid"
                    style={{
                      marginTop: 0,
                    }}
                  >
                    {addresses.map(
                      (address) => (
                        <label
                          key={
                            address.id
                          }
                          className="setting-card"
                          style={{
                            cursor:
                              'pointer',
                            alignItems:
                              'flex-start',
                          }}
                        >
                          <input
                            type="radio"
                            name="checkout-address"
                            checked={
                              Number(
                                selectedAddressId
                              ) ===
                              Number(
                                address.id
                              )
                            }
                            onChange={() =>
                              setSelectedAddressId(
                                Number(
                                  address.id
                                )
                              )
                            }
                          />

                          <div
                            style={{
                              flex: 1,
                            }}
                          >
                            <strong>
                              {address.name}
                            </strong>

                            <span
                              style={{
                                display:
                                  'block',
                                marginTop: 4,
                              }}
                            >
                              {address.phone}
                            </span>

                            <span
                              style={{
                                display:
                                  'block',
                                marginTop: 4,
                              }}
                            >
                              {[
                                address.city,
                                address.district,
                                address.street,
                                address.building
                                  ? (
                                      lang === 'ar'
                                        ? `مبنى ${address.building}`
                                        : `Building ${address.building}`
                                    )
                                  : null,
                              ]
                                .filter(Boolean)
                                .join(' - ')}
                            </span>

                            {Boolean(
                              address.is_default
                            ) && (
                              <small>
                                {lang === 'ar'
                                  ? 'العنوان الافتراضي'
                                  : 'Default address'}
                              </small>
                            )}
                          </div>
                        </label>
                      )
                    )}
                  </div>

                  <button
                    type="button"
                    className="auth-secondary-btn"
                    onClick={() =>
                      go('addresses')
                    }
                  >
                    {lang === 'ar'
                      ? 'إدارة العناوين'
                      : 'Manage addresses'}
                  </button>

                  <label className="field">

                    <span>
                      {t.notes}
                    </span>

                    <textarea
                      value={
                        checkout.notes
                      }
                      onChange={
                        (event) =>
                          setCheckout({
                            ...checkout,
                            notes:
                              event
                                .target
                                .value,
                          })
                      }
                    />

                  </label>

                  <div className="payment-box">

                    <span>
                      {t.payment}
                    </span>

                    <strong>
                      {t.cod}
                    </strong>

                  </div>

                  <div className="checkout-total">

                    <span>
                      {t.total}
                    </span>

                    <strong>
                      {money(
                        lang,
                        cartTotal
                      )}
                    </strong>

                  </div>

                  <button
                    className="primary-btn"
                    type="submit"
                    disabled={
                      orderLoading ||
                      cartCount === 0 ||
                      !selectedAddressId
                    }
                  >
                    {orderLoading
                      ? (
                          lang === 'ar'
                            ? 'جاري إنشاء الطلب...'
                            : 'Creating order...'
                        )
                      : t.placeOrder}
                  </button>

                </form>
              )}

            </Page>
          )}

        {/* ORDERS */}

        {view ===
          'orders' && (
            <Page
              title={
                t.orders
              }
            >

              {ordersLoading ? (
                <div className="empty-state">
                  <strong>
                    {lang === 'ar'
                      ? 'جاري تحميل الطلبات...'
                      : 'Loading orders...'}
                  </strong>
                </div>
              ) : orders.length ? (
                <div className="orders-list">

                  {orders.map(
                    (
                      order
                    ) => (
                      <article
                        className="order-card"
                        key={
                          order.id
                        }
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          openOrderDetails(
                            order.id
                          )
                        }
                        onKeyDown={(event) => {
                          if (
                            event.key === 'Enter' ||
                            event.key === ' '
                          ) {
                            event.preventDefault();
                            openOrderDetails(
                              order.id
                            );
                          }
                        }}
                        style={{
                          cursor: 'pointer',
                        }}
                      >

                        <div>
                          <span>
                            {t.order}
                          </span>

                          <strong>
                            #
                            {order.number ||
                              order.id}
                          </strong>
                        </div>

                        <div>
                          <span>
                            {t.status}
                          </span>

                          <b
                            className={
                              `status ${order.status
                              }`
                            }
                          >
                            {t[
                              order.status
                            ] ||
                              order.status}
                          </b>
                        </div>

                        <div>
                          <span>
                            {t.total}
                          </span>

                          <strong>
                            {money(
                              lang,
                              order.total
                            )}
                          </strong>
                        </div>

                      </article>
                    )
                  )}

                </div>
              ) : (
                <Empty
                  title={
                    t.noOrders
                  }
                  button={
                    t.browse
                  }
                  onClick={() =>
                    go('home')
                  }
                />
              )}

            </Page>
          )}

        {/* ORDER DETAILS */}

        {view === 'order-details' &&
          selectedOrderId && (
            <OrderDetailsPage
              orderId={
                selectedOrderId
              }
              api={api}
              lang={lang}
              showToast={
                showToast
              }
              go={go}
              reloadOrders={
                reloadOrders
              }
            />
          )}

        {/* NOTIFICATIONS */}

        {view === 'notifications' && (
          <NotificationsPage
            lang={lang}
            notifications={notifications}
            unreadCount={unreadCount}
            notificationsLoading={
              notificationsLoading
            }
            markNotificationAsRead={
              markNotificationAsRead
            }
            markAllNotificationsAsRead={
              markAllNotificationsAsRead
            }
            deleteNotification={
              deleteNotification
            }
            showToast={showToast}
            go={go}
          />
        )}

        {/* SELLER DASHBOARD */}

        {view === 'seller-dashboard' && (
          currentUser?.role === 'seller' ? (
            <>
              <div
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
                style={{
                  maxWidth: 720,
                  margin: '14px auto 0',
                  padding: '0 16px',
                  display: 'flex',
                  gap: 10,
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="button"
                  onClick={() => go('seller-products')}
                  style={{
                    border: 0,
                    borderRadius: 14,
                    minHeight: 42,
                    padding: '0 16px',
                    background: '#10985f',
                    color: '#fff',
                    font: 'inherit',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {lang === 'ar'
                    ? 'إدارة المنتجات'
                    : 'Manage products'}
                </button>

                <button
                  type="button"
                  onClick={() => go('seller-orders')}
                  style={{
                    border: '1px solid rgba(16,152,95,.20)',
                    borderRadius: 14,
                    minHeight: 42,
                    padding: '0 16px',
                    background: 'rgba(16,152,95,.06)',
                    color: '#10985f',
                    font: 'inherit',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {lang === 'ar'
                    ? 'طلبات المتجر'
                    : 'Store orders'}
                </button>

                <button
                  type="button"
                  onClick={() => go('seller-profile')}
                  style={{
                    border: '1px solid rgba(16,152,95,.20)',
                    borderRadius: 14,
                    minHeight: 42,
                    padding: '0 16px',
                    background: 'rgba(16,152,95,.06)',
                    color: '#10985f',
                    font: 'inherit',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {lang === 'ar'
                    ? 'ملف البائع'
                    : 'Seller profile'}
                </button>
              </div>

              <SellerDashboardPage
                lang={lang}
                api={api}
                showToast={showToast}
              />
            </>
          ) : (
            <Page
              title={
                lang === 'ar'
                  ? 'لوحة البائع'
                  : 'Seller dashboard'
              }
            >
              <div className="checkout-card">
                <p className="page-lead">
                  {lang === 'ar'
                    ? 'هذه الصفحة متاحة لحسابات البائعين فقط.'
                    : 'This page is available to seller accounts only.'}
                </p>

                <button
                  className="primary-btn"
                  type="button"
                  onClick={() =>
                    currentUser
                      ? go('settings')
                      : go('login')
                  }
                >
                  {lang === 'ar'
                    ? 'العودة'
                    : 'Go back'}
                </button>
              </div>
            </Page>
          )
        )}

        {/* SELLER PRODUCTS */}

        {view === 'seller-products' && (
          currentUser?.role === 'seller' ? (
            <SellerProductsPage
              lang={lang}
              api={api}
              showToast={showToast}
              onAddProduct={() => {
                setSelectedSellerProduct(null);
                go('seller-product-form');
              }}
              onEditProduct={(product) => {
                setSelectedSellerProduct(product);
                go('seller-product-form');
              }}
            />
          ) : (
            <Page
              title={
                lang === 'ar'
                  ? 'منتجات البائع'
                  : 'Seller products'
              }
            >
              <div className="checkout-card">
                <p className="page-lead">
                  {lang === 'ar'
                    ? 'هذه الصفحة متاحة لحسابات البائعين فقط.'
                    : 'This page is available to seller accounts only.'}
                </p>

                <button
                  className="primary-btn"
                  type="button"
                  onClick={() =>
                    currentUser
                      ? go('settings')
                      : go('login')
                  }
                >
                  {lang === 'ar'
                    ? 'العودة'
                    : 'Go back'}
                </button>
              </div>
            </Page>
          )
        )}

        {/* SELLER PRODUCT FORM */}

        {view === 'seller-product-form' && (
          currentUser?.role === 'seller' ? (
            <SellerProductFormPage
              lang={lang}
              api={api}
              categories={store.categories}
              product={selectedSellerProduct}
              showToast={showToast}
              onSaved={() => {
                setSelectedSellerProduct(null);
                go('seller-products');
              }}
              onCancel={() => {
                setSelectedSellerProduct(null);
                go('seller-products');
              }}
            />
          ) : (
            <Page
              title={
                lang === 'ar'
                  ? 'منتج البائع'
                  : 'Seller product'
              }
            >
              <div className="checkout-card">
                <p className="page-lead">
                  {lang === 'ar'
                    ? 'هذه الصفحة متاحة لحسابات البائعين فقط.'
                    : 'This page is available to seller accounts only.'}
                </p>

                <button
                  className="primary-btn"
                  type="button"
                  onClick={() =>
                    currentUser
                      ? go('settings')
                      : go('login')
                  }
                >
                  {lang === 'ar'
                    ? 'العودة'
                    : 'Go back'}
                </button>
              </div>
            </Page>
          )
        )}

        {/* SELLER ORDERS */}

        {view === 'seller-orders' && (
          currentUser?.role === 'seller' ? (
            <SellerOrdersPage
              lang={lang}
              api={api}
              showToast={showToast}
              onOpenOrder={(order) => {
                setSelectedSellerOrderId(order.id);
                go('seller-order-details');
              }}
            />
          ) : (
            <Page
              title={
                lang === 'ar'
                  ? 'طلبات المتجر'
                  : 'Store orders'
              }
            >
              <div className="checkout-card">
                <p className="page-lead">
                  {lang === 'ar'
                    ? 'هذه الصفحة متاحة لحسابات البائعين فقط.'
                    : 'This page is available to seller accounts only.'}
                </p>

                <button
                  className="primary-btn"
                  type="button"
                  onClick={() =>
                    currentUser
                      ? go('settings')
                      : go('login')
                  }
                >
                  {lang === 'ar'
                    ? 'العودة'
                    : 'Go back'}
                </button>
              </div>
            </Page>
          )
        )}

        {/* SELLER ORDER DETAILS */}

        {view === 'seller-order-details' && (
          currentUser?.role === 'seller' &&
          selectedSellerOrderId ? (
            <SellerOrderDetailsPage
              orderId={selectedSellerOrderId}
              lang={lang}
              api={api}
              showToast={showToast}
              onBack={() => {
                setSelectedSellerOrderId(null);
                go('seller-orders');
              }}
            />
          ) : (
            <Page
              title={
                lang === 'ar'
                  ? 'تفاصيل طلب البائع'
                  : 'Seller order details'
              }
            >
              <div className="checkout-card">
                <p className="page-lead">
                  {lang === 'ar'
                    ? 'هذه الصفحة متاحة لحسابات البائعين فقط.'
                    : 'This page is available to seller accounts only.'}
                </p>

                <button
                  className="primary-btn"
                  type="button"
                  onClick={() => {
                    setSelectedSellerOrderId(null);
                    currentUser
                      ? go('settings')
                      : go('login');
                  }}
                >
                  {lang === 'ar'
                    ? 'العودة'
                    : 'Go back'}
                </button>
              </div>
            </Page>
          )
        )}

        {/* SELLER PROFILE */}

        {view === 'seller-profile' && (
          currentUser?.role === 'seller' ? (
            <SellerProfilePage
              lang={lang}
              api={api}
              showToast={showToast}
              onBack={() => go('seller-dashboard')}
            />
          ) : (
            <Page
              title={
                lang === 'ar'
                  ? 'ملف البائع'
                  : 'Seller profile'
              }
            >
              <div className="checkout-card">
                <p className="page-lead">
                  {lang === 'ar'
                    ? 'هذه الصفحة متاحة لحسابات البائعين فقط.'
                    : 'This page is available to seller accounts only.'}
                </p>

                <button
                  className="primary-btn"
                  type="button"
                  onClick={() =>
                    currentUser
                      ? go('settings')
                      : go('login')
                  }
                >
                  {lang === 'ar'
                    ? 'العودة'
                    : 'Go back'}
                </button>
              </div>
            </Page>
          )
        )}

        {/* LOGIN */}

        {view === 'login' && (
          <Page
            title={
              lang === 'ar'
                ? 'تسجيل الدخول'
                : 'Sign in'
            }
          >

            <form
              className="checkout-card"
              onSubmit={
                signIn
              }
            >

              <p className="page-lead">
                {lang === 'ar'
                  ? 'سجل الدخول للوصول إلى طلباتك وسلتك ومفضلاتك.'
                  : 'Sign in to access your orders, cart and favorites.'}
              </p>

              <FormInput
                label={
                  lang === 'ar'
                    ? 'البريد الإلكتروني'
                    : 'Email'
                }
                type="email"
                value={
                  authForm.email
                }
                onChange={
                  (value) =>
                    setAuthForm({
                      ...authForm,
                      email: value,
                    })
                }
              />

              <FormInput
                label={
                  lang === 'ar'
                    ? 'كلمة المرور'
                    : 'Password'
                }
                type="password"
                value={
                  authForm.password
                }
                onChange={
                  (value) =>
                    setAuthForm({
                      ...authForm,
                      password: value,
                    })
                }
              />

              <button
                className="primary-btn"
                type="submit"
                disabled={
                  authLoading
                }
              >
                {authLoading
                  ? (
                    lang === 'ar'
                      ? 'جاري الدخول...'
                      : 'Signing in...'
                  )
                  : (
                    lang === 'ar'
                      ? 'دخول'
                      : 'Sign in'
                  )}
              </button>

              <button
                type="button"
                className="auth-secondary-btn"
                onClick={() =>
                  go('register')
                }
              >
                {lang === 'ar'
                  ? 'إنشاء حساب جديد'
                  : 'Create a new account'}
              </button>

            </form>

          </Page>
        )}

        {/* REGISTER */}

        {view === 'register' && (
          <RegisterPage
            lang={lang}
            api={api}
            setAccessToken={setAccessToken}
            setCurrentUser={setCurrentUser}
            showToast={showToast}
            go={go}
          />
        )}

        {/* ADDRESSES */}

        {view === 'addresses' && (
          <AddressesPage
            lang={lang}
            currentUser={
              currentUser
            }
            addresses={
              addresses
            }
            addressesLoading={
              addressesLoading
            }
            createAddress={
              createAddress
            }
            updateAddress={
              updateAddress
            }
            setDefaultAddress={
              setDefaultAddress
            }
            deleteAddress={
              deleteAddress
            }
            showToast={
              showToast
            }
            go={go}
          />
        )}

        {/* SETTINGS */}

        {view ===
          'settings' && (
            <Page
              title={
                t.settings
              }
            >

              <section className="settings-grid">

                <div className="profile-card card-corner">

                  <div className="avatar">
                    <Icon
                      name="user"
                    />
                  </div>

                  <div>

                    <strong>
                      {currentUser?.name ||
                        currentUser?.email ||
                        t.guest}
                    </strong>

                    <span>
                      {currentUser?.email ||
                        t.account}
                    </span>

                  </div>

                  {currentUser ? (
                    <button
                      onClick={
                        signOut
                      }
                    >
                      {lang === 'ar'
                        ? 'تسجيل الخروج'
                        : 'Sign out'}
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        go(
                          'login'
                        )
                      }
                    >
                      {t.signIn}
                    </button>
                  )}

                </div>

                <div className="setting-card">

                  <div>
                    <strong>
                      {t.language}
                    </strong>

                    <span>
                      {lang === 'ar'
                        ? 'العربية'
                        : 'English'}
                    </span>
                  </div>

                  <div className="segmented">

                    <button
                      className={
                        lang === 'ar'
                          ? 'active'
                          : ''
                      }
                      onClick={() =>
                        setPrefs({
                          ...prefs,
                          lang:
                            'ar',
                        })
                      }
                    >
                      العربية
                    </button>

                    <button
                      className={
                        lang === 'en'
                          ? 'active'
                          : ''
                      }
                      onClick={() =>
                        setPrefs({
                          ...prefs,
                          lang:
                            'en',
                        })
                      }
                    >
                      English
                    </button>

                  </div>

                </div>

                <div className="setting-card">

                  <div>
                    <strong>
                      {t.appearance}
                    </strong>

                    <span>
                      {prefs.theme ===
                        'light'
                        ? t.light
                        : t.dark}
                    </span>
                  </div>

                  <div className="segmented">

                    <button
                      className={
                        prefs.theme ===
                          'light'
                          ? 'active'
                          : ''
                      }
                      onClick={() =>
                        setPrefs({
                          ...prefs,
                          theme:
                            'light',
                        })
                      }
                    >
                      {t.light}
                    </button>

                    <button
                      className={
                        prefs.theme ===
                          'dark'
                          ? 'active'
                          : ''
                      }
                      onClick={() =>
                        setPrefs({
                          ...prefs,
                          theme:
                            'dark',
                        })
                      }
                    >
                      {t.dark}
                    </button>

                  </div>

                </div>

                <button
                  className="menu-card"
                  onClick={() =>
                    currentUser
                      ? go('notifications')
                      : go('login')
                  }
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: 24,
                      height: 24,
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 18,
                    }}
                  >
                    🔔
                  </span>

                  <div>
                    <strong>
                      {lang === 'ar'
                        ? 'الإشعارات'
                        : 'Notifications'}
                    </strong>

                    <span>
                      {currentUser
                        ? (
                            lang === 'ar'
                              ? `${unreadCount} غير مقروء`
                              : `${unreadCount} unread`
                          )
                        : (
                            lang === 'ar'
                              ? 'سجل الدخول لعرض الإشعارات'
                              : 'Sign in to view notifications'
                          )}
                    </span>
                  </div>
                </button>

                <button
                  className="menu-card"
                  onClick={() =>
                    currentUser
                      ? go('addresses')
                      : go('login')
                  }
                >
                  <Icon
                    name="home"
                  />

                  <div>
                    <strong>
                      {lang === 'ar'
                        ? 'عناويني'
                        : 'My addresses'}
                    </strong>

                    <span>
                      {currentUser
                        ? (
                            lang === 'ar'
                              ? `${addresses.length} عنوان`
                              : `${addresses.length} address${addresses.length === 1 ? '' : 'es'}`
                          )
                        : (
                            lang === 'ar'
                              ? 'سجل الدخول لإدارة العناوين'
                              : 'Sign in to manage addresses'
                          )}
                    </span>
                  </div>
                </button>

                <button
                  className="menu-card"
                  onClick={() =>
                    go('orders')
                  }
                >
                  <Icon
                    name="orders"
                  />

                  <div>
                    <strong>
                      {t.orders}
                    </strong>

                    <span>
                      {orders.length}
                    </span>
                  </div>
                </button>

                {currentUser?.role !== 'admin' && (
                  <button
                    className="menu-card"
                    onClick={() =>
                      currentUser?.role === 'seller'
                        ? go('seller-dashboard')
                        : go('seller-register')
                    }
                  >
                    <Icon
                      name="store"
                    />

                    <div>
                      <strong>
                        {currentUser?.role === 'seller'
                          ? (
                              lang === 'ar'
                                ? 'لوحة البائع'
                                : 'Seller dashboard'
                            )
                          : t.sellerProgram}
                      </strong>

                      <span>
                        {currentUser?.role === 'seller'
                          ? (
                              lang === 'ar'
                                ? 'إدارة متجرك ومبيعاتك'
                                : 'Manage your store and sales'
                            )
                          : t.becomeSeller}
                      </span>
                    </div>
                  </button>
                )}

                {currentUser?.role === 'admin' && (
                  <button
                    className="menu-card"
                    onClick={() =>
                      go('admin')
                    }
                  >
                    <Icon
                      name="grid"
                    />

                    <div>
                      <strong>
                        {t.dashboard}
                      </strong>

                      <span>
                        {t.admin}
                      </span>
                    </div>
                  </button>
                )}

                <button
                  className="menu-card"
                  onClick={() =>
                    showToast(
                      lang === 'ar'
                        ? 'الدعم سيتم ربطه لاحقاً'
                        : 'Support will be connected later'
                    )
                  }
                >
                  <Icon
                    name="settings"
                  />

                  <div>
                    <strong>
                      {t.support}
                    </strong>

                    <span>
                      {
                        store
                          .storeSettings
                          .supportPhone
                      }
                    </span>
                  </div>
                </button>

              </section>

            </Page>
          )}

        {/* SELLER REGISTER */}

        {view ===
          'seller-register' && (
            <Page
              title={
                t.sellerTitle
              }
            >

              <form
                className="checkout-card"
                onSubmit={
                  submitSeller
                }
              >

                <p className="page-lead">
                  {t.sellerText}
                </p>

                <FormInput
                  label={
                    t.storeName
                  }
                  value={
                    sellerForm
                      .storeName
                  }
                  onChange={
                    (value) =>
                      setSellerForm({
                        ...sellerForm,
                        storeName:
                          value,
                      })
                  }
                />

                <FormInput
                  label={
                    t.phone
                  }
                  value={
                    sellerForm.phone
                  }
                  onChange={
                    (value) =>
                      setSellerForm({
                        ...sellerForm,
                        phone:
                          value,
                      })
                  }
                  type="tel"
                />

                <label className="field">

                  <span>
                    {t.sellerCategory}
                  </span>

                  <select
                    value={
                      sellerForm
                        .category
                    }
                    onChange={
                      (event) =>
                        setSellerForm({
                          ...sellerForm,
                          category:
                            event
                              .target
                              .value,
                        })
                    }
                  >

                    {store.categories.map(
                      (
                        item
                      ) => (
                        <option
                          key={
                            item.id
                          }
                          value={
                            item.id
                          }
                        >
                          {lang === 'ar'
                            ? item.nameAr
                            : item.nameEn}
                        </option>
                      )
                    )}

                  </select>

                </label>

                <button
                  className="primary-btn"
                  type="submit"
                >
                  {t.submitApplication}
                </button>

              </form>

            </Page>
          )}

      </main>

      {/* BOTTOM NAV */}

      <nav className="bottom-nav">

        {nav.map(
          ([
            id,
            icon,
            label,
          ]) => (
            <button
              key={id}
              className={
                view === id
                  ? 'active'
                  : ''
              }
              onClick={() =>
                go(id)
              }
            >

              <span className="nav-icon-wrap">

                <Icon
                  name={
                    icon
                  }
                />

                {id === 'cart' &&
                  cartCount >
                  0 && (
                    <b className="nav-badge">
                      {cartCount}
                    </b>
                  )}

                {id ===
                  'favorites' &&
                  favoriteProducts.length >
                  0 && (
                    <b className="nav-badge">
                      {
                        favoriteProducts.length
                      }
                    </b>
                  )}

              </span>

              <span>
                {label}
              </span>

            </button>
          )
        )}

      </nav>

      {/* PRODUCT DETAILS */}

      {selectedProduct && (
        <ProductSheet
          product={
            selectedProduct
          }
          store={store}
          lang={lang}
          t={t}
          favorite={
            favoriteIds.includes(
              selectedProduct.id
            )
          }
          toggleFavorite={
            toggleFavorite
          }
          addToCart={
            addToCart
          }
          close={() =>
            setSelectedProduct(
              null
            )
          }
        />
      )}

      {/* TOAST */}

      <div
        className={
          `toast ${toast
            ? 'show'
            : ''
          }`
        }
      >
        {toast}
      </div>

    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Search
|--------------------------------------------------------------------------
*/

function Search({
  value,
  onChange,
  t,
}) {
  return (
    <label className="search-box">

      <Icon
        name="search"
        size={20}
      />

      <input
        value={value}
        onChange={
          (event) =>
            onChange(
              event.target.value
            )
        }
        placeholder={
          t.search
        }
      />

    </label>
  );
}

/*
|--------------------------------------------------------------------------
| Section
|--------------------------------------------------------------------------
*/

function Section({
  title,
  action,
  onAction,
  children,
}) {
  return (
    <section className="section">

      <div className="section-head">

        <h2>
          {title}
        </h2>

        {action && (
          <button
            onClick={
              onAction
            }
          >
            {action}
          </button>
        )}

      </div>

      {children}

    </section>
  );
}

/*
|--------------------------------------------------------------------------
| Page
|--------------------------------------------------------------------------
*/

function Page({
  title,
  children,
}) {
  return (
    <section className="page">

      <div className="page-title">
        <h1>
          {title}
        </h1>
      </div>

      {children}

    </section>
  );
}

/*
|--------------------------------------------------------------------------
| Empty
|--------------------------------------------------------------------------
*/

function Empty({
  title,
  button,
  onClick,
}) {
  return (
    <div className="empty-state">

      <strong>
        {title}
      </strong>

      <button
        onClick={
          onClick
        }
      >
        {button}
      </button>

    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Form Input
|--------------------------------------------------------------------------
*/

function FormInput({
  label,
  value,
  onChange,
  type = 'text',
}) {
  return (
    <label className="field">

      <span>
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={
          (event) =>
            onChange(
              event.target.value
            )
        }
      />

    </label>
  );
}

/*
|--------------------------------------------------------------------------
| Category Card
|--------------------------------------------------------------------------
*/

function CategoryCard({
  item,
  lang,
  onClick,
}) {
  const subtitle =
    lang === 'ar'
      ? item.subtitleAr
      : item.subtitleEn;

  return (
    <button
      className="category-card card-corner"
      onClick={
        onClick
      }
    >

      <div className="category-image">
        <img
          src={
            item.image
          }
          alt=""
        />
      </div>

      <strong>
        {lang === 'ar'
          ? item.nameAr
          : item.nameEn}
      </strong>

      {subtitle && (
        <span>
          {subtitle}
        </span>
      )}

    </button>
  );
}

/*
|--------------------------------------------------------------------------
| Seller Card
|--------------------------------------------------------------------------
*/

function SellerCard({
  seller,
  lang,
}) {
  return (
    <article className="seller-card card-corner">

      <div className="seller-image">

        <img
          src={
            seller.image
          }
          alt=""
        />

      </div>

      <div>

        <strong>
          {lang === 'ar'
            ? seller.nameAr
            : seller.nameEn}
        </strong>

        {seller.rating != null && (
          <span>
            ★ {seller.rating}
          </span>
        )}

      </div>

    </article>
  );
}

/*
|--------------------------------------------------------------------------
| Product Card
|--------------------------------------------------------------------------
*/

function ProductCard({
  product,
  lang,
  t,
  favorite,
  toggleFavorite,
  addToCart,
  open,
}) {
  return (
    <article className="product-card card-corner">

      <button
        className={
          `save-btn ${favorite
            ? 'active'
            : ''
          }`
        }
        onClick={() =>
          toggleFavorite(
            product.id
          )
        }
        aria-label={
          t.save
        }
      >
        <Icon
          name="heart"
          size={18}
        />
      </button>

      <button
        className="product-image"
        onClick={
          open
        }
      >

        <img
          src={
            product.image
          }
          alt={
            lang === 'ar'
              ? product.nameAr
              : product.nameEn
          }
        />

      </button>

      <div className="product-copy">

        <span>
          {money(
            lang,
            product.price ??
            PRICE
          )}
        </span>

        <strong>
          {lang === 'ar'
            ? product.nameAr
            : product.nameEn}
        </strong>

        <small>
          {product.stock}{' '}
          {t.stock}
        </small>

        <button
          onClick={() =>
            addToCart(
              product.id
            )
          }
        >
          {t.add}
        </button>

      </div>

    </article>
  );
}

/*
|--------------------------------------------------------------------------
| Product Sheet
|--------------------------------------------------------------------------
*/

function ProductSheet({
  product,
  store,
  lang,
  t,
  favorite,
  toggleFavorite,
  addToCart,
  close,
}) {
  const seller =
    store.sellers.find(
      (item) =>
        item.id ===
        product.sellerId
    );

  return (
    <div className="sheet-wrap">

      <button
        className="sheet-backdrop"
        onClick={
          close
        }
      />

      <article className="product-sheet">

        <button
          className="sheet-close"
          onClick={
            close
          }
        >
          {t.close}
        </button>

        <div className="sheet-visual">

          <img
            src={
              product.image
            }
            alt=""
          />

        </div>

        <div className="sheet-copy">

          <span>
            {money(
              lang,
              product.price ??
              PRICE
            )}
          </span>

          <h2>
            {lang === 'ar'
              ? product.nameAr
              : product.nameEn}
          </h2>

          <p>
            {lang === 'ar'
              ? product.descriptionAr
              : product.descriptionEn}
          </p>

          <dl>

            <div>
              <dt>
                {t.seller}
              </dt>

              <dd>
                {seller
                  ? (
                    lang ===
                      'ar'
                      ? seller.nameAr
                      : seller.nameEn
                  )
                  : '—'}
              </dd>
            </div>

            <div>
              <dt>
                {t.stock}
              </dt>

              <dd>
                {product.stock}
              </dd>
            </div>

          </dl>

          <div className="sheet-actions">

            <button
              className={
                `secondary-btn ${favorite
                  ? 'active'
                  : ''
                }`
              }
              onClick={() =>
                toggleFavorite(
                  product.id
                )
              }
            >
              {favorite
                ? t.saved
                : t.save}
            </button>

            <button
              className="primary-btn"
              onClick={() => {
                addToCart(
                  product.id
                );

                close();
              }}
            >
              {t.add}
            </button>

          </div>

        </div>

      </article>

    </div>
  );
}

export default App;

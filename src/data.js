export const PRICE = 5.75;

export const assets = {
  food: '/assets/food.png',
  pharmacy: '/assets/pharmacy.png',
  meat: '/assets/meat.png',
  groceries: '/assets/groceries.png',
  gifts: '/assets/gifts.png',
  pets: '/assets/pet-supplies.png',
};

export const initialCategories = [
  { id: 'food', nameAr: 'طعام', nameEn: 'Food', image: assets.food, subtitleAr: 'اختيارات يومية سريعة', subtitleEn: 'Quick everyday picks' },
  { id: 'pharmacy', nameAr: 'صيدلية', nameEn: 'Pharmacy', image: assets.pharmacy, subtitleAr: 'احتياجات يومية', subtitleEn: 'Everyday essentials' },
  { id: 'meat', nameAr: 'اللحوم', nameEn: 'Meat', image: assets.meat, subtitleAr: 'اختيارات صغيرة', subtitleEn: 'Small selections' },
  { id: 'groceries', nameAr: 'البقالة', nameEn: 'Groceries', image: assets.groceries, subtitleAr: 'أساسيات المنزل', subtitleEn: 'Home essentials' },
  { id: 'gifts', nameAr: 'هدايا', nameEn: 'Gifts', image: assets.gifts, subtitleAr: 'أفكار بسيطة', subtitleEn: 'Simple gift ideas' },
  { id: 'pets', nameAr: 'الحيوانات', nameEn: 'Pet supplies', image: assets.pets, subtitleAr: 'احتياجات الحيوانات', subtitleEn: 'Pet essentials' },
];

export const initialSellers = [
  { id: 1, nameAr: 'مطبخ 5.75', nameEn: '5.75 Kitchen', category: 'food', image: assets.food, rating: 4.8, verified: true },
  { id: 2, nameAr: 'عناية 5.75', nameEn: '5.75 Care', category: 'pharmacy', image: assets.pharmacy, rating: 4.7, verified: true },
  { id: 3, nameAr: 'سوق 5.75', nameEn: '5.75 Market', category: 'groceries', image: assets.groceries, rating: 4.9, verified: true },
  { id: 4, nameAr: 'هديتك 5.75', nameEn: 'Gift 5.75', category: 'gifts', image: assets.gifts, rating: 4.6, verified: true },
];

export const initialProducts = [
  { id: 1, category: 'food', sellerId: 1, nameAr: 'سلطة يومية', nameEn: 'Daily salad', image: assets.food, stock: 31, featured: true, descriptionAr: 'اختيار يومي بسيط وخفيف.', descriptionEn: 'A simple light everyday pick.' },
  { id: 2, category: 'pharmacy', sellerId: 2, nameAr: 'كبسولات عناية', nameEn: 'Care capsules', image: assets.pharmacy, stock: 22, featured: true, descriptionAr: 'منتج لقسم العناية اليومية.', descriptionEn: 'An item from the daily care section.' },
  { id: 3, category: 'meat', sellerId: 3, nameAr: 'اختيار لحوم', nameEn: 'Meat selection', image: assets.meat, stock: 18, featured: false, descriptionAr: 'عبوة صغيرة مناسبة للاستخدام اليومي.', descriptionEn: 'A small pack for everyday use.' },
  { id: 4, category: 'groceries', sellerId: 3, nameAr: 'سلة بقالة صغيرة', nameEn: 'Mini grocery bag', image: assets.groceries, stock: 44, featured: true, descriptionAr: 'أساسيات منزلية مختارة.', descriptionEn: 'Selected household essentials.' },
  { id: 5, category: 'gifts', sellerId: 4, nameAr: 'هدية صغيرة', nameEn: 'Small gift box', image: assets.gifts, stock: 26, featured: true, descriptionAr: 'هدية بسيطة للمناسبات.', descriptionEn: 'A simple gift for small occasions.' },
  { id: 6, category: 'pets', sellerId: 3, nameAr: 'احتياجات حيوان أليف', nameEn: 'Pet essentials', image: assets.pets, stock: 15, featured: false, descriptionAr: 'اختيار بسيط للحيوانات الأليفة.', descriptionEn: 'A simple pet-care pick.' },
];

export const initialSlides = [
  { id: 1, tone: 'green', titleAr: 'كل شيء بـ 5,75', titleEn: 'Everything for 5.75', textAr: 'سعر واحد. اختيارات كثيرة. تجربة أسهل.', textEn: 'One price. More choice. Easier shopping.', ctaAr: 'تسوق الآن', ctaEn: 'Shop now', image: assets.groceries, action: 'categories' },
  { id: 2, tone: 'yellow', titleAr: 'سجّل كبائع وابدأ تربح', titleEn: 'Sell with us and start earning', textAr: 'اعرض المنتجات المناسبة للسعر الثابت واستقبل الطلبات.', textEn: 'List qualifying products and start receiving orders.', ctaAr: 'سجّل كبائع', ctaEn: 'Become a seller', image: assets.gifts, action: 'seller-register' },
  { id: 3, tone: 'orange', titleAr: 'جديد كل أسبوع', titleEn: 'Fresh picks every week', textAr: 'اكتشف اختيارات جديدة من المتاجر المشاركة.', textEn: 'Discover new picks from participating sellers.', ctaAr: 'اكتشف الجديد', ctaEn: 'See what’s new', image: assets.food, action: 'home' },
];

export const initialStore = {
  categories: initialCategories,
  sellers: initialSellers,
  products: initialProducts,
  slides: initialSlides,
  orders: [],
  sellerApplications: [],
  customers: [],
  storeSettings: {
    nameAr: 'الكل بـ 5,75',
    nameEn: 'Everything 5.75',
    supportPhone: '+966500000000',
    deliveryFee: 0,
    currencyAr: 'ر.س',
    currencyEn: 'SAR',
  },
};

export const translations = {
  ar: {
    home: 'الرئيسية', categories: 'الأقسام', favorites: 'المفضلة', cart: 'السلة', settings: 'الإعدادات',
    search: 'ابحث عن منتج أو متجر', shopByCategory: 'تسوق حسب القسم', sellers: 'متاجر مختارة', viewAll: 'عرض الكل',
    picks: 'اختيارات لك', fixedPrice: 'كل منتج بسعر ثابت', add: 'أضف للسلة', saved: 'محفوظ', save: 'حفظ',
    emptyFavorites: 'لم تحفظ أي منتج بعد', emptyCart: 'السلة فارغة', browse: 'ابدأ التسوق', total: 'الإجمالي', checkout: 'إتمام الطلب',
    checkoutTitle: 'إتمام الطلب', customerInfo: 'بيانات العميل', fullName: 'الاسم الكامل', phone: 'رقم الجوال', address: 'العنوان', city: 'المدينة', notes: 'ملاحظات', payment: 'طريقة الدفع', cod: 'الدفع عند الاستلام', placeOrder: 'تأكيد الطلب',
    orders: 'طلباتي', noOrders: 'لا توجد طلبات بعد', order: 'طلب', status: 'الحالة', new: 'جديد', preparing: 'قيد التجهيز', shipped: 'في الطريق', delivered: 'تم التسليم', cancelled: 'ملغي',
    account: 'الحساب', guest: 'حساب تجريبي', signIn: 'تسجيل الدخول', language: 'اللغة', appearance: 'المظهر', light: 'فاتح', dark: 'داكن', sellerProgram: 'برنامج البائعين', becomeSeller: 'سجّل كبائع', dashboard: 'لوحة التحكم', support: 'الدعم',
    sellerTitle: 'انضم كبائع', sellerText: 'أدخل بيانات متجرك وسنراجع الطلب.', storeName: 'اسم المتجر', sellerCategory: 'القسم', submitApplication: 'إرسال الطلب', applicationSent: 'تم إرسال طلب البائع',
    admin: 'الإدارة', overview: 'نظرة عامة', products: 'المنتجات', sliders: 'السلايدر', customers: 'العملاء', applications: 'طلبات البائعين', backStore: 'العودة للمتجر',
    addProduct: 'إضافة منتج', edit: 'تعديل', delete: 'حذف', inventory: 'المخزون', revenue: 'قيمة الطلبات', recentOrders: 'أحدث الطلبات', changeStatus: 'تغيير الحالة',
    adminHint: 'هذه لوحة إدارة تجريبية. عند ربط Laravel ستقرأ وتكتب البيانات من قاعدة البيانات.', productDetails: 'تفاصيل المنتج', seller: 'البائع', stock: 'المتوفر', close: 'إغلاق',
  },
  en: {
    home: 'Home', categories: 'Categories', favorites: 'Favorites', cart: 'Cart', settings: 'Settings',
    search: 'Search products or sellers', shopByCategory: 'Shop by category', sellers: 'Featured sellers', viewAll: 'View all',
    picks: 'Picks for you', fixedPrice: 'Every product is one fixed price', add: 'Add to cart', saved: 'Saved', save: 'Save',
    emptyFavorites: 'No saved products yet', emptyCart: 'Your cart is empty', browse: 'Start shopping', total: 'Total', checkout: 'Checkout',
    checkoutTitle: 'Checkout', customerInfo: 'Customer information', fullName: 'Full name', phone: 'Phone number', address: 'Address', city: 'City', notes: 'Notes', payment: 'Payment method', cod: 'Cash on delivery', placeOrder: 'Place order',
    orders: 'My orders', noOrders: 'No orders yet', order: 'Order', status: 'Status', new: 'New', preparing: 'Preparing', shipped: 'On the way', delivered: 'Delivered', cancelled: 'Cancelled',
    account: 'Account', guest: 'Demo account', signIn: 'Sign in', language: 'Language', appearance: 'Appearance', light: 'Light', dark: 'Dark', sellerProgram: 'Seller program', becomeSeller: 'Become a seller', dashboard: 'Dashboard', support: 'Support',
    sellerTitle: 'Become a seller', sellerText: 'Enter your store details and we will review the application.', storeName: 'Store name', sellerCategory: 'Category', submitApplication: 'Submit application', applicationSent: 'Seller application sent',
    admin: 'Admin', overview: 'Overview', products: 'Products', sliders: 'Slider', customers: 'Customers', applications: 'Seller applications', backStore: 'Back to store',
    addProduct: 'Add product', edit: 'Edit', delete: 'Delete', inventory: 'Inventory', revenue: 'Order value', recentOrders: 'Recent orders', changeStatus: 'Change status',
    adminHint: 'This is a demo admin. Once Laravel is connected it will read and write data from the database.', productDetails: 'Product details', seller: 'Seller', stock: 'In stock', close: 'Close',
  }
};

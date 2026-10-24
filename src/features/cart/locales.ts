import type { Translations } from '@/shared/i18n';

const en = {
  title: 'Cart',
  listLabel: 'Items in your cart',
  emptyTitle: 'Your cart is empty',
  emptyMessage: 'Add the products you like and they will show up here.',
  browseCategories: 'Browse categories',
  unavailableNotice:
    'Some items are unavailable. Remove them to continue; they are not included in the subtotal.',
  error: {
    title: 'We could not load your cart',
    message: 'Check your connection and try again.',
  },
  lines: {
    each: '{{price}} each',
    outOfStock: 'Out of stock for your delivery address.',
    gone: 'This item is no longer available.',
    remove: 'Remove',
    removeNamed: 'Remove {{name}} from the cart',
    removed: '{{name}} was removed from your cart.',
  },
  stepper: {
    label: 'Quantity of {{name}}',
    decrease: 'Decrease quantity of {{name}}',
    increase: 'Increase quantity of {{name}}',
  },
  summary: {
    title: 'Order summary',
    items: 'Items',
    subtotal: 'Subtotal',
    vatIncluded: 'Prices include {{rate}}% VAT',
    decidedAtCheckout: 'The delivery fee and any promo code are worked out at checkout.',
    guestNote: 'Availability is checked at checkout, where you sign in to pay.',
    checkout: 'Checkout',
  },
  add: {
    button: 'Add to cart',
    outOfStock: 'Out of stock',
    outOfStockHint: 'This item is out of stock for your delivery area right now.',
    limit: 'You can order up to {{max}} of each item.',
    added: 'Added to your cart: {{name}}. Quantity in cart: {{quantity}}.',
    capped:
      'The most you can order of one item is {{max}}. {{name}} is now at {{max}} in your cart.',
    addedInline: 'Added to your cart',
    viewCart: 'View cart',
  },
  refusal: {
    quantity_out_of_range: 'Choose a quantity from 1 to {{max}}.',
    variant_unavailable: 'This item is not available right now.',
    cart_full: 'Your cart is full. Remove an item to add another one.',
    session_expired: 'Your session has ended. Sign in again and try once more.',
    network: 'No connection. Check your internet and try again.',
    unknown: 'Something went wrong. Please try again.',
  },
  merge: {
    done: 'We added the items you chose before signing in',
    failed:
      'We could not add the items you chose before signing in. They are saved on this device and we will try again next time.',
  },
};

const ar: Translations<typeof en> = {
  title: 'السلة',
  listLabel: 'المنتجات في سلتك',
  emptyTitle: 'سلتك فارغة',
  emptyMessage: 'أضف المنتجات التي تعجبك وستظهر هنا.',
  browseCategories: 'تصفّح الفئات',
  unavailableNotice: 'بعض المنتجات غير متاحة. احذفها للمتابعة، فهي غير محسوبة في المجموع.',
  error: {
    title: 'تعذّر تحميل سلتك',
    message: 'تحقق من اتصالك بالإنترنت وحاول مرة أخرى.',
  },
  lines: {
    each: '{{price}} للقطعة',
    outOfStock: 'غير متوفر في عنوان التوصيل الخاص بك.',
    gone: 'لم يعد هذا المنتج متاحًا.',
    remove: 'حذف',
    removeNamed: 'حذف {{name}} من السلة',
    removed: 'تم حذف {{name}} من سلتك.',
  },
  stepper: {
    label: 'كمية {{name}}',
    decrease: 'تقليل كمية {{name}}',
    increase: 'زيادة كمية {{name}}',
  },
  summary: {
    title: 'ملخص الطلب',
    items: 'عدد القطع',
    subtotal: 'المجموع الفرعي',
    vatIncluded: 'الأسعار شاملة ضريبة القيمة المضافة {{rate}}%',
    decidedAtCheckout: 'تُحسب رسوم التوصيل وكود الخصم عند إتمام الطلب.',
    guestNote: 'يُتحقق من توفر المنتجات عند إتمام الطلب، وتسجّل الدخول قبل الدفع.',
    checkout: 'إتمام الطلب',
  },
  add: {
    button: 'أضف إلى السلة',
    outOfStock: 'نفدت الكمية',
    outOfStockHint: 'هذا المنتج غير متوفر حاليًا في منطقة التوصيل الخاصة بك.',
    limit: 'يمكنك طلب حتى {{max}} من كل منتج.',
    added: 'تمت الإضافة إلى السلة: {{name}}. الكمية في السلة: {{quantity}}.',
    capped: 'الحد الأقصى للمنتج الواحد هو {{max}}. كمية {{name}} في سلتك الآن {{max}}.',
    addedInline: 'تمت الإضافة إلى السلة',
    viewCart: 'عرض السلة',
  },
  refusal: {
    quantity_out_of_range: 'اختر كمية من 1 إلى {{max}}.',
    variant_unavailable: 'هذا المنتج غير متاح حاليًا.',
    cart_full: 'سلتك ممتلئة. احذف منتجًا لإضافة منتج آخر.',
    session_expired: 'انتهت جلستك. سجّل الدخول من جديد ثم حاول مرة أخرى.',
    network: 'لا يوجد اتصال. تحقق من الإنترنت وحاول مرة أخرى.',
    unknown: 'حدث خطأ ما. حاول مرة أخرى.',
  },
  merge: {
    done: 'أضفنا المنتجات التي اخترتها قبل تسجيل الدخول',
    failed:
      'تعذّرت إضافة المنتجات التي اخترتها قبل تسجيل الدخول. هي محفوظة على هذا الجهاز وسنعيد المحاولة لاحقًا.',
  },
};

export const cartLocales = { en, ar };

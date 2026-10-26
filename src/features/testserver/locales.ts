import type { Translations } from '@/shared/i18n';

const en = {
  banner: {
    label: 'Test build',
    server: 'Server:',
    noServer: 'No server chosen yet',
    change: 'Change server',
  },
  title: 'Server address',
  lead: 'This is a test build. Choose which server it talks to. A server on your own network looks like 192.168.1.23:8000.',
  field: {
    label: 'Server address',
    hint: 'The API path is added for you.',
  },
  invalid: 'This is not a web address. Try something like 192.168.1.23:8000.',
  current: 'Now using:',
  noneYet: 'No server address is set yet.',
  check: 'Check the connection',
  checking: 'Checking…',
  save: 'Save and restart',
  reset: 'Use the built-in address',
  connected: 'Connected. This server answers.',
  unreachable:
    'Could not reach this server. Check the address, that the server is running and that this phone is on the same Wi-Fi.',
  notSaved: 'This device would not keep the address.',
  log: {
    title: 'Recent requests',
    lead: 'What this app asked the server just now. If a screen does not load, send a screenshot of this list.',
    empty: 'No requests yet.',
    state: 'Network: {{browser}}, query manager: {{queries}}, session: {{session}}',
    online: 'online',
    offline: 'offline',
    preparing: 'waiting for secure storage, {{seconds}} s',
    sending: 'waiting for the server, {{seconds}} s',
    done: '{{status}}, {{ms}} ms',
    failed: 'failed: {{reason}}, {{ms}} ms',
  },
};

const ar: Translations<typeof en> = {
  banner: {
    label: 'نسخة تجريبية',
    server: 'الخادم:',
    noServer: 'لم يُحدَّد خادم بعد',
    change: 'تغيير الخادم',
  },
  title: 'عنوان الخادم',
  lead: 'هذه نسخة تجريبية. اختر الخادم الذي يتصل به التطبيق. عنوان الخادم على شبكتك يشبه 192.168.1.23:8000.',
  field: {
    label: 'عنوان الخادم',
    hint: 'يُضاف مسار الواجهة تلقائيًا.',
  },
  invalid: 'هذا ليس عنوان موقع. جرّب شيئًا مثل 192.168.1.23:8000.',
  current: 'يستخدم الآن:',
  noneYet: 'لم يُحدَّد عنوان خادم بعد.',
  check: 'افحص الاتصال',
  checking: 'جارٍ الفحص…',
  save: 'احفظ وأعد التشغيل',
  reset: 'استخدم العنوان المضمَّن',
  connected: 'تم الاتصال. هذا الخادم يستجيب.',
  unreachable:
    'تعذّر الوصول إلى هذا الخادم. تحقق من العنوان ومن أن الخادم يعمل وأن هذا الهاتف على نفس شبكة الواي فاي.',
  notSaved: 'لم يقبل هذا الجهاز حفظ العنوان.',
  log: {
    title: 'آخر الطلبات',
    lead: 'ما طلبه التطبيق من الخادم قبل قليل. إن لم تُحمَّل شاشة فأرسل لقطة لهذه القائمة.',
    empty: 'لا توجد طلبات بعد.',
    state: 'الشبكة: {{browser}}، مدير الطلبات: {{queries}}، الجلسة: {{session}}',
    online: 'متصل',
    offline: 'غير متصل',
    preparing: 'ينتظر التخزين الآمن، {{seconds}} ث',
    sending: 'ينتظر الخادم، {{seconds}} ث',
    done: '{{status}}، {{ms}} ملي ثانية',
    failed: 'فشل: {{reason}}، {{ms}} ملي ثانية',
  },
};

export const testServerLocales = { en, ar };

import type { Translations } from '../i18n';

const en = {
  createTitle: 'Create account',
  createIntro:
    'Use your email or Saudi mobile number. Enter the code we send you, then accept the terms to create your account.',
  signInIntro: 'Sign in with a code sent to your email or mobile. You do not need a password.',
  haveAccount: 'Already have an account? Sign in',
  newAccount: 'New here? Create account',
  title: 'Fingerprint sign-in',
  description:
    'After signing in with a code, enable fingerprint to unlock your account on this phone.',
  webOnly:
    'Fingerprint is available in the Android app on a supported phone. Use email or a mobile code here.',
  unavailable:
    'Fingerprint is not ready on this phone. Set it up in your phone settings, or use an email or mobile code.',
  enable: 'Enable fingerprint',
  disable: 'Turn off fingerprint',
  unlock: 'Unlock with fingerprint',
  prompt: 'Verify to access your ALL 5.75 account',
  enabled: 'Fingerprint is on. You will need it when you reopen the app.',
  disabled: 'Fingerprint is off.',
  failure: 'Fingerprint could not be verified. Try again or use an email or mobile code.',
  restoreFailure:
    'We could not open the saved session. Check your connection and try again. If the session expired, sign in with a new code.',
};

const ar: Translations<typeof en> = {
  createTitle: 'إنشاء حساب',
  createIntro:
    'استخدم بريدك الإلكتروني أو رقم جوالك السعودي. أدخل الرمز الذي نرسله إليك، ثم وافق على الشروط لإنشاء حسابك.',
  signInIntro: 'سجّل الدخول برمز نرسله إلى بريدك الإلكتروني أو جوالك، دون كلمة مرور.',
  haveAccount: 'لديك حساب؟ سجّل الدخول',
  newAccount: 'مستخدم جديد؟ أنشئ حسابًا',
  title: 'الدخول بالبصمة',
  description: 'بعد الدخول برمز التحقق، يمكنك تفعيل البصمة لفتح حسابك على هذا الجوال.',
  webOnly:
    'البصمة متاحة في تطبيق أندرويد على جوال يدعمها. استخدم البريد الإلكتروني أو رمز الجوال هنا.',
  unavailable:
    'البصمة غير جاهزة على هذا الجوال. فعّلها في إعدادات الجوال، أو استخدم رمز البريد الإلكتروني أو الجوال.',
  enable: 'تفعيل البصمة',
  disable: 'إيقاف البصمة',
  unlock: 'فتح الحساب بالبصمة',
  prompt: 'تحقق لفتح حسابك في الكل بـ 5.75',
  enabled: 'البصمة مفعّلة. ستحتاج إليها عند العودة إلى التطبيق.',
  disabled: 'البصمة غير مفعّلة.',
  failure: 'تعذّر التحقق من البصمة. حاول مجددًا أو استخدم رمز البريد الإلكتروني أو الجوال.',
  restoreFailure:
    'تعذّر فتح الجلسة المحفوظة. تحقق من الاتصال وحاول مجددًا. إذا انتهت الجلسة، سجّل الدخول برمز جديد.',
};

const fr: Translations<typeof en> = {
  createTitle: 'Créer un compte',
  createIntro:
    'Utilisez votre e-mail ou votre numéro de mobile saoudien. Saisissez le code reçu, puis acceptez les conditions pour créer votre compte.',
  signInIntro:
    'Connectez-vous avec un code envoyé par e-mail ou sur votre mobile. Aucun mot de passe nécessaire.',
  haveAccount: 'Déjà un compte ? Se connecter',
  newAccount: 'Nouveau ? Créer un compte',
  title: 'Connexion par empreinte',
  description:
    'Après une connexion par code, activez votre empreinte pour déverrouiller votre compte sur ce téléphone.',
  webOnly:
    'L’empreinte est disponible dans l’application Android sur un téléphone compatible. Utilisez un code par e-mail ou mobile ici.',
  unavailable:
    'L’empreinte n’est pas prête sur ce téléphone. Configurez-la dans les paramètres, ou utilisez un code par e-mail ou mobile.',
  enable: 'Activer l’empreinte',
  disable: 'Désactiver l’empreinte',
  unlock: 'Déverrouiller avec l’empreinte',
  prompt: 'Vérifiez votre identité pour accéder à votre compte TOUT à 5,75',
  enabled: 'L’empreinte est activée. Elle sera nécessaire à la réouverture de l’application.',
  disabled: 'L’empreinte est désactivée.',
  failure: 'Empreinte non vérifiée. Réessayez ou utilisez un code par e-mail ou mobile.',
  restoreFailure:
    'Impossible d’ouvrir la session enregistrée. Vérifiez votre connexion et réessayez. Si la session a expiré, connectez-vous avec un nouveau code.',
};

export const accessLocales = { en, ar, fr };

import { isApiError } from '@/shared/api';

type Language = 'ar' | 'en' | 'fr';
type Context = 'document' | 'image' | 'csv';

/**
 * Give upload-specific, actionable errors without leaking server internals.
 * The API must remain responsible for validating file bytes and permissions.
 */
export function uploadErrorMessage(error: unknown, language: Language, context: Context): string {
  const translated = (ar: string, en: string, fr: string): string =>
    language === 'ar' ? ar : language === 'fr' ? fr : en;
  const kind = context === 'document'
    ? translated('المستند', 'document', 'document')
    : context === 'image'
      ? translated('الصورة', 'image', 'image')
      : translated('ملف CSV', 'CSV file', 'fichier CSV');

  if (!isApiError(error)) {
    return translated(
      `تعذر رفع ${kind}. أعد المحاولة وتأكد من الاتصال.`,
      `Could not upload the ${kind}. Check your connection and try again.`,
      `Impossible de transférer le ${kind}. Vérifiez votre connexion.`,
    );
  }
  const messages = Object.values(error.fieldErrors).flat().filter(Boolean);
  if (error.status === 413) {
    return translated(
      'الخادم رفض حجم الملف. يجب مراجعة حد الرفع في إعدادات Nginx وPHP، حتى لو كان الحجم ضمن الحد المسموح في الصفحة.',
      'Server rejected the upload size. Check Nginx and PHP upload limits.',
      'Fichier refusé : vérifiez les limites de taille Nginx et PHP.',
    );
  }
  if (error.status === 401) {
    return translated('انتهت جلسة الدخول. سجّل الدخول مجددًا ثم حاول الرفع.',
      'Your session expired. Sign in again, then retry.',
      'Session expirée. Reconnectez-vous puis réessayez.');
  }
  if (error.status === 403) {
    return translated('الحساب غير مخوّل للرفع. تأكد من توثيق البريد أو الجوال ومن صلاحيات حسابك.',
      'Upload not authorized. Verify your email or phone and account permissions.',
      'Transfert non autorisé. Vérifiez votre compte et ses autorisations.');
  }
  if (error.status === 404) {
    return translated(
      context === 'document'
        ? 'لم يُعثر على طلب البائع المحفوظ. احفظ مسودة الطلب أولًا ثم أعد تحميل الصفحة.'
        : 'لم يُعثر على السجل المطلوب. حدّث الصفحة وتأكد من أنه محفوظ.',
      context === 'document'
        ? 'No saved seller application was found. Save your draft first, then refresh.'
        : 'The saved record was not found. Refresh and check it exists.',
      context === 'document'
        ? 'Aucun brouillon vendeur trouvé. Enregistrez-le puis actualisez.'
        : 'Élément introuvable. Actualisez la page.',
    );
  }
  if (error.status === 409) {
    return translated('لا يمكن تعديل هذا الملف في الحالة الحالية. حدّث الصفحة وتحقق من حالة الطلب أو المنتج.',
      'Upload is not allowed in its current state. Refresh and check the application/product status.',
      'Transfert non autorisé dans cet état. Actualisez la page.');
  }
  if (error.status === 422) {
    const specifics = messages.length ? ' ' + messages.join(' | ') : '';
    return translated(
      'الخادم رفض بيانات الملف أو نوعه. راجع الصيغة والحجم.' + specifics,
      'The server rejected the file or its type. Check its format and size.' + specifics,
      'Fichier ou format refusé par le serveur.' + specifics,
    );
  }
  if (error.status === 429) {
    return translated('تم تجاوز عدد محاولات الرفع. حاول بعد دقيقة.',
      'Too many uploads. Try again in one minute.',
      'Trop de tentatives. Réessayez dans une minute.');
  }
  if (error.kind === 'timeout') {
    return translated('انتهت مهلة الرفع. تحقق من الإنترنت وحدود الخادم ثم حاول مجددًا.',
      'Upload timed out. Check your connection and server limits.',
      'Délai de transfert dépassé. Vérifiez votre connexion.');
  }
  if (error.kind === 'network') {
    return translated('تعذر الاتصال بخادم الملفات. تأكد من الإنترنت ثم حاول مجددًا.',
      'Could not reach the upload server. Check your connection.',
      'Serveur de transfert inaccessible. Vérifiez votre connexion.');
  }
  if (error.status !== null && error.status >= 500) {
    return translated('فشل الخادم أثناء حفظ الملف. راجع سجلات Laravel وصلاحيات مجلد التخزين.',
      'Server failed while saving the file. Check Laravel logs and storage permissions.',
      'Erreur du serveur pendant la sauvegarde. Vérifiez les journaux Laravel.');
  }
  return translated(`تعذر رفع ${kind}.`, `Could not upload the ${kind}.`,
    `Impossible de transférer le ${kind}.`);
}

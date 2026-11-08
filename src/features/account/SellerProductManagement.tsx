import { lazy, Suspense, useEffect, useState, type FormEvent } from 'react';
import { parseProductCode } from './productCode';
const ProductCameraScanner = lazy(() =>
  import('./ProductCameraScanner').then((m) => ({ default: m.ProductCameraScanner })),
);
import { useTranslation } from 'react-i18next';
import { isApiError } from '@/shared/api';
import { uploadErrorMessage } from './uploadErrorMessage';
import { env } from '@/shared/lib';
import {
  addSellerProductVariant,
  createSellerProduct,
  deleteSellerProduct,
  importSellerProductCsv,
  uploadSellerProductImage,
  sellerCategories,
  lookupSellerProductCode,
  sellerCatalogTemplate,
  sellerCatalogExcelTemplate,
  submitSellerProduct,
  updateSellerProduct,
  type SellerCategory,
  type SellerMembership,
  type SellerProduct,
  type SellerProductInput,
  type SellerCsvPreview,
} from './sellerWorkspaceApi';

type Props = {
  products: SellerProduct[];
  memberships: SellerMembership[];
  onUpdated: () => void;
};

type Draft = {
  sellerId: string;
  categoryId: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  price: string;
  vatClass: 'standard' | 'zero' | 'exempt';
  vatJustification: string;
  sku: string;
  barcode: string;
};

const empty = (sellerId: string): Draft => ({
  sellerId,
  categoryId: '',
  nameAr: '',
  nameEn: '',
  descriptionAr: '',
  descriptionEn: '',
  price: '',
  vatClass: 'standard',
  vatJustification: '',
  sku: '',
  barcode: '',
});

const card: React.CSSProperties = {
  padding: 14,
  border: '1px solid #d8e1db',
  borderRadius: 12,
  marginBottom: 12,
};
const field: React.CSSProperties = { display: 'grid', gap: 5, minWidth: 130, flex: 1 };
const controls: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 10 };
const button: React.CSSProperties = { padding: '9px 12px', borderRadius: 9 };
const editable = (product: SellerProduct) =>
  product.status === 'draft' || product.status === 'rejected';

export function SellerProductManagement({ products, memberships, onUpdated }: Props) {
  const { i18n } = useTranslation();
  const ar = i18n.language.startsWith('ar');
  const tr = (arabic: string, english: string) => (ar ? arabic : english);
  const productStatusLabels: Record<string, string> = {
    draft: tr('مسودة', 'Draft'),
    pending_review: tr('بانتظار المراجعة', 'Pending review'),
    published: tr('منشور', 'Published'),
    rejected: tr('مرفوض', 'Rejected'),
  };
  const allowed = memberships.filter(
    (membership) =>
      membership.is_active &&
      membership.seller_status === 'approved' &&
      (membership.role === 'owner' || membership.role === 'branch_manager'),
  );
  const sellerIds = [...new Set(allowed.map((membership) => membership.seller_id))];
  const [categories, setCategories] = useState<SellerCategory[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => empty(String(sellerIds[0] ?? '')));
  const [workingId, setWorkingId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [localCoverPreview, setLocalCoverPreview] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState('');
  const [imageCardOpen, setImageCardOpen] = useState(true);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importSeller, setImportSeller] = useState('');
  const [csvPreview, setCsvPreview] = useState<SellerCsvPreview | null>(null);
  const [importIssues, setImportIssues] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [quickSku, setQuickSku] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannedText, setScannedText] = useState('');
  const [scanNotice, setScanNotice] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof Draft, string>>>({});
  const [formError, setFormError] = useState('');
  const [confirmation, setConfirmation] = useState<{ kind: 'save' | 'publish' | 'delete'; productId?: number } | null>(null);

  useEffect(() => {
    if (!coverFile) {
      setLocalCoverPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(coverFile);
    setLocalCoverPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [coverFile]);

  const fieldError = (name: keyof Draft) =>
    fieldErrors[name] ? (
      <span className="seller-field-error" role="alert" id={'seller-error-' + name}>
        {fieldErrors[name]}
      </span>
    ) : null;
  const fieldProps = (name: keyof Draft) => ({
    'aria-invalid': !!fieldErrors[name],
    'aria-describedby': fieldErrors[name] ? 'seller-error-' + name : undefined,
  });
  const flatCategories = (
    items: SellerCategory[],
    depth = 0,
  ): Array<{ id: number; label: string }> =>
    items.flatMap((item) => [
      { id: item.id, label: '—'.repeat(depth) + (ar ? item.name.ar : item.name.en) },
      ...flatCategories(item.children ?? [], depth + 1),
    ]);

  const collectErrors = (): Partial<Record<keyof Draft, string>> => {
    const next: Partial<Record<keyof Draft, string>> = {};
    if (selected === null && !draft.sku.trim())
      next.sku = tr('رمز SKU مطلوب.', 'SKU is required.');
    if (selected === null && draft.sku.trim().length > 100)
      next.sku = tr('رمز SKU يجب ألا يتجاوز 100 حرف.', 'SKU must be at most 100 characters.');
    if (draft.barcode.trim().length > 100)
      next.barcode = tr('الباركود يجب ألا يتجاوز 100 حرف.', 'Barcode must be at most 100 characters.');
    if (!sellerIds.includes(Number(draft.sellerId)))
      next.sellerId = tr('المتجر إجباري. اختر متجرًا مسموحًا.', 'Store is required. Select an authorized store.');
    if (!draft.categoryId || !/^[0-9]+$/.test(draft.categoryId) ||
        !flatCategories(categories).some((category) => String(category.id) === draft.categoryId))
      next.categoryId = tr('التصنيف إجباري. اختر تصنيفًا صحيحًا.', 'Category is required. Select a valid category.');
    if (!draft.nameAr.trim()) next.nameAr = tr('اسم المنتج بالعربية مطلوب.', 'Arabic product name is required.');
    if (!draft.nameEn.trim()) next.nameEn = tr('اسم المنتج بالإنجليزية مطلوب.', 'English product name is required.');
    if (draft.nameAr.trim().length > 180) next.nameAr = tr('الحد الأقصى 180 حرفًا.', 'Maximum 180 characters.');
    if (draft.nameEn.trim().length > 180) next.nameEn = tr('الحد الأقصى 180 حرفًا.', 'Maximum 180 characters.');
    if (draft.descriptionAr.length > 10000) next.descriptionAr = tr('الوصف بالعربية يجب ألا يتجاوز 10000 حرف.', 'Arabic description must not exceed 10,000 characters.');
    if (draft.descriptionEn.length > 10000) next.descriptionEn = tr('الوصف بالإنجليزية يجب ألا يتجاوز 10000 حرف.', 'English description must not exceed 10,000 characters.');
    if (!['standard', 'zero', 'exempt'].includes(draft.vatClass))
      next.vatClass = tr('فئة الضريبة إجبارية. اختر فئة صحيحة.', 'VAT class is required. Select a valid class.');
    if (draft.vatClass !== 'standard' && (draft.vatJustification.trim().length < 15 || draft.vatJustification.trim().length > 500))
      next.vatJustification = tr('اذكر سببًا نظاميًا واضحًا (15–500 حرف). ستخضع الحالة لمراجعة الإدارة.', 'State the applicable legal reason (15–500 characters). Admin review is required.');
    if (!/^[0-9]+(?:\.[0-9]{1,2})?$/.test(draft.price) ||
        Number(draft.price) < 1 || Number(draft.price) > 10)
      next.price = tr('أدخل سعرًا من 1 إلى 10 ريالات (حتى منزلتين عشريتين).', 'Enter a price from SAR 1 to SAR 10 (up to 2 decimals).');
    return next;
  };
  const displayApiFieldErrors = (cause: unknown): boolean => {
    if (!isApiError(cause) || cause.kind !== 'validation') return false;
    const mapping: Record<string, keyof Draft> = {
      sku: 'sku', barcode: 'barcode', seller_id: 'sellerId', category_id: 'categoryId',
      name_ar: 'nameAr', name_en: 'nameEn', description_ar: 'descriptionAr',
      description_en: 'descriptionEn', price_halalas: 'price', vat_class: 'vatClass', vat_justification: 'vatJustification',
    };
    const mapped: Partial<Record<keyof Draft, string>> = {};
    for (const [key, messages] of Object.entries(cause.fieldErrors)) {
      const target = mapping[key];
      if (target && messages[0]) mapped[target] = messages[0];
    }
    if (Object.keys(mapped).length === 0) return false;
    setFieldErrors(mapped);
    return true;
  };


  useEffect(() => {
    let active = true;
    void sellerCategories()
      .then((result) => {
        if (active) setCategories(result.data);
      })
      .catch(() => {
        if (active) setError(tr('تعذر تحميل التصنيفات.', 'Categories could not be loaded.'));
      });
    return () => {
      active = false;
    };
    // Loading categories does not depend on language.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (fieldName: keyof Draft, value: string) => {
    setDraft((current) => ({ ...current, [fieldName]: value }));
    setFieldErrors((current) => ({ ...current, [fieldName]: undefined }));
    setFormError('');
  };

  const applyScan = async (rawValue: string, format?: string) => {
    setScannerOpen(false);
    setScannedText(rawValue.slice(0, 400));
    const parsed = parseProductCode(rawValue, format);
    const code = parsed.barcode || parsed.sku;
    const sellerId = Number(draft.sellerId || sellerIds[0]);
    let catalogMatch: Awaited<ReturnType<typeof lookupSellerProductCode>>['data'] = null;
    if (code && sellerIds.includes(sellerId) && code.length <= 100) {
      try {
        const result = await lookupSellerProductCode(sellerId, code);
        catalogMatch = result.data;
      } catch {
        // Embedded QR fields can still be read when lookup fails.
      }
    }
    const validCategory = (id: string | undefined) =>
      id && flatCategories(categories).some((item) => String(item.id) === id) ? id : undefined;
    const candidates: Partial<Draft> = {};
    const categoryId = validCategory(catalogMatch ? String(catalogMatch.category_id) : parsed.categoryId);
    if (categoryId) candidates.categoryId = categoryId;
    const nameAr = catalogMatch?.name_ar || parsed.nameAr;
    const nameEn = catalogMatch?.name_en || parsed.nameEn;
    const descriptionAr = catalogMatch?.description_ar || parsed.descriptionAr;
    const descriptionEn = catalogMatch?.description_en || parsed.descriptionEn;
    if (nameAr) candidates.nameAr = nameAr;
    if (nameEn) candidates.nameEn = nameEn;
    if (descriptionAr) candidates.descriptionAr = descriptionAr;
    if (descriptionEn) candidates.descriptionEn = descriptionEn;
    if (catalogMatch) {
      candidates.price = (catalogMatch.price_halalas / 100).toFixed(2);
      candidates.vatClass = catalogMatch.vat_class;
    } else {
      if (parsed.price) candidates.price = parsed.price;
      if (parsed.vatClass) candidates.vatClass = parsed.vatClass;
      if (parsed.barcode) candidates.barcode = parsed.barcode;
      const newSku = parsed.sku || parsed.barcode;
      if (newSku) candidates.sku = newSku;
    }
    setDraft((current) => {
      const next = { ...current };
      for (const [key, value] of Object.entries(candidates)) {
        if (!value) continue;
        const field = key as keyof Draft;
        if (field === 'vatClass') {
          if (current.vatClass === 'standard') next.vatClass = value as Draft['vatClass'];
        } else if (!current[field].trim()) {
          Object.assign(next, { [field]: value });
        }
      }
      return next;
    });
    setFieldErrors({});
    setError('');
    setScanNotice(catalogMatch
      ? tr('هذا الرمز موجود بالفعل في المتجر. عُرضت البيانات المتاحة دون تكرار SKU أو الباركود.',
          'This code already exists in your store. Details were suggested without duplicating the SKU or barcode.')
      : Object.keys(candidates).length
        ? tr('تمت تعبئة الحقول الفارغة بالبيانات المقروءة. راجع كل البيانات قبل الحفظ.',
            'Recognized data filled blank fields. Review the details before saving.')
        : tr('تمت قراءة الرمز، لكن لا توجد به بيانات منتج معروفة. راجع النص المقروء.',
            'Code read but no product fields recognized. Review the scanned text.'));
  };

  const edit = (product: SellerProduct) => {
    if (!editable(product)) return;
    setSelected(product.id);
    setCoverFile(null);
    setCoverUrl('');
    setImageCardOpen(true);
    setScannerOpen(false);
    setScanNotice('');
    setScannedText('');
    setDraft({
      sellerId: String(product.seller_id),
      categoryId: String(product.category_id),
      nameAr: product.name_ar,
      nameEn: product.name_en,
      descriptionAr: product.description_ar ?? '',
      descriptionEn: product.description_en ?? '',
      price: (product.price_halalas / 100).toFixed(2),
      vatClass:
        product.vat_class === 'zero' || product.vat_class === 'exempt'
          ? product.vat_class
          : 'standard',
      vatJustification: product.vat_justification ?? '',
      sku: '',
      barcode: '',
    });
    setFormVisible(true);
    setFieldErrors({});
    setFormError('');
    setError('');
    setSuccess('');
  };

  const newProduct = (sku = '') => {
    setSelected(null);
    setCoverFile(null);
    setCoverUrl('');
    setImageCardOpen(true);
    setScannerOpen(false);
    setScanNotice('');
    setScannedText('');
    setDraft({ ...empty(String(sellerIds[0] ?? '')), sku: sku.trim() });
    setFormVisible(true);
    setFieldErrors({});
    setFormError('');
    setError('');
    setSuccess('');
  };

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const validation = collectErrors();
    setFieldErrors(validation);
    setFormError('');
    if (Object.keys(validation).length > 0) return;
    setConfirmation({ kind: 'save' });
  };

  const persist = async () => {
    if (busy) return;
    setConfirmation(null);
    const priceHalalas = Math.round(Number(draft.price) * 100);
    const input: SellerProductInput = {
      category_id: Number(draft.categoryId),
      name_ar: draft.nameAr.trim(),
      name_en: draft.nameEn.trim(),
      description_ar: draft.descriptionAr.trim(),
      description_en: draft.descriptionEn.trim(),
      price_halalas: priceHalalas,
      vat_class: draft.vatClass,
      vat_justification: draft.vatClass === 'standard' ? null : draft.vatJustification.trim(),
    };

    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const response =
        selected === null
          ? await createSellerProduct(Number(draft.sellerId), input)
          : await updateSellerProduct(selected, input);
      const productId = response.data.id;
      setSelected(productId);
      if (selected === null && draft.sku.trim()) {
        try {
          await addSellerProductVariant(productId, {
            sku: draft.sku.trim(),
            barcode: draft.barcode.trim() || null,
          });
          setDraft((current) => ({ ...current, sku: '', barcode: '' }));
          setSuccess(
            tr(
              'تم حفظ المنتج ورمز SKU. يمكنك رفع الصورة وإرسال المنتج للمراجعة.',
              'Product and SKU saved. You can upload an image and submit for review.',
            ),
          );
          setQuickSku('');
        } catch (cause) {
          setError(explainApiError(cause, tr(
            'تم حفظ المسودة، لكن تعذرت إضافة SKU. عدّل الرمز وأضفه من قسم وحدة البيع أدناه.',
            'Draft saved, but SKU could not be added. Correct it in the variant section below.',
          )));
        }
      } else {
        setSuccess(tr('تم تحديث مسودة المنتج.', 'Product draft updated.'));
      }
      onUpdated();
    } catch (cause) {
      if (!displayApiFieldErrors(cause)) {
        setFormError(tr('تعذر حفظ المنتج. تحقق من البيانات أو الاتصال ثم أعد المحاولة.', 'Product could not be saved. Check details or connection and retry.'));
      }
    } finally {
      setBusy(false);
    }
  };

  const addVariant = async (productId: number) => {
    if (!draft.sku.trim() || busy) {
      setError(tr('أدخل رمز SKU أولاً.', 'Enter an SKU first.'));
      return;
    }
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await addSellerProductVariant(productId, {
        sku: draft.sku.trim(),
        barcode: draft.barcode.trim() || null,
      });
      setDraft((current) => ({ ...current, sku: '', barcode: '' }));
      setSuccess(
        tr(
          'تمت إضافة وحدة البيع. يمكنك إرسال المنتج للمراجعة.',
          'Variant added. You can submit the product for review.',
        ),
      );
    } catch (cause) {
      setError(explainApiError(cause, tr(
        'تعذر إضافة وحدة البيع. تحقق من SKU والباركود.',
        'Could not add the variant. Check SKU and barcode.',
      )));
    } finally {
      setBusy(false);
    }
  };

  const explainApiError = (cause: unknown, fallback: string): string => {
    if (!isApiError(cause)) {
      return cause instanceof Error && cause.message ? cause.message : fallback;
    }
    const details = Object.entries(cause.fieldErrors)
      .flatMap(([field, messages]) => messages.map((message) => field + ': ' + message));
    const prefix = cause.status === null ? '' : 'HTTP ' + cause.status + ' — ';
    const message = cause.message?.trim() || fallback;
    const specific = details.filter((item) => !message.includes(item.split(': ').slice(1).join(': ')));
    return prefix + message + (cause.code ? ' [' + cause.code + ']' : '') +
      (specific.length ? '\n' + specific.join('\n') : '');
  };

  const submit = (productId: number) => {
    if (busy) return;
    setFormError('');
    setConfirmation({ kind: 'publish', productId });
  };

  const publish = async (productId: number) => {
    if (busy) return;
    setConfirmation(null);
    setBusy(true);
    setWorkingId(productId);
    setError('');
    setSuccess('');
    try {
      const result = await submitSellerProduct(productId);
      setSuccess(
        result.data.status === 'published'
          ? tr('تم نشر المنتج مباشرة.', 'Product published immediately.')
          : tr('تم إرسال المنتج للمراجعة، ولم يُنشر بعد.', 'Product submitted for review; it is not yet published.'),
      );
      if (selected === productId) setFormVisible(false);
      onUpdated();
    } catch (cause) {
      displayApiFieldErrors(cause);
      const message = explainApiError(
        cause,
        tr('تعذر نشر المنتج. تحقق من متطلبات النشر ثم أعد المحاولة.',
          'Could not publish the product. Check the publishing requirements and try again.'),
      );
      setFormError(message);
      setError(message);
      if (selected === productId) setFormVisible(true);
    } finally {
      setBusy(false);
      setWorkingId(null);
    }
  };

  const deleteDraft = async (productId: number) => {
    if (busy) return;
    setConfirmation(null);
    setBusy(true);
    setWorkingId(productId);
    setError('');
    setFormError('');
    setSuccess('');
    try {
      await deleteSellerProduct(productId);
      if (selected === productId) {
        setSelected(null);
        setFormVisible(false);
        setCoverFile(null);
      }
      setSuccess(tr('تم حذف مسودة المنتج.', 'Draft product deleted.'));
      onUpdated();
    } catch (cause) {
      setError(explainApiError(cause, tr('تعذر حذف المسودة.', 'Could not delete the draft.')));
    } finally {
      setBusy(false);
      setWorkingId(null);
    }
  };

  const downloadTemplate = async (format: 'csv' | 'xlsx') => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const file = format === 'xlsx' ? await sellerCatalogExcelTemplate() : await sellerCatalogTemplate();
      const objectUrl = URL.createObjectURL(file.blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = file.filename ?? ('seller-products-template.' + format);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
    } catch (cause) {
      setError(explainApiError(cause, tr('تعذر تحميل القالب.', 'Could not download template.')));
    } finally {
      setBusy(false);
    }
  };

  const uploadCover = async () => {
    if (selected === null || busy) return;
    const imageUrl = coverUrl.trim();
    if (!coverFile && !/^https:\/\/[^\s]+$/i.test(imageUrl)) {
      setError(tr('اختر صورة أو أدخل رابط HTTPS صالحًا.', 'Choose an image or enter a valid HTTPS URL.'));
      return;
    }
    if (coverFile && (!['image/jpeg', 'image/png', 'image/webp'].includes(coverFile.type) ||
        coverFile.size > 5 * 1024 * 1024)) {
      setError(tr('اختر صورة JPG أو PNG أو WebP لا تتجاوز 5 ميجابايت.', 'Choose a JPG, PNG or WebP image under 5 MB.'));
      return;
    }
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await uploadSellerProductImage(selected, coverFile ?? imageUrl);
      setCoverFile(null);
      setCoverUrl('');
      setSuccess(tr('تم حفظ صورة المنتج.', 'Product cover image saved.'));
      onUpdated();
    } catch (cause) {
      setError(explainApiError(cause, uploadErrorMessage(cause, ar ? 'ar' : 'en', 'image')));
    } finally {
      setBusy(false);
    }
  };

  const uploadCsv = async (dryRun = false) => {
    const sellerId = Number(importSeller || sellerIds[0]);
    if (busy || importFile === null || !sellerIds.includes(sellerId)) return;
    if (importFile.size > 20 * 1024 * 1024 || !/[.](csv|xlsx)$/i.test(importFile.name)) {
      setError(tr('اختر ملف CSV أو Excel لا يتجاوز 20 ميجابايت.', 'Choose a CSV or Excel file under 20 MB.'));
      return;
    }
    if (
      !dryRun &&
      !window.confirm(tr('استيراد المنتجات كمسودات فقط؟', 'Import products as drafts only?'))
    )
      return;
    setBusy(true);
    setError('');
    setImportIssues([]);
    setSuccess('');
    try {
      const result = await importSellerProductCsv(sellerId, importFile, dryRun);
      if (dryRun) {
        setCsvPreview({
          valid_rows: result.data.valid_rows ?? 0,
          created_drafts: 0,
          preview: result.data.preview ?? [],
        });
        setSuccess(
          tr('تم فحص الملف دون إضافة منتجات.', 'CSV validated without importing products.'),
        );
      } else {
        setImportFile(null);
        setCsvPreview(null);
        setSuccess(
          tr('تم استيراد مسودات المنتجات: ', 'Imported product drafts: ') +
            result.data.created_drafts,
        );
        onUpdated();
      }
    } catch (cause) {
      setCsvPreview(null);
      const fields = isApiError(cause) ? cause.fieldErrors : null;
      const validation = fields
        ? Object.values(fields).flat().filter((message): message is string => typeof message === 'string')
        : [];
      if (validation.length > 0) {
        setImportIssues(validation);
        setError('');
      } else {
        setImportIssues([]);
        setError(uploadErrorMessage(cause, ar ? 'ar' : 'en', 'csv'));
      }
    } finally {
      setBusy(false);
    }
  };



  return (
    <section>
      {sellerIds.length > 0 && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!quickSku.trim()) {
              setError(tr('أدخل رمز SKU أولاً.', 'Enter an SKU first.'));
              return;
            }
            newProduct(quickSku);
          }}
          style={{ ...card, marginBottom: 16 }}
        >
          <h3>{tr('إضافة منتج بواسطة SKU', 'Add product by SKU')}</h3>
          <p>
            {tr(
              'أدخل رمز SKU للبدء، ثم أكمل بيانات المنتج. سيتم حفظ SKU تلقائياً عند إنشاء المسودة.',
              'Enter an SKU to start, then complete product details. The SKU will be saved automatically with the draft.',
            )}
          </p>
          <div style={{ ...controls, alignItems: 'end' }}>
            <label style={field}>
              {tr('SKU جديد *', 'New SKU *')}
              <input
                required
                autoComplete="off"
                maxLength={100}
                value={quickSku}
                onChange={(event) => setQuickSku(event.target.value)}
                placeholder="SKU-001"
              />
            </label>
            <button type="submit" style={button} disabled={busy}>
              {tr('متابعة إضافة المنتج', 'Continue adding product')}
            </button>
          </div>
        </form>
      )}
      <div style={{ ...controls, marginBottom: 12 }}>
        {sellerIds.length > 0 && (
          <button type="button" style={button} onClick={() => newProduct()}>
            {tr('إضافة منتج جديد', 'Add new product')}
          </button>
        )}
        <button
          type="button"
          style={button}
          disabled={busy}
          onClick={() => void downloadTemplate('xlsx')}
        >
          {tr('تحميل قالب Excel بالقوائم المنسدلة', 'Download Excel template with dropdowns')}
        </button>
        <button
          type="button"
          style={button}
          disabled={busy}
          onClick={() => void downloadTemplate('csv')}
        >
          {tr('تحميل قالب CSV', 'Download CSV template')}
        </button>
      </div>
      {sellerIds.length > 0 && (
        <div className="seller-import-card" style={card}>
          <h3>{tr('استيراد المنتجات عبر Excel أو CSV', 'Import products using Excel or CSV')}</h3>
          <p className="seller-required-hint">
            {tr('في القالب: SKU والتصنيف والاسمان والسعر وفئة الضريبة إجبارية. المتجر والوصف والباركود اختيارية؛ المتجر يُحدد من هذه الصفحة.', 'In the template, SKU, category, both names, price and VAT class are required. Store, descriptions and barcode are optional; the store is selected on this page.')}
          </p>
          <p className="seller-required-hint">
            {tr(
              'قالبا CSV وExcel يحتويان على بيانات المنتج واسمَي وحدة البيع ورابط صورة HTTPS الاختياري. ويدعم Excel إضافة صورة من إدراج > صور > وضع فوق الخلايا في عمود الصورة، مع قوائم منسدلة للمتجر والتصنيف والضريبة.',
              'Both templates include product fields, optional variant names, and a HTTPS image URL column. Excel additionally supports pictures placed over cells in the image column, plus dropdowns for store, category and VAT.',
            )}
          </p>
          <p>
            {tr(
              'في Excel ضع الصورة فوق الخلية في العمود N بنفس صف المنتج (بدون دالة IMAGE). CSV يدعم روابط الصور فقط. ويمكن تعديل الصورة من بطاقة المرفقات بعد الاستيراد.',
              'In Excel, place each picture over column N in the matching product row (not as an IMAGE() formula). CSV supports image URLs only. You can also change a cover image from the product attachment card after import.',
            )}
          </p>
          <p>
            {tr(
              'أعمدة القالب تطابق حقول «منتج جديد». اختر المتجر عند الاستيراد، واكتب اسم التصنيف أو رقمه والسعر بالريال (مثال: 5.75). يمكن ترك خانة المتجر فارغة في الملف.',
              'The columns match Add Product. Choose the store at import time; enter a category name or number and price in SAR (e.g. 5.75). The Store cell can be blank.',
            )}
          </p>
          <p>
            {tr(
              'قائمة الضريبة في Excel وCSV: قياسية (15%)، صفرية (0%)، معفى من الضريبة. للحالات الصفرية والمعفاة املأ عمود السبب النظامي (O) بما لا يقل عن 15 حرفًا؛ ستُنشأ مسودات تتطلب مراجعة الإدارة. الوصف والباركود اختياريان.',
              'Excel and CSV VAT options: Standard (15%), Zero-rated (0%), Exempt. For zero-rated or exempt products, complete column O with a legal justification of at least 15 characters. Imported drafts require administrative review.',
            )}
          </p>
          <div className="seller-import-fields" style={controls}>
            <label style={field}>
              {tr('المتجر', 'Store')}
              <select
                value={importSeller || String(sellerIds[0])}
                onChange={(event) => {
                  setImportSeller(event.target.value);
                  setCsvPreview(null);
                  setImportIssues([]);
                }}
              >
                {sellerIds.map((id) => (
                  <option key={id} value={id}>
                    {ar
                      ? allowed.find((m) => m.seller_id === id)?.name_ar
                      : allowed.find((m) => m.seller_id === id)?.name_en}
                  </option>
                ))}
              </select>
            </label>
            <label className="seller-upload" style={field}>
              <span>{tr('ملف Excel أو CSV *', 'Excel or CSV file *')}</span>
              <input
                type="file"
                accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={(event) => {
                  setImportFile(event.target.files?.[0] ?? null);
                  setCsvPreview(null);
                  setImportIssues([]);
                }}
              />
              <span className="seller-upload-button">{tr('اختيار ملف Excel أو CSV', 'Choose Excel or CSV file')}</span>
              <span className="seller-upload-name">
                {importFile?.name ?? tr('لم يتم اختيار ملف بعد', 'No file selected')}
              </span>
            </label>
          </div>
          <div className="seller-import-actions" style={{ ...controls, marginTop: 12 }}>
            <button
              type="button"
              style={button}
              disabled={busy || importFile === null}
              onClick={() => void uploadCsv(true)}
            >
              {tr('فحص ومعاينة الملف', 'Validate & preview file')}
            </button>
            <button
              type="button"
              style={button}
              disabled={busy || importFile === null}
              onClick={() => void uploadCsv(false)}
            >
              {tr('استيراد المسودات', 'Import drafts')}
            </button>
          </div>
          {importIssues.length > 0 && (
            <div className="seller-import-issues" role="alert" aria-live="assertive">
              <div className="seller-import-issues-head">
                <strong>{tr('تعذر استيراد الملف — تفاصيل الأخطاء', 'Import failed — validation details')}</strong>
                <span>{importIssues.length} {tr('ملاحظات', 'issues')}</span>
              </div>
              <p>{tr(
                'راجِع الصفوف والأعمدة الموضحة أدناه، صحّح القيم في Excel أو CSV ثم أعد رفع الملف. لم يتم استيراد أي منتج.',
                'Check the rows and columns below, correct the values in Excel or CSV, then upload again. No products were imported.',
              )}</p>
              <ol>
                {importIssues.map((issue, index) => (
                  <li key={index}>{issue}</li>
                ))}
              </ol>
            </div>
          )}
          {csvPreview && (
            <div role="status" style={{ marginTop: 12, overflowX: 'auto' }}>
              <strong>
                {tr('صفوف سليمة: ', 'Valid rows: ')}
                {csvPreview.valid_rows}
              </strong>
              <p>
                {tr(
                  'معاينة أول 10 منتجات. لم تُضف أي منتجات بعد.',
                  'First 10 products previewed. Nothing has been imported yet.',
                )}
              </p>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>{tr('رمز المنتج (SKU)', 'Product code (SKU)')}</th>
                    <th>{tr('اسم المنتج', 'Product')}</th>
                    <th>{tr('السعر (ر.س)', 'Price (SAR)')}</th>
                  </tr>
                </thead>
                <tbody>
                  {csvPreview.preview.map((row) => (
                    <tr key={row.sku}>
                      <td>{row.sku}</td>
                      <td>{ar ? row.name_ar : row.name_en}</td>
                      <td>{(row.price_halalas / 100).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      {sellerIds.length === 0 && (
        <p>
          {tr(
            'يمكن للمالك ومدير الفرع فقط إضافة وتعديل المنتجات.',
            'Only owners and branch managers can add or edit products.',
          )}
        </p>
      )}
      {!formVisible && (error || formError) && (
        <div className="seller-form-message" role="alert">{(formError || error).split('\n').map((line, index) => <p key={index} style={{ margin: '2px 0' }}>{line}</p>)}</div>
      )}
      {!formVisible && success && <p role="status">{success}</p>}
      {formVisible && (
        <div className="seller-product-form-card" style={card}>
          <h3>
            {selected === null
              ? tr('منتج جديد', 'New product')
              : tr('تعديل مسودة', 'Edit draft')}{' '}
          </h3>
          <div className="seller-product-scanner-section">
            <button type="button" className="seller-product-scan-button" disabled={busy}
              onClick={() => setScannerOpen((open) => !open)}>
              <span aria-hidden="true">▣</span>
              {scannerOpen ? tr('إغلاق الكاميرا', 'Close camera')
                : tr('مسح Barcode / QR بالكاميرا', 'Scan Barcode / QR with camera')}
            </button>
            {scannerOpen && (
              <Suspense fallback={<p>{tr('جار تجهيز الماسح…', 'Preparing scanner…')}</p>}>
                <ProductCameraScanner ar={ar} onRead={(text, format) => void applyScan(text, format)}
                  onClose={() => setScannerOpen(false)}/>
              </Suspense>
            )}
            {scanNotice && <p className="seller-form-success" role="status">{scanNotice}</p>}
            {scannedText && (
              <details className="seller-scanned-raw">
                <summary>{tr('عرض النص المقروء من الرمز', 'Show scanned code content')}</summary>
                <pre dir="auto">{scannedText}</pre>
              </details>
            )}
          </div>
          <form onSubmit={save} noValidate>
            <p className="seller-required-hint">{tr('الحقول المميزة بـ * إلزامية.', 'Fields marked * are required.')}</p>
            {(formError || error) && (
              <div className="seller-form-message" role="alert">{(formError || error).split('\n').map((line, index) => <p key={index} style={{ margin: '2px 0' }}>{line}</p>)}</div>
            )}
            {success && <div className="seller-form-success" role="status">{success}</div>}
            {selected === null && (
              <div style={{ ...controls, marginBottom: 12 }}>
                <label style={field}>
                  {tr('SKU *', 'SKU *')}
                  <input
                    required
                    maxLength={100}
                    {...fieldProps('sku')}
                  value={draft.sku}
                    onChange={(event) => set('sku', event.target.value)}
                  />
                {fieldError('sku')}
                </label>
                <label style={field}>
                  {tr('الباركود', 'Barcode')}
                  <input
                    maxLength={100}
                    {...fieldProps('barcode')}
                  value={draft.barcode}
                    onChange={(event) => set('barcode', event.target.value)}
                  />
                {fieldError('barcode')}
                </label>
              </div>
            )}
            <div style={controls}>
              <label style={field}>
                {tr('المتجر *', 'Store *')}
                <select
                  required
                  {...fieldProps('sellerId')}
                  value={draft.sellerId}
                  disabled={selected !== null}
                  onChange={(event) => set('sellerId', event.target.value)}
                >
                  <option value="">{tr('اختر المتجر', 'Select store')}</option>
                  {sellerIds.map((id) => {
                    const membership = allowed.find((item) => item.seller_id === id);
                    return (
                      <option key={id} value={id}>
                        {membership ? (ar ? membership.name_ar : membership.name_en) : id}
                      </option>
                    );
                  })}
                </select>
                {fieldError('sellerId')}
              </label>
              <label style={field}>
                {tr('التصنيف *', 'Category *')}
                <select
                  required
                  {...fieldProps('categoryId')}
                  value={draft.categoryId}
                  onChange={(event) => set('categoryId', event.target.value)}
                >
                  <option value="">{tr('اختر التصنيف', 'Select category')}</option>
                  {flatCategories(categories).map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </select>
                {fieldError('categoryId')}
              </label>
            </div>
            <div style={controls}>
              <label style={field}>
                {tr('اسم المنتج (AR) *', 'Product name (AR) *')}
                <input
                  required
                  maxLength={180}
                  {...fieldProps('nameAr')}
                  value={draft.nameAr}
                  onChange={(event) => set('nameAr', event.target.value)}
                />
                {fieldError('nameAr')}
              </label>
              <label style={field}>
                {tr('اسم المنتج (EN) *', 'Product name (EN) *')}
                <input
                  required
                  maxLength={180}
                  {...fieldProps('nameEn')}
                  value={draft.nameEn}
                  onChange={(event) => set('nameEn', event.target.value)}
                />
                {fieldError('nameEn')}
              </label>
            </div>
            <div style={controls}>
              <label style={field}>
                {tr('الوصف (AR)', 'Description (AR)')}
                <textarea
                  maxLength={10000}
                  {...fieldProps('descriptionAr')}
                  value={draft.descriptionAr}
                  onChange={(event) => set('descriptionAr', event.target.value)}
                />
                {fieldError('descriptionAr')}
              </label>
              <label style={field}>
                {tr('الوصف (EN)', 'Description (EN)')}
                <textarea
                  maxLength={10000}
                  {...fieldProps('descriptionEn')}
                  value={draft.descriptionEn}
                  onChange={(event) => set('descriptionEn', event.target.value)}
                />
                {fieldError('descriptionEn')}
              </label>
            </div>
            <div style={controls}>
              <label style={field}>
                {tr('السعر (ر.س) *', 'Price (SAR) *')}
                <input
                  type="number"
                  required
                  min="1"
                  max="10"
                  step="0.01"
                  {...fieldProps('price')}
                  value={draft.price}
                  onChange={(event) => set('price', event.target.value)}
                />
                {fieldError('price')}
              </label>
              <label style={field}>
                {tr('الضريبة *', 'VAT *')}
                <select
                  required
                  {...fieldProps('vatClass')}
                  value={draft.vatClass}
                  onChange={(event) => {
                    const val = event.target.value;
                    if (val === 'standard' || val === 'zero' || val === 'exempt')
                      setDraft((current) => ({ ...current, vatClass: val, vatJustification: val === 'standard' ? '' : current.vatJustification }));
                  }}
                >
                  <option value="standard">{tr('ضريبة قياسية (15%)', 'Standard VAT (15%)')}</option>
                  <option value="zero">{tr('ضريبة صفرية (0%)', 'Zero-rated VAT (0%)')}</option>
                  <option value="exempt">{tr('معفى من الضريبة', 'VAT exempt')}</option>
                </select>
                {fieldError('vatClass')}
                <small>{tr('تُستخدم القياسية افتراضيًا. الصفرية والإعفاء للحالات المؤهلة نظاميًا فقط.', 'Standard VAT is the default. Zero-rated and exempt are only for legally qualifying supplies.')}</small>
              </label>
            </div>
            {draft.vatClass !== 'standard' && (
              <div style={{ ...controls, marginTop: 12 }}>
                <label style={field}>
                  {tr('السبب النظامي لتطبيق الضريبة *', 'Legal basis for VAT treatment *')}
                  <textarea
                    {...fieldProps('vatJustification')}
                    required
                    minLength={15}
                    maxLength={500}
                    rows={3}
                    value={draft.vatJustification}
                    onChange={(event) => set('vatJustification', event.target.value)}
                    placeholder={tr('اذكر المادة أو الحالة النظامية التي تجعل المنتج مؤهلًا لهذه المعاملة، مع أي تفاصيل داعمة.', 'Describe the applicable legal provision or eligible transaction and supporting details.')}
                  />
                  {fieldError('vatJustification')}
                  <small>{tr('لن يتم النشر المباشر؛ يلزم التحقق والموافقة من الإدارة.', 'Direct publishing is disabled; administrative review is required.')}</small>
                </label>
              </div>
            )}
            <div style={{ ...controls, marginTop: 12 }}>
              <button style={button} type="submit" disabled={busy}>
                {tr('حفظ المسودة', 'Save draft')}
              </button>
              <button style={button} type="button" onClick={() => setFormVisible(false)}>
                {tr('إغلاق', 'Close')}
              </button>
            </div>
          </form>
          {selected !== null && (
            <section className="seller-product-image-card">
              <button type="button" className="seller-product-image-toggle"
                aria-expanded={imageCardOpen} onClick={() => setImageCardOpen((value) => !value)}>
                {tr('مرفقات المنتج — صورة الغلاف', 'Product attachments — cover image')}
                <span aria-hidden="true">{imageCardOpen ? '−' : '+'}</span>
              </button>
              {imageCardOpen && (
                <div className="seller-product-image-body">
                  <p>{tr('يمكنك رفع صورة من الجهاز أو إدخال رابط صورة HTTPS.', 'Upload an image file or use an HTTPS image URL.')}</p>
                  <div className="seller-product-image-layout">
                    <div className="seller-product-image-controls">
                      <label className="seller-upload" style={field}>
                        <span>{tr('ملف الصورة (حتى 5 MB)', 'Image file (up to 5 MB)')}</span>
                        <input type="file" accept="image/jpeg,image/png,image/webp"
                          onChange={(event) => { setCoverFile(event.target.files?.[0] ?? null); setCoverUrl(''); }} />
                        <span className="seller-upload-button">{tr('اختيار صورة', 'Choose image')}</span>
                        <span className="seller-upload-name">{coverFile?.name ?? tr('لا توجد صورة محددة', 'No selected image')}</span>
                      </label>
                      <label style={field}>
                        {tr('أو رابط الصورة (HTTPS)', 'Or image URL (HTTPS)')}
                        <input type="url" dir="ltr" maxLength={2048}
                          placeholder="https://example.com/image.jpg" value={coverUrl}
                          onChange={(event) => { setCoverUrl(event.target.value); if (event.target.value) setCoverFile(null); }} />
                      </label>
                      <button type="button" style={button} disabled={busy || (!coverFile && !coverUrl.trim())}
                        onClick={() => void uploadCover()}>
                        {tr('حفظ صورة المنتج', 'Save product image')}
                      </button>
                    </div>
                    {!coverFile && !coverUrl.trim() && products.find((product) => product.id === selected)?.image_path && (
                      <div className="seller-product-image-preview">
                        <img
                          src={new URL('/storage/' + (products.find((product) => product.id === selected)?.image_path ?? '').split('/').map(encodeURIComponent).join('/'), env.apiBaseUrl).toString()}
                          alt={tr('صورة المنتج الحالية', 'Current product image')}
                        />
                        <span>{tr('الصورة الحالية', 'Current image')}</span>
                      </div>
                    )}
                    {coverFile && (
                      <div className="seller-product-image-preview">
                        <span>{tr('الصورة المختارة:', 'Selected image:')}</span>
                        {localCoverPreview && <img src={localCoverPreview} alt={tr('معاينة صورة المنتج', 'Selected image preview')} />}
                        <strong>{coverFile.name}</strong>
                      </div>
                    )}
                    {!coverFile && /^https:\/\//i.test(coverUrl.trim()) && (
                      <div className="seller-product-image-preview">
                        <img key={coverUrl} src={coverUrl} alt={tr('معاينة الصورة', 'Image preview')} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          )}
          {selected !== null && (
            <div style={{ ...card, marginTop: 12 }}>
              <h4>{tr('إضافة وحدة بيع / باركود', 'Add variant / barcode')}</h4>
              <div style={controls}>
                <label style={field}>
                  {tr('SKU *', 'SKU *')}
                  <input
                    maxLength={100}
                    value={draft.sku}
                    onChange={(event) => set('sku', event.target.value)}
                  />
                </label>
                <label style={field}>
                  {tr('الباركود', 'Barcode')}
                  <input
                    maxLength={100}
                    value={draft.barcode}
                    onChange={(event) => set('barcode', event.target.value)}
                  />
                </label>
              </div>
              <div style={{ ...controls, marginTop: 12 }}>
                <button
                  type="button"
                  style={button}
                  disabled={busy}
                  onClick={() => void addVariant(selected)}
                >
                  {tr('إضافة وحدة بيع', 'Add variant')}
                </button>
                <button
                  type="button"
                  style={button}
                  disabled={busy || workingId === selected}
                  onClick={() => void submit(selected)}
                >
                  {tr('نشر / إرسال المنتج', 'Publish / Submit product')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {products.length === 0 && (
        <p>{tr('لا توجد منتجات لهذه الحالة.', 'No products for this status.')}</p>
      )}
      {products.map((product) => (
        <article key={product.id} style={card}>
          <div className="seller-product-list-heading">
            <strong>{ar ? product.name_ar : product.name_en}</strong>
            {product.sku && (
              <span className="seller-product-sku" title={tr('رمز المنتج SKU', 'Product SKU')}>
                <span>SKU</span>
                <bdi dir="ltr">{product.sku}</bdi>
              </span>
            )}
          </div>
          <p>
            {tr('السعر', 'Price')}: {(product.price_halalas / 100).toFixed(2)} {tr('ر.س', 'SAR')} ·{' '}
            {tr('الحالة', 'Status')}: {productStatusLabels[product.status] ?? product.status}
          </p>
          {product.status === 'rejected' && product.rejection_reason && (
            <p role="status" style={{ padding: 10, border: '1px solid #d8e1db', borderRadius: 8 }}>
              <strong>{tr('سبب رفض المنتج:', 'Rejection reason:')}</strong>{' '}
              {product.rejection_reason}
            </p>
          )}
          <small>
            {tr('رقم التصنيف', 'Category number')} #{product.category_id} · {tr('رقم المتجر', 'Store number')} #
            {product.seller_id}
          </small>
          {editable(product) && sellerIds.includes(product.seller_id) && (
            <div style={{ ...controls, marginTop: 10 }}>
              <button type="button" style={button} disabled={busy} onClick={() => edit(product)}>
                {tr('تعديل', 'Edit')}
              </button>
              {product.status === 'draft' && (
                <>
                  <button
                    type="button"
                    style={button}
                    disabled={busy}
                    onClick={() => void submit(product.id)}
                  >
                    {tr('نشر / إرسال المنتج', 'Publish / Submit product')}
                  </button>
                  <button
                    type="button"
                    title={tr('حذف المسودة', 'Delete draft')}
                    aria-label={tr('حذف مسودة المنتج', 'Delete draft product')}
                    disabled={busy}
                    onClick={() => setConfirmation({ kind: 'delete', productId: product.id })}
                    style={{ ...button, color: '#b42318', border: '1px solid #e9b3ad', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m5 4v7m4-7v7"/>
                    </svg>
                    {tr('حذف', 'Delete')}
                  </button>
                </>
              )}
            </div>
          )}
        </article>
      ))}
      {confirmation && (
        <div className="seller-confirm-overlay" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !busy) setConfirmation(null);
        }}>
          <div className="seller-confirm-dialog" role="dialog" aria-modal="true"
               aria-labelledby="seller-confirm-title" aria-describedby="seller-confirm-description"
               onKeyDown={(event) => { if (event.key === 'Escape' && !busy) setConfirmation(null); }}>
            <h3 id="seller-confirm-title">
              {confirmation.kind === 'save'
                ? tr('تأكيد حفظ المنتج', 'Confirm saving product')
                : confirmation.kind === 'delete'
                  ? tr('تأكيد حذف المسودة', 'Confirm deleting draft')
                  : tr('تأكيد نشر المنتج', 'Confirm publishing product')}
            </h3>
            <p id="seller-confirm-description">
              {confirmation.kind === 'save'
                ? tr('هل تريد حفظ بيانات المنتج كمسودة؟ يمكنك إكمال الصورة والتفاصيل بعد الحفظ.', 'Save this product as a draft? You can add an image and more details afterwards.')
                : confirmation.kind === 'delete'
                  ? tr('هل تريد حذف هذه المسودة نهائياً؟ لا يمكن التراجع عن هذا الإجراء.', 'Permanently delete this draft? This action cannot be undone.')
                  : tr('هل تريد إكمال المنتج؟ في العرض التجريبي ينشر مباشرة، وإلا يُرسل للمراجعة.', 'Complete this product? Demo mode publishes it immediately; otherwise it is sent for review.')}
            </p>
            <div className="seller-confirm-actions">
              <button type="button" onClick={() => setConfirmation(null)} disabled={busy}>{tr('إلغاء', 'Cancel')}</button>
              <button type="button" className="seller-confirm-primary" disabled={busy} autoFocus
                onClick={() => {
                  if (confirmation.kind === 'save') void persist();
                  else if (confirmation.kind === 'delete' && confirmation.productId !== undefined) void deleteDraft(confirmation.productId);
                  else if (confirmation.productId !== undefined) void publish(confirmation.productId);
                }}>{confirmation.kind === 'delete' ? tr('حذف المسودة', 'Delete draft') : tr('تأكيد', 'Confirm')}</button>
            </div>
          </div>
        </div>
      )}
      <p>
        {tr(
          'تُعرض المنتجات على دفعات. يمكن النشر المباشر للحساب التجريبي المصرّح له، وبقية الحسابات تتطلب مراجعة الإدارة.',
          'Products are listed in batches. Authorized demo accounts can publish directly; other accounts require admin review.',
        )}
      </p>
    </section>
  );
}

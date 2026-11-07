import { lazy, Suspense, useEffect, useState, type FormEvent } from 'react';
import { parseProductCode } from './productCode';
const ProductCameraScanner = lazy(() =>
  import('./ProductCameraScanner').then((m) => ({ default: m.ProductCameraScanner })),
);
import { useTranslation } from 'react-i18next';
import { isApiError } from '@/shared/api';
import {
  addSellerProductVariant,
  createSellerProduct,
  importSellerProductCsv,
  uploadSellerProductImage,
  sellerCategories,
  lookupSellerProductCode,
  sellerCatalogTemplate,
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
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importSeller, setImportSeller] = useState('');
  const [csvPreview, setCsvPreview] = useState<SellerCsvPreview | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [quickSku, setQuickSku] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannedText, setScannedText] = useState('');
  const [scanNotice, setScanNotice] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof Draft, string>>>({});
  const [formError, setFormError] = useState('');
  const [confirmation, setConfirmation] = useState<{ kind: 'save' | 'publish'; productId?: number } | null>(null);

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
      description_en: 'descriptionEn', price_halalas: 'price', vat_class: 'vatClass',
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

  const applyScan = async (rawValue: string) => {
    setScannerOpen(false);
    setScannedText(rawValue.slice(0, 400));
    const parsed = parseProductCode(rawValue);
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
        } catch {
          setError(
            tr(
              'تم حفظ المسودة، لكن تعذرت إضافة SKU (ربما مستخدم بالفعل). عدّل الرمز وأضفه من قسم وحدة البيع أدناه.',
              'Draft saved, but SKU could not be added (possibly already in use). Change it and add it in the variant section below.',
            ),
          );
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
    } catch {
      setError(
        tr(
          'تعذر إضافة الوحدة. تأكد من عدم تكرار SKU أو الباركود.',
          'Could not add variant. Make sure SKU and barcode are unique.',
        ),
      );
    } finally {
      setBusy(false);
    }
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
      if (!displayApiFieldErrors(cause)) {
        setFormError(tr('تعذر نشر المنتج. تحقق من حفظ المسودة وإضافة SKU وصورة المنتج.', 'Could not publish. Save the draft and add a SKU and product image.'));
      }
      if (selected === productId) setFormVisible(true);
    } finally {
      setBusy(false);
      setWorkingId(null);
    }
  };

  const downloadTemplate = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const file = await sellerCatalogTemplate();
      const objectUrl = URL.createObjectURL(file.blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = file.filename ?? 'seller-products-template.csv';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      setError(tr('تعذر تحميل قالب CSV.', 'Could not download the CSV template.'));
    } finally {
      setBusy(false);
    }
  };

  const uploadCover = async () => {
    if (selected === null || coverFile === null || busy) return;
    if (!coverFile.type.startsWith('image/') || coverFile.size > 5 * 1024 * 1024) {
      setError(tr('الصورة يجب أن تكون بحد أقصى 5 ميجابايت.', 'Image must be at most 5 MB.'));
      return;
    }
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await uploadSellerProductImage(selected, coverFile);
      setCoverFile(null);
      setSuccess(tr('تم حفظ صورة المنتج.', 'Product cover image uploaded.'));
      onUpdated();
    } catch {
      setError(
        tr(
          'تعذر رفع الصورة. اختر ملف صورة صالحًا لمسودة.',
          'Image upload failed. Select a valid image for a draft.',
        ),
      );
    } finally {
      setBusy(false);
    }
  };

  const uploadCsv = async (dryRun = false) => {
    const sellerId = Number(importSeller || sellerIds[0]);
    if (busy || importFile === null || !sellerIds.includes(sellerId)) return;
    if (importFile.size > 1024 * 1024 || !/[.]csv$/i.test(importFile.name)) {
      setError(tr('اختر ملف CSV لا يتجاوز 1 ميجابايت.', 'Choose a CSV file under 1 MB.'));
      return;
    }
    if (
      !dryRun &&
      !window.confirm(tr('استيراد المنتجات كمسودات فقط؟', 'Import products as drafts only?'))
    )
      return;
    setBusy(true);
    setError('');
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
      const validation =
        cause && typeof cause === 'object' && 'fieldErrors' in cause
          ? (cause as { fieldErrors?: Record<string, string[]> }).fieldErrors?.file
          : null;
      setError(
        validation?.join(' | ') ??
          tr(
            'فشل الاستيراد. استخدم القالب الجديد دون تغيير عناوينه، وتأكد من اسم أو رقم التصنيف والسعر بالريال وعدم تكرار SKU.',
            'Import failed. Check template columns, categories, prices and duplicate SKUs.',
          ),
      );
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
              {tr('رمز SKU الجديد (إجباري)', 'New SKU code (required)')}
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
          onClick={() => void downloadTemplate()}
        >
          {tr('تحميل قالب CSV', 'Download CSV template')}
        </button>
      </div>
      {sellerIds.length > 0 && (
        <div className="seller-import-card" style={card}>
          <h3>{tr('استيراد المنتجات عبر CSV', 'Import products from CSV')}</h3>
          <p className="seller-required-hint">
            {tr('في القالب: SKU والتصنيف والاسمان والسعر وفئة الضريبة إجبارية. المتجر والوصف والباركود اختيارية؛ المتجر يُحدد من هذه الصفحة.', 'In the template, SKU, category, both names, price and VAT class are required. Store, descriptions and barcode are optional; the store is selected on this page.')}
          </p>
          <p>
            {tr(
              'أعمدة القالب تطابق حقول «منتج جديد». اختر المتجر عند الاستيراد، واكتب اسم التصنيف أو رقمه والسعر بالريال (مثال: 5.75). يمكن ترك خانة المتجر فارغة في الملف.',
              'The columns match Add Product. Choose the store at import time; enter a category name or number and price in SAR (e.g. 5.75). The Store cell can be blank.',
            )}
          </p>
          <p>
            {tr(
              'فئة الضريبة: قياسية أو صفرية أو معفاة، والوصف والباركود اختياريان. يجب تعبئة رمز SKU واسمَي المنتج والتصنيف والسعر. يدعم النظام القوالب القديمة أيضًا.',
              'VAT class: Standard, Zero-rated or Exempt. Descriptions and barcode are optional; SKU, both product names, category and price are required. Older templates still work.',
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
              <span>{tr('ملف CSV (إجباري)', 'CSV file (required)')}</span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => {
                  setImportFile(event.target.files?.[0] ?? null);
                  setCsvPreview(null);
                }}
              />
              <span className="seller-upload-button">{tr('اختيار ملف CSV', 'Choose CSV file')}</span>
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
              {tr('فحص ومعاينة CSV', 'Validate & preview CSV')}
            </button>
            <button
              type="button"
              style={button}
              disabled={busy || importFile === null || csvPreview === null}
              onClick={() => void uploadCsv(false)}
            >
              {tr('تأكيد استيراد المسودات', 'Confirm draft import')}
            </button>
          </div>
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
        <div className="seller-form-message" role="alert">{formError || error}</div>
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
                <ProductCameraScanner ar={ar} onRead={(text) => void applyScan(text)}
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
            <p className="seller-required-hint">{tr('الحقول المميزة بكلمة (إجباري) يجب تعبئتها قبل الحفظ.', 'Fields marked (required) must be completed before saving.')}</p>
            {(formError || error) && (
              <div className="seller-form-message" role="alert">{formError || error}</div>
            )}
            {success && <div className="seller-form-success" role="status">{success}</div>}
            {selected === null && (
              <div style={{ ...controls, marginBottom: 12 }}>
                <label style={field}>
                  {tr('رمز SKU (إجباري)', 'SKU code (required)')}
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
                  {tr('الباركود (اختياري)', 'Barcode (optional)')}
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
                {tr('المتجر (إجباري)', 'Store (required)')}
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
                {tr('التصنيف (إجباري)', 'Category (required)')}
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
                {tr('اسم المنتج بالعربية (إجباري)', 'Arabic product name (required)')}
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
                {tr('اسم المنتج بالإنجليزية (إجباري)', 'English product name (required)')}
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
                {tr('الوصف بالعربية (اختياري)', 'Arabic description (optional)')}
                <textarea
                  maxLength={10000}
                  {...fieldProps('descriptionAr')}
                  value={draft.descriptionAr}
                  onChange={(event) => set('descriptionAr', event.target.value)}
                />
                {fieldError('descriptionAr')}
              </label>
              <label style={field}>
                {tr('الوصف بالإنجليزية (اختياري)', 'English description (optional)')}
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
                {tr('السعر بالريال (1–10) (إجباري)', 'Price SAR (1–10) (required)')}
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
                {tr('فئة الضريبة (إجباري)', 'VAT class (required)')}
                <select
                  required
                  {...fieldProps('vatClass')}
                  value={draft.vatClass}
                  onChange={(event) => {
                    const val = event.target.value;
                    if (val === 'standard' || val === 'zero' || val === 'exempt')
                      setDraft((current) => ({ ...current, vatClass: val }));
                  }}
                >
                  <option value="standard">{tr('قياسية', 'Standard')}</option>
                  <option value="zero">{tr('صفرية', 'Zero-rated')}</option>
                  <option value="exempt">{tr('معفاة', 'Exempt')}</option>
                </select>
                {fieldError('vatClass')}
              </label>
            </div>
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
            <div style={{ ...card, marginTop: 12 }}>
              <h4>{tr('إضافة وحدة بيع / باركود', 'Add variant / barcode')}</h4>
              <div style={controls}>
                <label style={field}>
                  {tr('رمز SKU (إجباري)', 'SKU code (required)')}
                  <input
                    maxLength={100}
                    value={draft.sku}
                    onChange={(event) => set('sku', event.target.value)}
                  />
                </label>
                <label style={field}>
                  {tr('باركود (اختياري)', 'Barcode (optional)')}
                  <input
                    maxLength={100}
                    value={draft.barcode}
                    onChange={(event) => set('barcode', event.target.value)}
                  />
                </label>
              </div>
              <label className="seller-upload" style={{ ...field, marginTop: 12 }}>
                <span>{tr('صورة غلاف المنتج (5 ميجابايت كحد أقصى)', 'Product cover image (up to 5 MB)')}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setCoverFile(event.target.files?.[0] ?? null)}
                />
                <span className="seller-upload-button">{tr('اختيار صورة المنتج', 'Choose product image')}</span>
                <span className="seller-upload-name">
                  {coverFile?.name ?? tr('لم يتم اختيار صورة بعد', 'No image selected')}
                </span>
              </label>
              <button
                type="button"
                style={button}
                disabled={busy || coverFile === null}
                onClick={() => void uploadCover()}
              >
                {tr('رفع الصورة', 'Upload image')}
              </button>
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
          <strong>{ar ? product.name_ar : product.name_en}</strong>
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
                <button
                  type="button"
                  style={button}
                  disabled={busy}
                  onClick={() => void submit(product.id)}
                >
                  {tr('نشر / إرسال المنتج', 'Publish / Submit product')}
                </button>
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
                : tr('تأكيد نشر المنتج', 'Confirm publishing product')}
            </h3>
            <p id="seller-confirm-description">
              {confirmation.kind === 'save'
                ? tr('هل تريد حفظ بيانات المنتج كمسودة؟ يمكنك إكمال الصورة والتفاصيل بعد الحفظ.', 'Save this product as a draft? You can add an image and more details afterwards.')
                : tr('هل تريد إكمال المنتج؟ في العرض التجريبي ينشر مباشرة، وإلا يُرسل للمراجعة.', 'Complete this product? Demo mode publishes it immediately; otherwise it is sent for review.')}
            </p>
            <div className="seller-confirm-actions">
              <button type="button" onClick={() => setConfirmation(null)} disabled={busy}>{tr('إلغاء', 'Cancel')}</button>
              <button type="button" className="seller-confirm-primary" disabled={busy} autoFocus
                onClick={() => {
                  if (confirmation.kind === 'save') void persist();
                  else if (confirmation.productId !== undefined) void publish(confirmation.productId);
                }}>{tr('تأكيد', 'Confirm')}</button>
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

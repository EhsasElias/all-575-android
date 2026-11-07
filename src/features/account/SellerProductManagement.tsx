import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  addSellerProductVariant,
  createSellerProduct,
  importSellerProductCsv,
  uploadSellerProductImage,
  sellerCategories,
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

  const set = (fieldName: keyof Draft, value: string) =>
    setDraft((current) => ({ ...current, [fieldName]: value }));

  const edit = (product: SellerProduct) => {
    if (!editable(product)) return;
    setSelected(product.id);
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
    setError('');
    setSuccess('');
  };

  const newProduct = (sku = '') => {
    setSelected(null);
    setDraft({ ...empty(String(sellerIds[0] ?? '')), sku: sku.trim() });
    setFormVisible(true);
    setError('');
    setSuccess('');
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const price = Number(draft.price);
    const priceHalalas = Math.round(price * 100);
    if (
      !Number.isFinite(price) ||
      !/^[0-9]+([.][0-9]{1,2})?$/.test(draft.price) ||
      priceHalalas < 100 ||
      priceHalalas > 575 ||
      !Number.isSafeInteger(Number(draft.categoryId))
    ) {
      setError(
        tr(
          'السعر يجب أن يكون بين 1 و5.75 ريال، مع اختيار تصنيف صحيح.',
          'Price must be SAR 1–5.75, with a valid category.',
        ),
      );
      return;
    }
    if (selected === null && !draft.sku.trim()) {
      setError(tr('أدخلي رمز SKU للمنتج أولاً.', 'Enter a product SKU first.'));
      return;
    }
    if (!sellerIds.includes(Number(draft.sellerId))) {
      setError(tr('ليس لديك صلاحية إدارة هذا المتجر.', 'You cannot manage this store.'));
      return;
    }

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
              'تم حفظ المسودة، لكن تعذرت إضافة SKU (ربما مستخدم بالفعل). عدّلي الرمز وأضيفيه من قسم وحدة البيع أدناه.',
              'Draft saved, but SKU could not be added (possibly already in use). Change it and add it in the variant section below.',
            ),
          );
        }
      } else {
        setSuccess(tr('تم تحديث مسودة المنتج.', 'Product draft updated.'));
      }
      onUpdated();
    } catch {
      setError(
        tr(
          'تعذر حفظ المنتج. تأكدي من التصنيف والصلاحيات والحقول المطلوبة.',
          'Could not save product. Check category, permissions and required fields.',
        ),
      );
    } finally {
      setBusy(false);
    }
  };

  const addVariant = async (productId: number) => {
    if (!draft.sku.trim() || busy) {
      setError(tr('أدخلي رمز SKU أولاً.', 'Enter an SKU first.'));
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
          'تعذر إضافة الوحدة. تأكدي من عدم تكرار SKU أو الباركود.',
          'Could not add variant. Make sure SKU and barcode are unique.',
        ),
      );
    } finally {
      setBusy(false);
    }
  };

  const submit = async (productId: number) => {
    if (
      busy ||
      !window.confirm(tr(
        'هل تريدين إكمال المنتج؟ سيُنشر مباشرة في وضع العرض التجريبي، وإلا سيُرسل للمراجعة.',
        'Complete this product? It publishes immediately in demo mode; otherwise it goes to review.',
      ))
    )
      return;
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
    } catch {
      setError(
        tr(
          'تعذر النشر أو الإرسال. احفظي المسودة وأضيفي SKU وصورة للمنتج أولاً.',
          'Could not publish or submit. Save the draft and add an SKU and product image first.',
        ),
      );
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
          'تعذر رفع الصورة. اختاري ملف صورة صالحًا لمسودة.',
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
      setError(tr('اختاري ملف CSV لا يتجاوز 1 ميجابايت.', 'Choose a CSV file under 1 MB.'));
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
            'فشل الاستيراد. تأكدي من ترتيب أعمدة القالب وصحة التصنيفات والأسعار وعدم تكرار SKU.',
            'Import failed. Check template columns, categories, prices and duplicate SKUs.',
          ),
      );
    } finally {
      setBusy(false);
    }
  };

  const flatCategories = (
    items: SellerCategory[],
    depth = 0,
  ): Array<{ id: number; label: string }> =>
    items.flatMap((item) => [
      { id: item.id, label: '—'.repeat(depth) + (ar ? item.name.ar : item.name.en) },
      ...flatCategories(item.children ?? [], depth + 1),
    ]);

  return (
    <section>
      {sellerIds.length > 0 && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!quickSku.trim()) {
              setError(tr('أدخلي رمز SKU أولاً.', 'Enter an SKU first.'));
              return;
            }
            newProduct(quickSku);
          }}
          style={{ ...card, marginBottom: 16 }}
        >
          <h3>{tr('إضافة منتج بواسطة SKU', 'Add product by SKU')}</h3>
          <p>
            {tr(
              'أدخلي رمز SKU للبدء، ثم أكملي بيانات المنتج. سيتم حفظ SKU تلقائياً عند إنشاء المسودة.',
              'Enter an SKU to start, then complete product details. The SKU will be saved automatically with the draft.',
            )}
          </p>
          <div style={{ ...controls, alignItems: 'end' }}>
            <label style={field}>
              {tr('رمز SKU الجديد', 'New SKU code')}
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
        <div style={card}>
          <h3>{tr('استيراد المنتجات عبر CSV', 'Import products from CSV')}</h3>
          <p>
            {tr(
              'حمّلي القالب وأدخلي حتى 200 منتج. سيتم حفظها كمسودات للمراجعة.',
              'Download the template and enter up to 200 products. They will be saved as drafts.',
            )}
          </p>
          <div style={controls}>
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
              <span>{tr('ملف CSV', 'CSV file')}</span>
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
          <div style={{ ...controls, marginTop: 12 }}>
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
                    <th>SKU</th>
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
      {error && (
        <p role="alert" style={{ color: '#a52e2e' }}>
          {error}
        </p>
      )}
      {success && <p role="status">{success}</p>}
      {formVisible && (
        <div style={card}>
          <h3>
            {selected === null
              ? tr('منتج جديد', 'New product')
              : tr('تعديل مسودة', 'Edit draft')}{' '}
          </h3>
          <form onSubmit={(event) => void save(event)}>
            {selected === null && (
              <div style={{ ...controls, marginBottom: 12 }}>
                <label style={field}>
                  {tr('رمز SKU (مطلوب)', 'SKU code (required)')}
                  <input
                    required
                    maxLength={100}
                    value={draft.sku}
                    onChange={(event) => set('sku', event.target.value)}
                  />
                </label>
                <label style={field}>
                  {tr('الباركود (اختياري)', 'Barcode (optional)')}
                  <input
                    maxLength={100}
                    value={draft.barcode}
                    onChange={(event) => set('barcode', event.target.value)}
                  />
                </label>
              </div>
            )}
            <div style={controls}>
              <label style={field}>
                {tr('المتجر', 'Store')}
                <select
                  required
                  value={draft.sellerId}
                  disabled={selected !== null}
                  onChange={(event) => set('sellerId', event.target.value)}
                >
                  <option value="">{tr('اختاري المتجر', 'Select store')}</option>
                  {sellerIds.map((id) => {
                    const membership = allowed.find((item) => item.seller_id === id);
                    return (
                      <option key={id} value={id}>
                        {membership ? (ar ? membership.name_ar : membership.name_en) : id}
                      </option>
                    );
                  })}
                </select>
              </label>
              <label style={field}>
                {tr('التصنيف', 'Category')}
                <select
                  required
                  value={draft.categoryId}
                  onChange={(event) => set('categoryId', event.target.value)}
                >
                  <option value="">{tr('اختاري التصنيف', 'Select category')}</option>
                  {flatCategories(categories).map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div style={controls}>
              <label style={field}>
                {tr('اسم المنتج بالعربية', 'Arabic product name')}
                <input
                  required
                  maxLength={180}
                  value={draft.nameAr}
                  onChange={(event) => set('nameAr', event.target.value)}
                />
              </label>
              <label style={field}>
                {tr('اسم المنتج بالإنجليزية', 'English product name')}
                <input
                  required
                  maxLength={180}
                  value={draft.nameEn}
                  onChange={(event) => set('nameEn', event.target.value)}
                />
              </label>
            </div>
            <div style={controls}>
              <label style={field}>
                {tr('الوصف بالعربية', 'Arabic description')}
                <textarea
                  maxLength={10000}
                  value={draft.descriptionAr}
                  onChange={(event) => set('descriptionAr', event.target.value)}
                />
              </label>
              <label style={field}>
                {tr('الوصف بالإنجليزية', 'English description')}
                <textarea
                  maxLength={10000}
                  value={draft.descriptionEn}
                  onChange={(event) => set('descriptionEn', event.target.value)}
                />
              </label>
            </div>
            <div style={controls}>
              <label style={field}>
                {tr('السعر بالريال (1–5.75)', 'Price SAR (1–5.75)')}
                <input
                  type="number"
                  required
                  min="1"
                  max="5.75"
                  step="0.01"
                  value={draft.price}
                  onChange={(event) => set('price', event.target.value)}
                />
              </label>
              <label style={field}>
                {tr('فئة الضريبة', 'VAT class')}
                <select
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
                  SKU
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
            {tr('الحالة', 'Status')}: {product.status}
          </p>
          {product.status === 'rejected' && product.rejection_reason && (
            <p role="status" style={{ padding: 10, border: '1px solid #d8e1db', borderRadius: 8 }}>
              <strong>{tr('سبب رفض المنتج:', 'Rejection reason:')}</strong>{' '}
              {product.rejection_reason}
            </p>
          )}
          <small>
            {tr('تصنيف', 'Category')} #{product.category_id} · {tr('متجر', 'Store')} #
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
      <p>
        {tr(
          'تُعرض المنتجات على دفعات. يمكن النشر المباشر للحساب التجريبي المصرّح له، وبقية الحسابات تتطلب مراجعة الإدارة.',
          'Products are listed in batches. Authorized demo accounts can publish directly; other accounts require admin review.',
        )}
      </p>
    </section>
  );
}

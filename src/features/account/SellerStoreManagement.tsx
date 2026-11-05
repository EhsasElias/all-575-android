import { lazy, Suspense, useEffect, useState, type FormEvent } from 'react';
import { MapBoundary } from '@/features/addresses/MapBoundary';
import type { MapPin, PinMapLabels } from '@/features/addresses/mapTypes';

const BranchPinMap = lazy(() => import('@/features/addresses/LeafletMap')
  .then((module) => ({ default: module.LeafletMap })));
import { useTranslation } from 'react-i18next';
import {
  sellerBranches, type SellerBranch, type SellerMembership,
} from './sellerWorkspaceApi';
import {
  getSellerStoreProfile, saveSellerStoreProfile, saveSellerBranchProfile,
  getSellerServiceZones, proposeSellerBranch, type SellerServiceZone,
  type SellerStoreProfile,
} from './sellerStoreProfileApi';
import { isApiError } from '@/shared/api';

type Props = { memberships: SellerMembership[] };
const card: React.CSSProperties = { padding: 14, border: '1px solid #d8e1db', borderRadius: 12, marginBottom: 12 };
const row: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'end' };
const field: React.CSSProperties = { display: 'grid', gap: 5, flex: 1, minWidth: 160 };

export function SellerStoreManagement({ memberships }: Props) {
  const { i18n } = useTranslation();
  const ar = i18n.language.startsWith('ar');
  const tr = (arabic: string, english: string) => ar ? arabic : english;
  const owners = [...new Map(memberships.filter((item) =>
    item.is_active && item.role === 'owner' && item.branch_id === null && item.seller_status === 'approved'
  ).map((item) => [item.seller_id, item])).values()];
  const [sellerId, setSellerId] = useState('');
  const selectedId = Number(sellerId || owners[0]?.seller_id);
  const [profile, setProfile] = useState<SellerStoreProfile | null>(null);
  const [branches, setBranches] = useState<SellerBranch[]>([]);
  const [zones, setZones] = useState<SellerServiceZone[]>([]);
  const [propose, setPropose] = useState(false);
  const [newBranch, setNewBranch] = useState({ code: '', name_ar: '', name_en: '', service_zone_id: '', lat: '', lng: '' });
  const branchPin: MapPin | null = newBranch.lat.trim() && newBranch.lng.trim() &&
    Number.isFinite(Number(newBranch.lat)) && Number.isFinite(Number(newBranch.lng))
      ? { lat: Number(newBranch.lat), lng: Number(newBranch.lng) } : null;
  const branchMapLabels: PinMapLabels = {
    map: tr('موقع الفرع على الخريطة', 'Branch location map'),
    pin: tr('دبوس موقع الفرع', 'Branch location pin'),
    zoomIn: tr('تكبير', 'Zoom in'),
    zoomOut: tr('تصغير', 'Zoom out'),
    placeAtCenter: tr('حدد الفرع في مركز الخريطة', 'Place branch at map center'),
  };
  const setBranchPin = (point: MapPin) => {
    setNewBranch((current) => ({
      ...current,
      lat: String(point.lat),
      lng: String(point.lng),
    }));
  };
  const [storeAr, setStoreAr] = useState('');
  const [storeEn, setStoreEn] = useState('');
  const [editBranch, setEditBranch] = useState<number | null>(null);
  const [branchAr, setBranchAr] = useState('');
  const [branchEn, setBranchEn] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!owners.some((owner) => owner.seller_id === selectedId)) return;
    let active = true;
    setLoading(true);
    setError('');
    setProfile(null);
    void Promise.all([getSellerStoreProfile(selectedId), sellerBranches(), getSellerServiceZones()])
      .then(([store, branchList, zoneList]) => {
        setZones(zoneList.data);
        if (!active) return;
        setProfile(store.data);
        setStoreAr(store.data.name_ar);
        setStoreEn(store.data.name_en);
        setBranches(branchList.data.filter((item) => item.seller_id === selectedId));
      })
      .catch(() => { if (active) setError(tr('تعذر تحميل بيانات المتجر.', 'Unable to load store profile.')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
    // Request depends on the selected seller, not current language.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, revision]);

  const errorMessage = (cause: unknown): string => {
    if (isApiError(cause)) {
      const fieldError = Object.values(cause.fieldErrors).flat()[0];
      if (fieldError) return fieldError;
      if (cause.status === 403 || cause.status === 404) {
        return tr('لا تملكين صلاحية تعديل هذا المتجر.', 'You are not allowed to edit this store.');
      }
    }
    return tr('تعذر حفظ البيانات. تحققي من الاتصال وحاولي مجددًا.', 'Could not save changes. Check the connection and retry.');
  };

  const saveStore = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile || saving) return;
    if (!storeAr.trim() || !storeEn.trim()) {
      setError(tr('أدخلي اسمي المتجر بالعربية والإنجليزية.', 'Enter both Arabic and English store names.'));
      return;
    }
    setSaving(true); setError(''); setNotice('');
    try {
      const result = await saveSellerStoreProfile(profile.id, { name_ar: storeAr.trim(), name_en: storeEn.trim() });
      setProfile(result.data);
      setStoreAr(result.data.name_ar);
      setStoreEn(result.data.name_en);
      setNotice(tr('تم حفظ اسم المتجر.', 'Store name saved.'));
    } catch (cause) { setError(errorMessage(cause)); }
    finally { setSaving(false); }
  };

  const saveBranch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (editBranch === null || saving) return;
    if (!branchAr.trim() || !branchEn.trim()) {
      setError(tr('اسم الفرع مطلوب باللغتين.', 'Branch name is required in both languages.'));
      return;
    }
    setSaving(true); setError(''); setNotice('');
    try {
      const result = await saveSellerBranchProfile(editBranch, { name_ar: branchAr.trim(), name_en: branchEn.trim() });
      setBranches((current) => current.map((item) =>
        item.id === editBranch ? { ...item, name_ar: result.data.name_ar, name_en: result.data.name_en } : item));
      setEditBranch(null);
      setNotice(tr('تم حفظ اسم الفرع.', 'Branch name saved.'));
    } catch (cause) { setError(errorMessage(cause)); }
    finally { setSaving(false); }
  };

  const createBranch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    const zoneId = Number(newBranch.service_zone_id);
    const lat = Number(newBranch.lat);
    const lng = Number(newBranch.lng);
    if (!zoneId || !Number.isFinite(lat) || !Number.isFinite(lng) || !newBranch.lat || !newBranch.lng) {
      setError(tr('اختاري المنطقة وحددي إحداثيات صحيحة للفرع.', 'Choose a zone and valid branch coordinates.'));
      return;
    }
    setSaving(true); setError(''); setNotice('');
    try {
      await proposeSellerBranch({
        seller_id: selectedId,
        service_zone_id: zoneId,
        code: newBranch.code.trim(),
        name_ar: newBranch.name_ar.trim(),
        name_en: newBranch.name_en.trim(),
        lat, lng,
      });
      setPropose(false);
      setNewBranch({ code: '', name_ar: '', name_en: '', service_zone_id: '', lat: '', lng: '' });
      setNotice(tr('تم إرسال الفرع، وهو غير نشط حتى تعتمد الإدارة موقعه.', 'Branch submitted. It stays inactive until its location is approved.'));
      setRevision((v) => v + 1);
    } catch (cause) { setError(errorMessage(cause)); }
    finally { setSaving(false); }
  };

  if (owners.length === 0) {
    return <section style={card}><p>{tr('إدارة المتجر والفروع متاحة لمالك المتجر المعتمد فقط.',
      'Store and branch management is available only to approved store owners.')}</p></section>;
  }

  return <section>
    <h2>{tr('بيانات المتجر والفروع', 'Store and branches')}</h2>
    <p>{tr('يمكن تعديل الأسماء المعروضة فقط. العنوان ونطاق التوصيل وحالة الفرع والبيانات القانونية تتم إدارتها بواسطة الإدارة.',
      'You can update display names only. Addresses, delivery zones, activation and legal records remain administrator-controlled.')}</p>
    <div style={{ ...row, marginBottom: 12 }}>
      <label style={field}>{tr('المتجر', 'Store')}
        <select value={sellerId || String(owners[0]?.seller_id ?? '')} disabled={saving}
          onChange={(event) => { setSellerId(event.target.value); setEditBranch(null); setNotice(''); }}>
          {owners.map((item) => <option key={item.seller_id} value={item.seller_id}>
            {ar ? item.name_ar : item.name_en}
          </option>)}
        </select>
      </label>
      <button type="button" disabled={loading || saving} onClick={() => setRevision((value) => value + 1)}>
        {tr('تحديث', 'Refresh')}
      </button>
    </div>
    {error && <p role="alert" style={{ color: '#a52e2e' }}>{error}</p>}
    {notice && <p role="status">{notice}</p>}
    {loading && <p role="status">{tr('جار تحميل البيانات…', 'Loading…')}</p>}
    {!loading && profile && <>
      <form onSubmit={(event) => void saveStore(event)} style={card}>
        <h3>{tr('بيانات العرض', 'Display information')}</h3>
        <p>{tr('الحالة', 'Status')}: {profile.status} · {tr('رمز المتجر', 'Store slug')}: {profile.slug}</p>
        <div style={row}>
          <label style={field}>{tr('الاسم بالعربية', 'Arabic name')}
            <input value={storeAr} maxLength={180} required disabled={saving}
              onChange={(event) => setStoreAr(event.target.value)} />
          </label>
          <label style={field}>{tr('الاسم بالإنجليزية', 'English name')}
            <input value={storeEn} maxLength={180} required disabled={saving}
              onChange={(event) => setStoreEn(event.target.value)} />
          </label>
        </div>
        <button type="submit" disabled={saving || loading} style={{ marginTop: 12 }}>
          {tr('حفظ بيانات المتجر', 'Save store')}
        </button>
      </form>
      <div style={card}>
        <h3>{tr('الفروع الحالية', 'Existing branches')}</h3>
        <button type="button" disabled={saving} onClick={() => setPropose((value) => !value)}>
          {propose ? tr('إلغاء إضافة فرع', 'Cancel new branch') : tr('طلب إضافة فرع', 'Request new branch')}
        </button>
        {propose && <form onSubmit={(event) => void createBranch(event)} style={{ ...card, marginTop: 12 }}>
          <p>{tr('سيظل الفرع غير نشط حتى تراجع الإدارة موقعه. يمكنك استخدام مركز المنطقة كنقطة بداية وتعديل الإحداثيات.',
            'The branch remains inactive until location approval. Start from a service-zone center and adjust coordinates.')}</p>
          <div style={row}>
            <label style={field}>{tr('منطقة التوصيل', 'Delivery zone')}
              <select required value={newBranch.service_zone_id} onChange={(event) => {
                const zone = zones.find((item) => item.id === Number(event.target.value));
                setNewBranch((current) => ({
                  ...current, service_zone_id: event.target.value,
                  lat: zone ? String(zone.center_lat) : '',
                  lng: zone ? String(zone.center_lng) : '',
                }));
              }}>
                <option value="">{tr('اختاري المنطقة', 'Choose zone')}</option>
                {zones.map((zone) => <option key={zone.id} value={zone.id}>
                  {ar ? zone.name_ar : zone.name_en}
                </option>)}
              </select>
            </label>
            {([
              ['code', tr('رمز الفرع', 'Branch code')],
              ['name_ar', tr('اسم الفرع بالعربية', 'Arabic branch name')],
              ['name_en', tr('اسم الفرع بالإنجليزية', 'English branch name')],
            ] as const).map(([key, label]) => <label key={key} style={field}>
              {label}<input required maxLength={key === 'code' ? 32 : 180} value={newBranch[key]}
                onChange={(event) => setNewBranch((current) => ({ ...current, [key]: event.target.value }))} />
            </label>)}
            {newBranch.service_zone_id && (
              <div style={{ flex: '1 1 100%', minWidth: 0 }}>
                <p>{tr('اختاري موقع الفرع من الخريطة بسحب الدبوس أو الضغط على المكان، ثم راجعي الإحداثيات.', 'Tap or drag the pin to the branch location, then verify its coordinates.')}</p>
                <MapBoundary fallback={<p role="alert">{tr('تعذر فتح الخريطة. يمكنك كتابة الإحداثيات أدناه.', 'Could not load map. You can enter the coordinates below.')}</p>}>
                  <Suspense fallback={<p role="status">{tr('جار تحميل الخريطة…', 'Loading map…')}</p>}>
                    <BranchPinMap
                      key={newBranch.service_zone_id}
                      pin={branchPin}
                      labels={branchMapLabels}
                      onPinChange={setBranchPin}
                    />
                  </Suspense>
                </MapBoundary>
              </div>
            )}
            {(['lat', 'lng'] as const).map((key) => <label key={key} style={field}>
              {key === 'lat' ? tr('خط العرض', 'Latitude') : tr('خط الطول', 'Longitude')}
              <input type="number" step="any" required value={newBranch[key]}
                onChange={(event) => setNewBranch((current) => ({ ...current, [key]: event.target.value }))} />
            </label>)}
          </div>
          <button type="submit" disabled={saving || zones.length === 0}>
            {tr('إرسال الفرع للمراجعة', 'Submit branch for review')}
          </button>
        </form>}
        {branches.length === 0 && <p>{tr('لا توجد فروع مرتبطة بالمتجر.', 'No branches assigned to this store.')}</p>}
        {branches.map((branch) => <article key={branch.id} style={{ borderTop: '1px solid #d8e1db', padding: '12px 0' }}>
          <strong>{ar ? branch.name_ar : branch.name_en}</strong>
          <p>{tr('الرمز', 'Code')}: {branch.code} · {branch.is_active ? tr('نشط', 'Active') : tr('غير نشط', 'Inactive')}</p>
          {editBranch !== branch.id && <button type="button" disabled={saving}
            onClick={() => { setEditBranch(branch.id); setBranchAr(branch.name_ar); setBranchEn(branch.name_en); setError(''); }}>
            {tr('تعديل اسم الفرع', 'Edit branch name')}
          </button>}
          {editBranch === branch.id && <form onSubmit={(event) => void saveBranch(event)}>
            <div style={row}>
              <label style={field}>{tr('اسم الفرع بالعربية', 'Arabic branch name')}
                <input value={branchAr} maxLength={180} required disabled={saving} onChange={(event) => setBranchAr(event.target.value)} />
              </label>
              <label style={field}>{tr('اسم الفرع بالإنجليزية', 'English branch name')}
                <input value={branchEn} maxLength={180} required disabled={saving} onChange={(event) => setBranchEn(event.target.value)} />
              </label>
            </div>
            <div style={{ ...row, marginTop: 10 }}>
              <button type="submit" disabled={saving}>{tr('حفظ الفرع', 'Save branch')}</button>
              <button type="button" disabled={saving} onClick={() => setEditBranch(null)}>{tr('إلغاء', 'Cancel')}</button>
            </div>
          </form>}
        </article>)}
      </div>
    </>}
  </section>;
}

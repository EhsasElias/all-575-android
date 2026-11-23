import { useEffect, useMemo, useRef, useState } from 'react';
import { isApiError } from '@/shared/api';
import { useTranslation } from 'react-i18next';
import { courierAdminFrench } from './courierAdminFrench';
import {
  adminCouriers,
  superAdminApproveCourier,
  type CourierChoice,
} from './courierOperationsApi';

export function SuperAdminCouriers({ ar }: { ar: boolean }) {
  const { i18n } = useTranslation();
  const fr = i18n.language.startsWith('fr');
  const tr = (a: string, en: keyof typeof courierAdminFrench) =>
    ar ? a : fr ? courierAdminFrench[en] : en;
  const [items, setItems] = useState<CourierChoice[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const decisionInFlight = useRef(false);
  const [revision, setRevision] = useState(0);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>(
    'pending',
  );
  const visible = useMemo(
    () =>
      statusFilter === 'all'
        ? items
        : items.filter((item) => item.approval_status === statusFilter),
    [items, statusFilter],
  );
  useEffect(() => {
    let active = true;
    void adminCouriers()
      .then((r) => {
        if (active) setItems(r.data);
      })
      .catch((cause: unknown) => {
        if (active)
          setError(
            tr('تعذر تحميل حسابات المندوبين.', 'Unable to load couriers.') +
              (isApiError(cause) ? ` (HTTP ${cause.status})` : ''),
          );
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revision]);
  return (
    <section
      id="courier-approvals"
      className="admin-family-panel"
      style={{ marginBlock: 18, padding: 16 }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <h2>{tr('اعتماد مندوبي التوصيل', 'Courier approvals')}</h2>
        <button
          type="button"
          className="admin-family-primary"
          disabled={busy}
          onClick={() => {
            setError('');
            setRevision((current) => current + 1);
          }}
        >
          ↻ {tr('تحديث', 'Refresh')}
        </button>
      </header>
      <p>
        {tr(
          'تتم الموافقة من المدير العام فقط. المندوب غير المعتمد لا يستقبل مهام.',
          'Only Super Admin may approve couriers. Pending couriers cannot receive jobs.',
        )}
      </p>
      {error && <p role="alert">{error}</p>}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          marginBlock: 14,
        }}
      >
        <label>
          {ar ? 'تصفية حسب الحالة' : fr ? 'Filtrer par statut' : 'Filter by status'}
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as 'all' | 'pending' | 'approved' | 'rejected')
            }
            style={{ marginInlineStart: 8 }}
          >
            <option value="pending">{ar ? 'قيد المراجعة' : fr ? 'En attente' : 'Pending'}</option>
            <option value="approved">{ar ? 'معتمد' : fr ? 'Approuvé' : 'Approved'}</option>
            <option value="rejected">{ar ? 'مرفوض' : fr ? 'Refusé' : 'Rejected'}</option>
            <option value="all">{ar ? 'الجميع' : fr ? 'Tous' : 'All'}</option>
          </select>
        </label>
        <span aria-live="polite">
          {ar ? 'النتائج' : fr ? 'Résultats' : 'Results'}: {visible.length}
        </span>
      </div>
      {visible.length === 0 && !error && (
        <p>
          {ar
            ? 'لا توجد ملفات مندوبي توصيل بهذه الحالة.'
            : fr
              ? 'Aucun livreur avec ce statut.'
              : 'No courier profiles with this status.'}
        </p>
      )}
      <div className="admin-family-table" style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>{tr('الاسم', 'Name')}</th>
              <th>{tr('المنطقة', 'Zone')}</th>
              <th>{tr('المركبة', 'Vehicle')}</th>
              <th>{tr('الحالة', 'Status')}</th>
              <th>{tr('الإجراء', 'Action')}</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>#{c.service_zone_id}</td>
                <td>{c.vehicle_type}</td>
                <td>
                  {c.approval_status === 'approved'
                    ? ar
                      ? 'معتمد'
                      : fr
                        ? 'Approuvé'
                        : 'Approved'
                    : c.approval_status === 'rejected'
                      ? ar
                        ? 'مرفوض'
                        : fr
                          ? 'Refusé'
                          : 'Rejected'
                      : ar
                        ? 'قيد المراجعة'
                        : fr
                          ? 'En attente'
                          : 'Pending'}
                </td>
                <td>
                  <button
                    type="button"
                    disabled={busy || decisionInFlight.current || c.approval_status === 'approved'}
                    onClick={() => {
                      if (decisionInFlight.current) return;
                      decisionInFlight.current = true;
                      setBusy(true);
                      setError('');
                      void superAdminApproveCourier(c.id, true)
                        .then(() => {
                          setItems((previous) =>
                            previous.map((item) =>
                              item.id === c.id ? { ...item, approval_status: 'approved' } : item,
                            ),
                          );
                          setRevision((v) => v + 1);
                        })
                        .catch(() => {
                          setError(tr('تعذر اعتماد المندوب.', 'Approval failed.'));
                        })
                        .finally(() => {
                          decisionInFlight.current = false;
                          setBusy(false);
                        });
                    }}
                  >
                    {tr('اعتماد', 'Approve')}
                  </button>
                  <button
                    type="button"
                    disabled={busy || decisionInFlight.current || c.approval_status === 'rejected'}
                    onClick={() => {
                      if (decisionInFlight.current) return;
                      decisionInFlight.current = true;
                      setBusy(true);
                      setError('');
                      void superAdminApproveCourier(c.id, false)
                        .then(() => {
                          setItems((previous) =>
                            previous.map((item) =>
                              item.id === c.id ? { ...item, approval_status: 'rejected' } : item,
                            ),
                          );
                          setRevision((v) => v + 1);
                        })
                        .catch(() => {
                          setError(tr('تعذر رفض المندوب.', 'Rejection failed.'));
                        })
                        .finally(() => {
                          decisionInFlight.current = false;
                          setBusy(false);
                        });
                    }}
                  >
                    {tr('رفض / إيقاف', 'Reject / suspend')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

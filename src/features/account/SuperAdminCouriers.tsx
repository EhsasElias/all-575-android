import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { courierAdminFrench } from './courierAdminFrench';
import {
  adminCouriers,
  superAdminApproveCourier,
  type CourierChoice,
} from './courierOperationsApi';

export function SuperAdminCouriers({ ar, reviewRevision = 0 }: { ar: boolean; reviewRevision?: number }) {
  const { i18n } = useTranslation();
  const fr = i18n.language.startsWith('fr');
  const tr = (a: string, en: keyof typeof courierAdminFrench) =>
    ar ? a : fr ? courierAdminFrench[en] : en;
  const [items, setItems] = useState<CourierChoice[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const decisionInFlight = useRef(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    void adminCouriers()
      .then((r) => {
        if (active) setItems(r.data);
      })
      .catch(() => {
        if (active) setError(tr('تعذر تحميل حسابات المندوبين.', 'Unable to load couriers.'));
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revision, reviewRevision]);
  return (
    <section
      id="courier-approvals"
      className="admin-family-panel"
      style={{ marginBlock: 18, padding: 16 }}
    >
      <h2>{tr('اعتماد مندوبي التوصيل', 'Courier approvals')}</h2>
      <p>
        {tr(
          'تتم الموافقة من المدير العام فقط. المندوب غير المعتمد لا يستقبل مهام.',
          'Only Super Admin may approve couriers. Pending couriers cannot receive jobs.',
        )}
      </p>
      {error && <p role="alert">{error}</p>}
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
            {items.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>#{c.service_zone_id}</td>
                <td>{c.vehicle_type}</td>
                <td>{c.approval_status}</td>
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
                          setItems((previous) => previous.map((item) => item.id === c.id ? { ...item, approval_status: 'approved' } : item));
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
                          setItems((previous) => previous.map((item) => item.id === c.id ? { ...item, approval_status: 'rejected' } : item));
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

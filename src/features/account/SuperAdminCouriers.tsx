import { useEffect, useState } from 'react';
import {
  adminCouriers,
  superAdminApproveCourier,
  type CourierChoice,
} from './courierOperationsApi';

export function SuperAdminCouriers({ ar }: { ar: boolean }) {
  const tr = (a: string, en: string) => (ar ? a : en);
  const [items, setItems] = useState<CourierChoice[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
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
  }, [revision]);
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
                    disabled={busy || c.approval_status === 'approved'}
                    onClick={() => {
                      setBusy(true);
                      setError('');
                      void superAdminApproveCourier(c.id, true)
                        .then(() => {
                          setRevision((v) => v + 1);
                        })
                        .catch(() => {
                          setError(tr('تعذر اعتماد المندوب.', 'Approval failed.'));
                        })
                        .finally(() => {
                          setBusy(false);
                        });
                    }}
                  >
                    {tr('اعتماد', 'Approve')}
                  </button>
                  <button
                    type="button"
                    disabled={busy || c.approval_status === 'rejected'}
                    onClick={() => {
                      setBusy(true);
                      setError('');
                      void superAdminApproveCourier(c.id, false)
                        .then(() => {
                          setRevision((v) => v + 1);
                        })
                        .catch(() => {
                          setError(tr('تعذر رفض المندوب.', 'Rejection failed.'));
                        })
                        .finally(() => {
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

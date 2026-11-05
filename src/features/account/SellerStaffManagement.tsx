import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  deactivateSellerStaff,
  sellerStaff,
  type SellerMembership,
  type SellerStaffMember,
} from './sellerWorkspaceApi';

type Props = { memberships: SellerMembership[] };
const panel: React.CSSProperties = {
  padding: 14,
  border: '1px solid #d8e1db',
  borderRadius: 12,
  marginBottom: 12,
};

export function SellerStaffManagement({ memberships }: Props) {
  const { i18n } = useTranslation();
  const ar = i18n.language.startsWith('ar');
  const tr = (arabic: string, english: string) => (ar ? arabic : english);
  const owners = [
    ...new Map(
      memberships
        .filter(
          (item) =>
            item.role === 'owner' &&
            item.is_active &&
            item.seller_status === 'approved' &&
            item.branch_id === null,
        )
        .map((item) => [item.seller_id, item]),
    ).values(),
  ];
  const [sellerId, setSellerId] = useState('');
  const [rows, setRows] = useState<SellerStaffMember[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const selected = Number(sellerId || owners[0]?.seller_id);

  const load = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (busy) return;
    if (!owners.some((owner) => owner.seller_id === selected)) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await sellerStaff(selected);
      setRows(result.data);
    } catch {
      setError(
        tr(
          'تعذر تحميل فريق المتجر. تحقق من صلاحية المالك والاتصال.',
          'Could not load staff. Check store owner permissions and connection.',
        ),
      );
    } finally {
      setBusy(false);
    }
  };

  const deactivate = async (member: SellerStaffMember) => {
    if (busy || member.role === 'owner' || !member.is_active) return;
    if (
      !window.confirm(
        tr('هل تريد إيقاف صلاحيات هذا الموظف في المتجر؟', 'Deactivate this staff membership?'),
      )
    )
      return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await deactivateSellerStaff(member.id);
      setRows(
        (previous) =>
          previous?.map((row) => (row.id === member.id ? { ...row, is_active: false } : row)) ??
          null,
      );
      setNotice(tr('تم إيقاف صلاحية الموظف.', 'Staff access deactivated.'));
    } catch {
      setError(
        tr(
          'تعذر إيقاف الموظف. لا يمكن إيقاف حساب المالك.',
          'Could not deactivate staff. Owner accounts cannot be deactivated here.',
        ),
      );
    } finally {
      setBusy(false);
    }
  };

  if (owners.length === 0) {
    return (
      <p>
        {tr(
          'إدارة الفريق متاحة فقط لمالك متجر معتمد.',
          'Staff management is available only to approved store owners.',
        )}
      </p>
    );
  }

  return (
    <section style={panel}>
      <h2>{tr('إدارة فريق المتجر', 'Store staff')}</h2>
      <p>
        {tr(
          'يمكن لمالك المتجر عرض صلاحيات الفريق وإيقاف صلاحية موظف. تغيير ملكية المتجر يتطلب موافقة الإدارة.',
          'Store owners can review staff permissions and deactivate staff. Ownership changes require administrator approval.',
        )}
      </p>
      <form
        onSubmit={(event) => void load(event)}
        style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'end' }}
      >
        <label>
          {tr('المتجر', 'Store')}
          <select
            style={{ display: 'block' }}
            value={sellerId || String(owners[0]?.seller_id ?? '')}
            onChange={(event) => {
              setSellerId(event.target.value);
              setRows(null);
              setError('');
            }}
          >
            {owners.map((owner) => (
              <option value={owner.seller_id} key={owner.seller_id}>
                {ar ? owner.name_ar : owner.name_en}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={busy}>
          {tr('عرض الموظفين', 'View staff')}
        </button>
      </form>
      {error && (
        <p role="alert" style={{ color: '#a52e2e' }}>
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      {rows && (
        <div style={{ overflowX: 'auto', marginTop: 12 }}>
          {rows.length === 0 ? (
            <p>{tr('لا يوجد موظفون.', 'No staff found.')}</p>
          ) : (
            <table style={{ width: '100%', textAlign: 'start' }}>
              <thead>
                <tr>
                  <th>{tr('رقم المستخدم', 'User ID')}</th>
                  <th>{tr('الصلاحية', 'Role')}</th>
                  <th>{tr('الفرع', 'Branch')}</th>
                  <th>{tr('الحالة', 'Status')}</th>
                  <th>{tr('الإجراء', 'Action')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((member) => (
                  <tr key={member.id}>
                    <td>{member.user_id}</td>
                    <td>{member.role}</td>
                    <td>{member.branch_id ?? tr('كل الفروع', 'All branches')}</td>
                    <td>{member.is_active ? tr('نشط', 'Active') : tr('موقوف', 'Inactive')}</td>
                    <td>
                      {member.role !== 'owner' && member.is_active && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void deactivate(member)}
                        >
                          {tr('إيقاف الصلاحية', 'Deactivate access')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </section>
  );
}

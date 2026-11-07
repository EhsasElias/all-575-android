import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { isApiError } from '@/shared/api';
import {
  addSellerStaff, updateSellerStaff, deactivateSellerStaff, sellerStaff, sellerBranches,
  type SellerMembership, type SellerStaffMember, type SellerBranch,
  type SellerStaffInput,
} from './sellerWorkspaceApi';

type Props = { memberships: SellerMembership[] };
type Editor = { member: SellerStaffMember | null; userId: string; role: SellerStaffInput['role']; branchId: string; active: boolean };
const blankEditor = (): Editor => ({ member: null, userId: '', role: 'picker', branchId: '', active: true });

export function SellerStaffManagement({ memberships }: Props) {
  const { i18n } = useTranslation();
  const ar = i18n.language.startsWith('ar');
  const tr = (arabic: string, english: string) => (ar ? arabic : english);
  const roleLabels: Record<string, string> = {
    owner: tr('مالك المتجر', 'Store owner'),
    branch_manager: tr('مدير الفرع', 'Branch manager'),
    picker: tr('موظف تجهيز الطلبات', 'Order picker'),
  };
  const owners = [...new Map(memberships.filter((m) =>
    m.role === 'owner' && m.is_active && m.seller_status === 'approved' && m.branch_id === null,
  ).map((m) => [m.seller_id, m])).values()];
  const [sellerId, setSellerId] = useState('');
  const selected = Number(sellerId || owners[0]?.seller_id);
  const [rows, setRows] = useState<SellerStaffMember[]>([]);
  const [branches, setBranches] = useState<SellerBranch[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [detail, setDetail] = useState<SellerStaffMember | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState<SellerStaffMember | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [revision, setRevision] = useState(0);
  const storeBranches = branches.filter((b) => b.seller_id === selected && b.is_active);
  const reason = (cause: unknown) => isApiError(cause)
    ? [cause.message, ...Object.values(cause.fieldErrors).flat()].filter(Boolean).join(' · ')
    : tr('تعذر إتمام العملية. تحقق من الاتصال والصلاحيات.', 'Action failed. Check connection and permissions.');

  useEffect(() => {
    if (!owners.some((owner) => owner.seller_id === selected)) return;
    let active = true;
    setBusy(true);
    setError('');
    void Promise.all([sellerStaff(selected), sellerBranches()])
      .then(([staff, branchList]) => {
        if (!active) return;
        setRows(staff.data);
        setBranches(branchList.data);
        setLoaded(true);
      })
      .catch((cause: unknown) => {
        if (active) { setError(reason(cause)); setLoaded(false); }
      })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, revision]);

  const openEdit = (member: SellerStaffMember) => {
    if (member.role === 'owner') return;
    setError('');
    setEditor({
      member, userId: String(member.user_id),
      role: member.role === 'branch_manager' ? 'branch_manager' : 'picker',
      branchId: String(member.branch_id ?? ''),
      active: member.is_active,
    });
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editor || busy) return;
    const branchId = Number(editor.branchId);
    if (!storeBranches.some((b) => b.id === branchId)) {
      setError(tr('اختر فرعًا نشطًا تابعًا لهذا المتجر.', 'Choose an active branch belonging to this store.'));
      return;
    }
    const userId = Number(editor.userId);
    if (editor.member === null && (!Number.isSafeInteger(userId) || userId <= 0)) {
      setError(tr('أدخل رقم حساب مستخدم مسجل صحيحًا.', 'Enter a valid existing user account ID.'));
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const input: SellerStaffInput = { role: editor.role, branch_id: branchId, is_active: editor.active };
      if (editor.member) {
        await updateSellerStaff(editor.member.id, input);
        setNotice(tr('تم تحديث صلاحيات الموظف.', 'Staff permissions updated.'));
      } else {
        await addSellerStaff(selected, userId, input);
        setNotice(tr('تمت إضافة الموظف إلى الفريق.', 'Staff member added to the team.'));
      }
      setEditor(null);
      setRevision((v) => v + 1);
    } catch (cause) { setError(reason(cause)); }
    finally { setBusy(false); }
  };

  const deactivate = async () => {
    const member = confirmDeactivate;
    if (!member || busy || member.role === 'owner' || !member.is_active) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await deactivateSellerStaff(member.id);
      setConfirmDeactivate(null);
      setNotice(tr('تم إيقاف وصول الموظف.', 'Staff access deactivated.'));
      setRevision((v) => v + 1);
    } catch (cause) { setError(reason(cause)); }
    finally { setBusy(false); }
  };

  if (owners.length === 0) return <p>{tr('هذه الصفحة متاحة لمالك متجر معتمد فقط.', 'Only approved store owners can manage staff.')}</p>;

  return (
    <section className="seller-team-section">
      <div className="seller-team-heading">
        <div>
          <h2>{tr('فريق المتجر', 'Store team')}</h2>
          <p>{tr('إدارة أعضاء الفريق وأدوارهم وفروعهم. تغيير المالك ليس متاحًا من هنا.', 'Manage team members, roles, branch access and status. Owner changes are not available here.')}</p>
        </div>
        <button type="button" disabled={busy || !loaded || storeBranches.length === 0}
          onClick={() => { setEditor(blankEditor()); setError(''); }}>
          + {tr('إضافة موظف', 'Add staff')}
        </button>
      </div>
      <div className="seller-team-toolbar">
        <label>{tr('المتجر', 'Store')}
          <select value={sellerId || String(owners[0]?.seller_id ?? '')} disabled={busy}
            onChange={(e) => { setSellerId(e.target.value); setEditor(null); setDetail(null); setLoaded(false); }}>
            {owners.map((owner) => (
              <option key={owner.seller_id} value={owner.seller_id}>{ar ? owner.name_ar : owner.name_en}</option>
            ))}
          </select>
        </label>
        <button type="button" disabled={busy} onClick={() => setRevision((v) => v + 1)}>
          {tr('تحديث', 'Refresh')}
        </button>
      </div>
      {error && <p className="seller-team-error" role="alert">{error}</p>}
      {notice && <p role="status" className="seller-form-success">{notice}</p>}
      {busy && !loaded && <p role="status">{tr('جار تحميل الفريق…', 'Loading team…')}</p>}
      {loaded && (
        <>
          <div className="seller-team-summary">
            <div><span>{tr('إجمالي العضويات', 'Memberships')}</span><strong>{rows.length}</strong></div>
            <div><span>{tr('النشطون', 'Active')}</span><strong>{rows.filter((m) => m.is_active).length}</strong></div>
            <div><span>{tr('الموقوفون', 'Inactive')}</span><strong>{rows.filter((m) => !m.is_active).length}</strong></div>
          </div>
          <div className="seller-team-table-wrap">
            <table>
              <thead><tr>
                <th>{tr('رقم الموظف', 'Employee number')}</th>
                <th>{tr('اسم الموظف', 'Employee name')}</th>
                <th>{tr('الدور', 'Role')}</th>
                <th>{tr('الفرع', 'Branch')}</th>
                <th>{tr('الحالة', 'Status')}</th>
                <th>{tr('الإجراءات', 'Actions')}</th>
              </tr></thead>
              <tbody>
                {rows.map((member) => (
                  <tr key={member.id}>
                    <td><strong className="seller-team-employee-number" dir="ltr">{member.employee_number ?? '—'}</strong></td>
                    <td>{member.name ?? tr('موظف المتجر', 'Store team member')}</td>
                    <td>{roleLabels[member.role] ?? member.role}</td>
                    <td>{member.branch_id === null
                      ? tr('كل الفروع', 'All branches')
                      : (ar ? branches.find((b) => b.id === member.branch_id)?.name_ar
                        : branches.find((b) => b.id === member.branch_id)?.name_en) ?? ('#' + member.branch_id)}</td>
                    <td><span className={'seller-team-status ' + (member.is_active ? 'is-active' : 'is-inactive')}>
                      {member.is_active ? tr('نشط', 'Active') : tr('موقوف', 'Inactive')}
                    </span></td>
                    <td><div className="seller-team-actions">
                      <button type="button" disabled={busy} onClick={() => setDetail(member)}>
                        {tr('تفاصيل', 'Details')}
                      </button>
                      {member.role !== 'owner' && (
                        <>
                          <button type="button" disabled={busy} onClick={() => openEdit(member)}>
                            {tr('تعديل', 'Edit')}
                          </button>
                          {member.is_active && (
                            <button type="button" className="seller-team-danger" disabled={busy}
                              onClick={() => setConfirmDeactivate(member)}>
                              {tr('إيقاف', 'Deactivate')}
                            </button>
                          )}
                          {!member.is_active && (
                            <button type="button" disabled={busy || storeBranches.length === 0}
                              onClick={() => openEdit(member)}>
                              {tr('إعادة تفعيل', 'Reactivate')}
                            </button>
                          )}
                        </>
                      )}
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length === 0 && <p>{tr('لا يوجد موظفون في هذا المتجر.', 'No staff in this store.')}</p>}
        </>
      )}

      {detail && (
        <div className="seller-team-overlay" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setDetail(null); }}>
          <div className="seller-team-dialog" role="dialog" aria-modal="true" aria-labelledby="seller-team-detail-title">
            <h3 id="seller-team-detail-title">{tr('تفاصيل العضوية', 'Membership details')}</h3>
            <dl>
              <dt>{tr('رقم الموظف', 'Employee number')}</dt><dd dir="ltr">{detail.employee_number ?? '—'}</dd>
              <dt>{tr('اسم الموظف', 'Employee name')}</dt><dd>{detail.name ?? '—'}</dd>
              <dt>{tr('رقم الحساب الداخلي', 'Internal account ID')}</dt><dd>{detail.user_id}</dd>
              <dt>{tr('الدور', 'Role')}</dt><dd>{roleLabels[detail.role] ?? detail.role}</dd>
              <dt>{tr('رقم الفرع', 'Branch ID')}</dt><dd>{detail.branch_id ?? tr('كل الفروع', 'All branches')}</dd>
              <dt>{tr('الحالة', 'Status')}</dt><dd>{detail.is_active ? tr('نشط', 'Active') : tr('موقوف', 'Inactive')}</dd>
            </dl>
            <button type="button" onClick={() => setDetail(null)}>{tr('إغلاق', 'Close')}</button>
          </div>
        </div>
      )}

      {editor && (
        <div className="seller-team-overlay" role="presentation"
          onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) setEditor(null); }}>
          <form className="seller-team-dialog" role="dialog" aria-modal="true"
            aria-labelledby="seller-team-edit-title" onSubmit={(e) => void save(e)}>
            <h3 id="seller-team-edit-title">{editor.member
              ? tr('تعديل صلاحيات الموظف', 'Edit staff permissions')
              : tr('إضافة موظف مسجل', 'Add existing user')}</h3>
            {editor.member && <p>{tr('رقم الموظف', 'Employee number')}: <strong dir="ltr">{editor.member.employee_number}</strong></p>}
            {!editor.member && <p>{tr('يجب أن يكون الموظف لديه حساب مسجل مسبقًا في التطبيق.', 'The employee must already have a registered account in the app.')}</p>}
            <label>{tr('رقم حساب المستخدم', 'User account ID')}
              <input type="number" min={1} step={1} required disabled={busy || !!editor.member}
                value={editor.userId} onChange={(e) => setEditor({ ...editor, userId: e.target.value })}/>
            </label>
            <label>{tr('الدور', 'Role')}
              <select value={editor.role} disabled={busy}
                onChange={(e) => setEditor({ ...editor, role: e.target.value as SellerStaffInput['role'] })}>
                <option value="picker">{roleLabels.picker}</option>
                <option value="branch_manager">{roleLabels.branch_manager}</option>
              </select>
            </label>
            <label>{tr('الفرع', 'Branch')}
              <select required value={editor.branchId} disabled={busy}
                onChange={(e) => setEditor({ ...editor, branchId: e.target.value })}>
                <option value="">{tr('اختر الفرع', 'Select branch')}</option>
                {storeBranches.map((branch) => (
                  <option key={branch.id} value={branch.id}>{ar ? branch.name_ar : branch.name_en}</option>
                ))}
              </select>
            </label>
            {editor.member && <label className="seller-team-toggle">
              <input type="checkbox" checked={editor.active} disabled={busy}
                onChange={(e) => setEditor({ ...editor, active: e.target.checked })}/>
              {tr('حساب الموظف نشط', 'Membership active')}
            </label>}
            {error && <p role="alert" className="seller-team-error">{error}</p>}
            <div className="seller-team-dialog-actions">
              <button type="button" disabled={busy} onClick={() => setEditor(null)}>{tr('إلغاء', 'Cancel')}</button>
              <button type="submit" disabled={busy || !editor.branchId}>{busy ? tr('جار الحفظ…', 'Saving…') : tr('حفظ', 'Save')}</button>
            </div>
          </form>
        </div>
      )}

      {confirmDeactivate && (
        <div className="seller-team-overlay" role="presentation"
          onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) setConfirmDeactivate(null); }}>
          <div className="seller-team-dialog" role="alertdialog" aria-modal="true" aria-labelledby="seller-team-confirm-title">
            <h3 id="seller-team-confirm-title">{tr('تأكيد إيقاف العضوية', 'Confirm deactivation')}</h3>
            <p>{tr('سيتم منع هذا الموظف من استخدام صلاحيات الفريق في المتجر. يمكن إعادة تفعيله لاحقًا.', 'This employee will lose store team access. You can reactivate later.')}</p>
            <div className="seller-team-dialog-actions">
              <button type="button" disabled={busy} onClick={() => setConfirmDeactivate(null)}>{tr('إلغاء', 'Cancel')}</button>
              <button type="button" className="seller-team-danger" disabled={busy} onClick={() => void deactivate()}>
                {tr('تأكيد الإيقاف', 'Deactivate')}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

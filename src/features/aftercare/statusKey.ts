export function caseStatusKey(status: string) {
  switch (status) {
    case 'submitted':
      return 'statuses.submitted';
    case 'in_review':
      return 'statuses.in_review';
    case 'resolved':
      return 'statuses.resolved';
    case 'rejected':
      return 'statuses.rejected';
    default:
      return 'statuses.unknown';
  }
}

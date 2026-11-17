# ALL 5.75 frontend — Day 15 release checklist (27 Nov 2026)

**Feature branch:** `feature/nov2026-days08-17` (not `v2`).

## Preflight

Use a clean working tree on the feature branch.

```powershell
git fetch origin
git checkout feature/nov2026-days08-17
git pull --ff-only origin feature/nov2026-days08-17
npm ci
npm run typecheck
npm run test
npm run build
```

Record and address any failures before staging. `npm run build` produces `dist`;
it does not automatically deploy the public website.

## Manager pilot review

1. Signed-in Admin sees only authorized ready-and-paid orders in the courier
   selector, with courier zone eligibility. Dispatch errors are understandable.
2. Super Admin can approve/suspend couriers. Admin cannot bypass approval.
3. Courier dashboard is available only to a verified account with courier profile.
4. Courier online/offline is persisted; only their own offers appear. Accept, decline
   and expiry states stay consistent after refresh.
5. Wrong seller pickup code and wrong customer delivery code do not move the order.
   Five incorrect pickup attempts lock the code. Customer delivery attempts are counted.
6. Correct seller pickup sets `on_the_way` and issues a **different** customer code.
7. Correct customer code completes the suborder. Customer order details show
   courier milestones in Arabic/English/French; notifications do not expose codes.
8. A failed delivery opens an incident; it does **not** appear as delivered.
9. Validate customer, seller, Admin, Super Admin and courier navigation in both RTL
   and LTR. Check mobile width, forms, status feedback, and existing checkout.
10. Record screenshot, route, result and any exact error for each failed check.

## Pilot blockers and limits

- This checklist does not certify production readiness or indicate tests passed.
- The real payment gateway and delivery messaging need environment credentials.
- Real refund execution, auto-dispatch, live GPS and payout automation are out of
  MVP scope; incident tracking and earnings placeholders are not substitutes.
- Approve staging first. No production upload is authorized by this branch alone.
- Excel's detailed tasks put Day 15 on Nov 27; Day 16/17 domain tests follow on
  Nov 30 and Dec 1, and are NOT part of the November 27 sign-off.

## Selective merge

```powershell
git log --oneline --grep="Day 13:"
git log --oneline --grep="Day 14:"
git log --oneline --grep="Day 15:"
```

Cherry-pick a day's commits in chronological order, verifying dependencies
in the other repository. Avoid merging the entire branch when requesting just
one day.

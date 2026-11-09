# ALL 5.75 - Day 1 frontend integration audit (v2)

Date: 2026-11-09
Backend counterpart: [API Day 1 audit](https://github.com/EhsasElias/all-575-api/blob/v2/docs/ALL575_DAY1_INTEGRATION_AUDIT.md).

## Confirmed route coverage

| Existing UI | Code location | Notes |
| --- | --- | --- |
| Customer checkout + payment | `src/features/checkout/routes.tsx` | Customer checkout and payment pages exist behind `RequireAuth`. |
| Customer orders + spending | `src/features/orders/routes.tsx` | Order list/detail and spending routes exist behind `RequireAuth`. |
| Seller workspace | `src/features/account/routes.tsx`, `SellerWorkspaceScreen.tsx` | Seller UI includes products, inventory, orders, preparation, finance and branches. |
| Seller onboarding | `src/features/account/routes.tsx`, `SellerApplicationScreen.tsx` | Seller application route is registered. |
| Seller review | `src/features/account/routes.tsx`, `SellerReviewScreen.tsx` | Applications, products, branches and categories review UI exists; backend uses explicit review grants. |

## Missing route-level integration for MVP

- No dedicated courier route group is wired into `src/app/router.tsx`; the app currently combines catalog, cart, account, auth, checkout, orders, and aftercare route groups.
- The current account routes include seller review but not a dedicated Super Admin account-management dashboard or Admin order/dispatch operations screen.
- Courier login/availability, assigned tasks, accepting a job, pickup verification, delivery confirmation, and failure reporting still need a secure API contract and corresponding UI.
- Customer order tracking should consume backend delivery-status changes after courier workflows are implemented; do not simulate successful delivery in the UI.

## Proposed UI integration sequence

1. Confirm existing order summary fields are adequate for an operational Admin queue.
2. Add authenticated Admin operational routes backed by server-enforced Admin permissions.
3. Add a courier-specific session/role, assigned-jobs screen and task detail.
4. Reuse existing order state labels; implement pickup and delivery confirmations only through server-authorized, idempotent APIs.
5. Connect confirmed courier events to customer tracking and seller order status.
6. Verify mobile viewport, Arabic/English translation, status visibility and end-to-end acceptance tests.

**Status:** Frontend route inspection complete; functional readiness and deployment have not been verified.

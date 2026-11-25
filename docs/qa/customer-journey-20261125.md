# ALL 5.75 — Customer journey QA audit (2026-11-25)

**Status: source-level review and regression changes saved; end-to-end browser run NOT executed.**
Do not treat past test results as evidence for the newest commits.
Source: all-575-android QA branch `fix/qa-home-reference-layout-20261124` and
all-575-api QA branch `fix/qa-zone-stock-checkout-20261125`.

## Customer journey verification matrix

| Step | Source-reviewed behavior | Evidence / remaining QA |
| --- | --- | --- |
| 1. Launch, splash, welcome | Intro and welcome routes exist in the frontend | Test first install, every reopen, saved guest state; browser/mobile not executed |
| 2. Register / sign in | API accepts email/password with OTP-confirmed email, and separate email OTP flow; token is scoped to the customer | Verify valid/expired/wrong OTP, consent versions, retry/rate limit, email delivery with test accounts |
| 3. Browse, search, categories | Public products endpoint filters published listings; stock status from active branches no longer requires a delivery zone | Test stock 0, low, reserved, disabled seller/branch, AR/EN/FR, pagination, filters |
| 4. Product page | Variant availability is supplied from API; Add to Cart is disabled on `out_of_stock` | Test rapid taps, stock changes between viewing and adding, variants, images |
| 5. Guest/signed-in cart | Guest cart persists locally and merges after sign-in; signed-in cart now reads quantity-specific availability from the same authoritative `/cart` response | Regression fix: remove stale secondary stock query; block signed-in checkout when stock is unknown, gone or insufficient; guest must sign in and revalidate |
| 6. Address | Server validates address fields and resolves a delivery zone | **Unresolved business rule:** stock is global but delivery fees/slots still require a configured service zone. Must design courier coverage outside defined zones before enabling arbitrary-address checkout |
| 7. Slot, quote and promo | Quote builder reprices on server (SAR halalas, VAT, delivery fee), checks every line and exposes `can_checkout`; slots scoped to address's zone | Verify discounts, VAT rounding, expiry, invalid code, slot full, stale address; do not use real payment |
| 8. Place order | Server rechecks quote fingerprint, idempotency key, stock and slot under transaction; conditional stock hold protects concurrency | Test repeated POST, concurrent last-item purchase, quote_changed, payment errors, rollback on disposable DB |
| 9. Payment | Payment redirect is restricted to HTTPS; server verifies provider callbacks; cash-on-delivery uses separate confirmation | Test fake provider success/failure/retry, callback duplication; never charge real card |
| 10. Orders / tracking | Customer `/orders` and `/orders/{id}` scoped to authenticated owner | Verify order timeline, seller, courier assignment, delivery-code security, cancel status |
| 11. Aftercare | Customer cases and messages, reviews, order cancellation and spending report endpoints are owner-scoped | Test delivered/non-delivered eligibility, quantity caps, duplicate refund requests, review permission, exports |
| 12. Logout / return visit | Logout revokes current token; server supports session revocation | Test expiry, multi-device, account switch, cache isolation, splash reopening |

## Confirmed source-level findings and fixes

1. Backend stock was previously calculated per delivery zone, while customer needs stock from **any active branch**. Updated `Availability`, `ProductController`, `CartController`, `StockReservations`; pending fresh integration test run.
2. Cart availability did not always consider requested quantity, risking a checkout link when requested quantity exceeds available units. Fixed API `CartResource` and added regression test.
3. Frontend had an extra inventory query which could return **stale line availability after quantity edits**, overriding the fresh `/cart` response. Removed this duplicate read from `useCartScreen`; the server cart now drives checkout eligibility.
4. A signed-in cart with unknown availability could pass a simple no-error check. Strict readiness now blocks signed-in checkout until each line is definitely available. Guest goes to login then server validation.
5. Customer catalogue homepage recommendations now request in-stock products without requiring a delivery zone.
6. Global inventory checks and reservations on the backend now require the inventory branch to belong to the product's seller, preventing accidental cross-seller stock fulfilment. Added a dedicated regression test.

## Release blockers, not claimed resolved

- **Courier delivery outside configured service zones:** `QuoteBuilder` still refuses `address_not_serviceable`, and `PlaceOrder::bookSlot` requires a delivery slot in a service zone. This is independent of warehouse stock. Do not silently choose an arbitrary delivery fee or slot.
- Confirm actual server database stock after backend updates; no database read/write performed in this audit.
- Tests were not executed in this environment (GitHub DNS unavailable; no runnable checkout here). The previously reported 1,783 frontend test passes predate the new changes.
- Complete guest/browser and authenticated customer E2E on staging with test accounts only, including courier and aftercare handoff.

## QA commands (disposable backend DB only)

Frontend:
```sh
npm ci
npx vitest run src/features/cart/cartScreenModel.test.ts src/features/cart/CheckoutBar.test.tsx src/features/catalog/components/ProductParts.test.tsx
npm run build
npm test
npm run lint
npm run locales:audit
npm run api:check
```

Backend: check `APP_ENV=testing`, `DB_CONNECTION=sqlite`, `DB_DATABASE=:memory:`
before running any tests; never run these against staging/production databases.
```sh
php artisan test --filter=CustomerCatalogStockFlowTest
php artisan test --filter=ZoneAvailabilityMatchesReservationTest
php artisan test --filter=CartQuantityAvailabilityTest
php artisan test
composer lint
```

Run screen-level checks at 320, 360, 393, 768 and 1440 px in
Arabic RTL, English and French, on light/dark themes. Verify browser
network errors and missing/out-of-stock controls before production rollout.

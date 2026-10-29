# Customer testing - step by step

Use both repositories on branch `v2`. Read [CUSTOMER_MAP.md](CUSTOMER_MAP.md) first: items marked **Gap** are unimplemented and must be recorded as **Blocked**, never Pass. This guide covers the supplied visual roadmap's customer requirements and important failure paths; it cannot guarantee every possible device, provider or operational scenario.

## 1. Prepare one isolated test environment

Do this on a development database. Do not reuse a real customer database. Requirements: PHP 8.3 with mbstring/intl/XML/PDO SQLite, Composer, Node 22.12+ and npm. For Android builds use Android Studio/SDK and Java 21, or the repository's GitHub Actions workflow.

Terminal A:

```bash
git clone --branch v2 https://github.com/EhsasElias/all-575-api.git
cd all-575-api
composer setup
php artisan serve --host=0.0.0.0 --port=8000
```

If already cloned: switch to `v2`, pull the changes, run `composer install` then `php artisan migrate`. `composer setup` seeds demo data: run it only on a fresh test database. Re-running the demo seeder resets demo stock/reservations and can invalidate existing test orders. Do not run `migrate:fresh` against any database you need to keep.

Confirm `.env` has `APP_ENV=local`, `OTP_DRIVER=log`, `PAYMENT_DRIVER=fake`. `APP_URL` must be the reachable backend origin so images load. Local simulation does not charge a bank card.

Terminal B, a second shell in the backend folder:

```bash
php artisan schedule:work
```

This expires unpaid holds, generates delivery slots and retries pending provider refund submissions. Stop it with Ctrl+C when finished.

Terminal C:

```bash
git clone --branch v2 https://github.com/EhsasElias/all-575-android.git
cd all-575-android
npm ci
```

Create `.env.local` in the frontend folder:

```dotenv
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_TEST_PANEL=true
```

Then:

```bash
npm run dev -- --host 0.0.0.0
```

Open `http://localhost:5173`. Use browser mobile emulation around 390 x 844. Keep the console and Network panel open. Test panel must be absent in customer builds.

## 2. Prepare your customer test data

Use two separate browser profiles, or a normal window and an incognito window:

- **Customer A:** a test email you control, e.g. `customer-a@example.test` in the local log driver.
- **Customer B:** a different test email, `customer-b@example.test`.
- **Address A:** recipient Test Customer; valid-format Saudi mobile test fixture `0500000001` (no SMS is sent by the local driver); region Riyadh; city Riyadh; district Al Olaya; street King Fahd Road; building `8228`; additional `1234`; postal `12611`; short address `RRRD2929`; unit `5`; floor `2`; pin near `24.7136, 46.6753`.
- These are synthetic test fields, not a verified deliverable National Address. The pin must be within the demo Riyadh zone (40 km radius).
- **Outside zone:** select a pin far from Riyadh. Do not rely on the written city alone.
- **Products:** `demo-clothing-1` (S/M/L), `demo-vegetables-1` (Tomatoes), `demo-fruits-1` (Red apples), `demo-toys-1` (Teddy bear).
- Add products from different sellers for multi-delivery testing: tomatoes from Home Store and a T-shirt from Beauty World.
- The current seeded unit price is **5.75 SAR**, with **10 SAR** demo delivery below **50 SAR**; nine units cost 51.75 SAR and meet that threshold. The source roadmap's extra prices are a documented gap.

Prepare separate orders and record their displayed numbers:

| Label    | Purpose                               | Setup                                                 |
| -------- | ------------------------------------- | ----------------------------------------------------- |
| PENDING  | Pending, interruption, retry, timeout | Checkout and leave payment pending                    |
| CANCEL   | Cancellation and pending refund       | Pay, leave seller awaiting preparation                |
| DELIVERY | Tracking, delivery code, reviews      | Pay with two sellers; advance stages in section 5     |
| RETURN   | Partial returns                       | Buy two identical units, pay and advance to delivered |
| EMPTY-B  | Account privacy and empty history     | Customer B without purchases                          |

Sign-in codes: after requesting one, open `all-575-api/storage/logs/laravel.log` and find the latest `OTP issued (log driver)` entry for your destination. In hosted testing use the server logs. Do not paste codes into bug reports.

## 3. Run the normal customer journey first

1. Open or reload the app on Home or another page, including after a previous visit. Verify the short animated loading logo appears first, followed by the welcome slider with swipe/dot navigation and language control. Tap the framed logo or Skip to enter the shop. Check the header logo sits in the corner opposite the menu.
2. Browse without signing in. Select Riyadh delivery area. Open Categories, a category, then a product.
3. Open T-shirt, select size M, add two units. Add tomatoes from another seller.
4. Open Cart. Check product, size, quantity and availability. Change a quantity, remove/re-add a line.
5. Continue to checkout. Sign in with Customer A and the code from the local log. Read and accept Terms and Privacy; leave marketing off. Verify the guest cart survives sign-in once.
6. Add Address A; confirm the pin and written fields separately; save it as default.
7. Select a future delivery slot. Check server total, discount, delivery fee and VAT included. The VAT line must not be added again.
8. Choose mada and place order. Save the number. On the test payment page select simulated success; this plays a signed provider event.
9. Verify only one order appears, marked confirmed/paid, with correct address snapshot, delivery slot and seller deliveries.
10. Follow section 5 to advance tracking. After delivery leave a product review.
11. Open **Get help or request a return**; create a support request. Follow its reference from **Account > Support and returns**.
12. Open Account > Spending; select dates containing this order. Compare total, VAT and refunds against order details; download CSV and open it in Excel.

## 4. Execute the scenario matrix

For each ID record Pass / Fail / Blocked, actual result, device/browser, language, order/reference and screenshot. A request reference or order number is enough; exclude access tokens, OTPs, card data and full personal addresses.

### Welcome, browsing and products

| ID  | Steps                                                                            | Expected result                                                                                                                                                   |
| --- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| W01 | Open/reload Home or another page, including a returning visit; swipe or tap dots | Loading logo first, then three slides advancing every four seconds and looping; swipe/dots still work, no playback button; continue/Skip opens the requested page |
| W02 | Change AR to EN and reopen app                                                   | Correct direction and text; language persists                                                                                                                     |
| W03 | Use reduced motion and keyboard/screen reader                                    | Controls usable; focus visible; no forced animation dependency                                                                                                    |
| W04 | Deny location permission, then select Riyadh manually                            | Browsing works; no forced permission or blank page                                                                                                                |
| B01 | Browse home/categories/product while signed out                                  | No login required until protected action                                                                                                                          |
| B02 | Open category and subcategory fixture                                            | Correct products; inactive/unapproved content excluded. Subcategory fixture requires additional seed                                                              |
| B03 | Search `Tomatoes`, `طماطم`, and a nonsense word                                  | Relevant match or useful empty state; no crash                                                                                                                    |
| B04 | Open product then seller link                                                    | Correct seller and seller-specific products                                                                                                                       |
| B05 | Choose S then M; add each                                                        | Separate exact variants in cart                                                                                                                                   |
| B06 | Set fixture stock to zero, refresh product, try adding                           | Clearly unavailable; backend refuses purchase                                                                                                                     |
| B07 | Select another delivery zone, then return to product/cart                        | Availability revalidated; old stock not trusted                                                                                                                   |
| B08 | Disable internet, open product, restore connection, retry                        | Error/retry; no false success                                                                                                                                     |
| B09 | Open a nonexistent product/category URL                                          | Useful not-found state and way back                                                                                                                               |
| B10 | Test combined category/subcategory/company/price 2-8 filter                      | **Blocked:** combined filter and variable pricing incomplete                                                                                                      |
| B11 | Review product images and all welcome screens                                    | Real acceptable images, no medicine imagery; record visual failures separately                                                                                    |

### Sign-in, consent and account

| ID  | Steps                                                      | Expected result                                                         |
| --- | ---------------------------------------------------------- | ----------------------------------------------------------------------- |
| A01 | Sign in with valid local email and correct code            | Verified session; returns to intended page                              |
| A02 | Enter malformed email/mobile or wrong OTP                  | Validation/error; remains signed out                                    |
| A03 | Enter five wrong codes, then correct one                   | Attempt limit applies; cannot bypass by entering correct code afterward |
| A04 | Wait over five minutes before entering code                | Expired code refused; request new code                                  |
| A05 | Try resend immediately; retry after 60 seconds             | Cooldown respected; no repeated code spam                               |
| A06 | Leave Terms or Privacy unchecked and continue              | Cannot complete required consent; no prechecked mandatory consent       |
| A07 | Keep marketing off, sign in, inspect Account               | Off remains off; sign-in/purchase still works                           |
| A08 | Turn marketing on/off; reopen Account                      | Saved choice persists; failure does not claim saved                     |
| A09 | Edit profile name/language; sign out/in                    | Saved values restored                                                   |
| A10 | Sign in on second device; revoke it from Devices           | Revoked device cannot call protected APIs; current device unaffected    |
| A11 | Revoke current session/sign out, then open Orders          | Sign-in required; another customer's cached data never shown            |
| A12 | Interrupt network while saving profile/preferences         | Clear error; can retry; no premature success                            |
| A13 | Test fingerprint/face unlock                               | **Blocked:** native biometric unlock absent                             |
| A14 | Change login email/mobile with reverification              | **Blocked:** contacts read-only currently                               |
| A15 | Data access/account closure request with retention outcome | **Blocked:** formal account request flow absent                         |

### Addresses

| ID  | Steps                                                         | Expected result                                                                                                                    |
| --- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| D01 | Save Address A; edit unit; set default; create second address | Own saved addresses/default update correctly                                                                                       |
| D02 | Omit required fields or enter 3-digit building/4-digit postal | Validation; no invalid address saved                                                                                               |
| D03 | Use invalid mobile and malformed short address                | Validation; correct values accepted                                                                                                |
| D04 | Deny geolocation; manually move pin and enter address         | Pin selection fills available address suggestions; manual correction/completion works; no National Address verification is claimed |
| D05 | Move pin outside service zone; attempt checkout               | Unserviceable delivery refused clearly                                                                                             |
| D06 | Change checkout address after quote/slot selected             | New quote/service/stock/fees; old slot not silently reused                                                                         |
| D07 | Pay order, then edit/delete saved address                     | Existing order retains original address snapshot                                                                                   |
| D08 | Customer B requests Customer A address ID via API             | Not found; no address details leaked                                                                                               |
| D09 | Test Google search/drag pin provider                          | **Blocked:** current interactive map uses Leaflet/OpenStreetMap                                                                    |

### Cart, promotion, price and slot

| ID  | Steps                                                             | Expected result                                                                               |
| --- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| C01 | Add guest cart, sign in, refresh                                  | Merges once; exact quantities and variants preserved                                          |
| C02 | Increment/decrement/remove last item                              | Valid quantities; empty cart has shopping action                                              |
| C03 | Attempt zero, negative, decimal or over-20 quantity via API       | Refused; server limits authoritative                                                          |
| C04 | Buy one standard-tax item                                         | 5.75 gross = 5.00 net + 0.75 VAT before fee/discount allocation; included VAT not added twice |
| C05 | Change delivery threshold by buying nine units                    | Server applies configured threshold and fee; current seed 51.75 gross qualifies               |
| C06 | Apply valid promo; remove promo; apply invalid/expired code       | Correct quote or clear refusal. Valid/expired promo fixtures are not seeded by default        |
| C07 | Use promo below minimum, after usage limit, from ineligible scope | Refused by server; execute backend QuoteTest for fixture coverage                             |
| C08 | Change stock/price/fees after quote; click Pay                    | Quote conflict shown for customer review; no silent increase                                  |
| C09 | Leave quote open over ten minutes                                 | Refresh required; stale quote not charged                                                     |
| C10 | Select no slot, expired slot or one filled by another buyer       | Cannot pay or clear slot refusal and refresh; no oversubscription                             |
| C11 | Two customers attempt final unit at same time                     | At most one reservation succeeds; loser receives stock refusal                                |
| C12 | Attempt branch pickup                                             | **Blocked:** home delivery only                                                               |
| C13 | Test inclusive/exclusive prices and 2-8 SAR products              | **Blocked:** current fixed-price catalog needs coordinated update                             |

### Payments and cancellation

| ID  | Steps                                                               | Expected result                                                                                        |
| --- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| P01 | Choose mada; simulate success                                       | Confirmed only after server verifies event; one paid order                                             |
| P02 | Repeat with card and Apple Pay                                      | Fake method selection exercises app flow; real payment-sheet/provider test remains Blocked             |
| P03 | Simulate failure; retry before hold expiry; simulate success        | Failure shown; safe retry; no duplicate successful charge                                              |
| P04 | Close/back out of payment without event; reopen order               | Pending, never paid solely because app returned                                                        |
| P05 | Double-click Pay or repeat same checkout idempotency key            | Same order; no duplicate reservation/charge                                                            |
| P06 | Lose network after checkout sent, restore and retry                 | Same attempt recovered; inspect server order list for duplicates                                       |
| P07 | Wait beyond 15-minute hold with scheduler running                   | Unpaid order cancelled; stock/slot released; stale payment cannot create a live order silently         |
| P08 | Send duplicate/tampered/out-of-order gateway callbacks              | Duplicate ignored; invalid signature rejected; early callback retry handled (backend robustness tests) |
| P09 | Cancel paid order before preparation                                | Order cancelled; stock freed; refund pending, not successful immediately                               |
| P10 | Begin preparation, attempt customer cancellation                    | Direct cancellation blocked; support request available                                                 |
| P11 | Provider confirms refund, rejects refund or temporarily unavailable | Separate pending/succeeded/failed state; no false completion. Use backend tests for provider callbacks |
| P12 | Test real mada/card/wallet and 3-D Secure sandbox                   | **Blocked until a real gateway and merchant sandbox are configured**                                   |

### Tracking, delivery and reviews

| ID  | Steps                                                            | Expected result                                                                     |
| --- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| T01 | Advance DELIVERY one stage at a time (section 5)                 | Auto-refreshed preparing > ready > on the way > delivered timeline                  |
| T02 | Use two sellers; advance one suborder in backend test            | Separate deliveries; parent completes after all relevant deliveries finish          |
| T03 | Revise ETA in fulfilment test                                    | Customer sees revised ETA and reason; Saudi display timezone                        |
| T04 | Open on-the-way order; reveal dedicated delivery code            | Not the login OTP; unavailable before appropriate stage/after completion            |
| T05 | Invalid, exhausted, expired or consumed delivery code            | Verification service refuses; local advance command does not test physical handover |
| T06 | Open delivered item, submit 1-5 stars and text                   | Verified product review; duplicate review refused                                   |
| T07 | Try review before delivery, foreign order or unpurchased product | Refused; no fabricated verified review                                              |
| T08 | Edit review inside and after seven-day window                    | Only within allowed window                                                          |
| T09 | Test live courier map, contact, separate collection code/QR      | **Blocked:** live operations/pickup/QR integrations absent                          |
| T10 | Rate whole order/seller/courier; report/appeal a review          | **Blocked:** current UI/API covers product reviews only                             |

### New support and returns

| ID  | Steps                                                          | Expected result                                                                            |
| --- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| R01 | Order > Get help > Order issue; submit reason and message      | Reference, Submitted status and first message; saved in Account > Support and returns      |
| R02 | Enter spaces only or exceed field length                       | No empty request; subject <=120 and message <=3000 enforced                                |
| R03 | Replay same create request with same `request_key`             | Same case and one first message; no duplicate case                                         |
| R04 | Reuse key with changed body/order                              | 409 `case_key_reused`; no overwrite                                                        |
| R05 | Try return on paid but undelivered order                       | No eligible line offered; backend refuses forced request                                   |
| R06 | RETURN order: choose delivered exact variant, quantity 1 of 2  | One return request; remaining requestable quantity 1                                       |
| R07 | Request 2 more from same line or use negative/decimal quantity | Refused; no over-return or refund                                                          |
| R08 | Request second remaining unit                                  | Accepted; no more eligible quantity for that line                                          |
| R09 | Open request, send follow-up; run support reply command        | Both messages visible; Under review status; refresh/poll gets latest reply                 |
| R10 | Reject first return request via test CLI, reopen form          | Rejected quantity becomes requestable again; original history preserved                    |
| R11 | Resolve request; attempt follow-up message                     | Closed notice; server rejects messages with `case_closed`; customer can open a new request |
| R12 | Drop internet during create, retry same unchanged form         | Same key reused; input retained; no premature success                                      |
| R13 | Customer B opens A's case/list/order care-items URL            | B list empty; details/messages/order items return 404                                      |
| R14 | Submit `user_id`, `status`, `refund_amount` extra fields       | Ignored; owner/status server-controlled; no money or stock changed                         |
| R15 | Resolve return and inspect order refunds                       | Case resolved does not mean refunded; no automatic return refund                           |
| R16 | Upload evidence, arrange return pickup/inspection/refund       | **Blocked:** attachment, policy, operations and partial-refund workflows remain            |
| R17 | Run care reply command in production environment               | Refused; no test-only support tool available to production customers                       |

### Reports, security and device behavior

| ID  | Steps                                                                 | Expected result                                                            |
| --- | --------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| H01 | Select last week/month/custom range containing orders                 | Own totals/history; separate order/payment/refund dates                    |
| H02 | Choose empty range or reversed dates                                  | Useful empty state or date validation                                      |
| H03 | Export CSV; open in Excel including Arabic text                       | Rows/totals match filtered report; Arabic readable                         |
| H04 | Open report as Customer B                                             | No A orders, addresses, case messages or amounts                           |
| H05 | Test XLSX/PDF report and PDF invoice/credit note download             | **Blocked:** CSV only currently; no invoice document generation            |
| H06 | Test category/seller/status spending filters                          | **Blocked:** current spending report filters by date only                  |
| H07 | Switch language while screen open; test narrow screen and larger font | Correct RTL/LTR, reachable controls, no clipped totals or long request IDs |
| H08 | Android back button, app background/resume, network loss              | Sensible navigation and recovery; no paid state invented                   |
| H09 | Expire/revoke token during checkout/case submit                       | Sign-in required; no private data from previous account after switch       |
| H10 | Build without `VITE_TEST_PANEL`; inspect all screens                  | No server-change/payment-simulation UI; no saved test server override      |
| H11 | Rate-limit protected create/message/login endpoints                   | Server throttles; no automatic retry loop or duplicated request            |

## 5. Simulate seller, courier and support actions

### Map address autofill checks

1. Open Add address: no provider request until selecting a pin or using current location.
2. Select the map point, drag the marker, use the center button and use GPS separately: available city/region/district/street/building/postcode fill. Review the actual provider result; not every point has all details.
3. Complete the additional number and other missing fields manually; correct a suggestion and save. The submitted details and coordinates match the form.
4. Move to a different point: old National Address details clear, new suggestions replace them. Recipient details remain. A delayed response from the previous point cannot replace the new address.
5. Type in a field while lookup runs: the customer edit wins. Saving is unavailable until lookup finishes. On provider failure/rate limit, manual entry and retry are available without losing edits.
6. Open an existing saved address: details remain unchanged and no lookup happens. Select a foreign point: it is not copied into the Saudi form. Repeat in AR/EN/FR and both themes.

The backend defaults to moderate user-triggered public Nominatim use with global throttling/caching. Follow the provider policy and use a shared backend cache; arrange a suitable contracted/self-hosted provider for higher production traffic. See backend README.

In a backend terminal replace `A575-XXXXXXXX` with your displayed order number. Run in order, pausing to inspect the app after every command:

```bash
php artisan orders:advance A575-XXXXXXXX preparing
php artisan orders:advance A575-XXXXXXXX ready
php artisan orders:advance A575-XXXXXXXX on_the_way
php artisan orders:advance A575-XXXXXXXX delivered
```

This moves all seller deliveries and is a test stand-in. It does not replace courier-code verification or an operational seller/courier application. Do not attempt stages out of order.

For a support request, copy its displayed reference, then:

```bash
php artisan care:reply CASE_ID "We are checking your delivery." --status=in_review
php artisan care:reply CASE_ID "The issue has been resolved." --status=resolved
```

For a separate return rejection scenario:

```bash
php artisan care:reply CASE_ID "Return request rejected; reason explained here." --status=rejected
```

Refresh the case, or wait up to 15 seconds while the app is foregrounded. The command is restricted to local/testing and never changes payments/refunds/stock. Do not tell a customer money was refunded without a confirmed provider refund record.

## 6. Run the automated checks

Backend, from its folder:

```bash
composer lint
php artisan test
```

Relevant suites: AddressBookTest, OtpLoginTest/OtpRaceTest, CartTest, QuoteTest, CheckoutTest/PaymentRobustnessTest, FulfilmentTest, ReviewsTest, SpendingReportTest, SecurityTest and **CustomerCasesTest**. Automated fixtures exercise stock, invalid promos, invalid callbacks, account isolation and return request restrictions. Running these is distinct from manually testing a real phone and real merchant sandbox.

Frontend, from its folder:

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run api:check
npx playwright install chromium
npm run test:e2e
```

Use the changed source in both repositories together. Contract updates are generated from the backend and pinned by commit; never hand-edit generated types.

## 7. Install an Android test build

1. Open the frontend repository on GitHub > Actions > **Build Android APK**.
2. Select **Run workflow**, branch **v2**. Enter the HTTPS test API URL ending `/api/v1`, or leave it empty to type the server address in the test app. Keep **test build** enabled.
3. Download artifact `all-575-test-apk`, unzip, install `app-debug.apk` on your test phone.
4. For a laptop server, use the same Wi-Fi, backend `serve --host=0.0.0.0`, reachable laptop LAN IP, correct `APP_URL` and CORS origins. `localhost` on the phone refers to the phone, not the laptop. Allow port 8000 through the laptop firewall.
5. In the test app use **Change server** and check the connection. Typical local value: `192.168.1.23:8000`; use your actual laptop address.
6. Repeat normal flow and device scenarios in AR and EN. Real wallet, biometrics and courier map tests stay Blocked until implemented/configured.
7. A Play Store/release build needs release signing and test mode disabled; the debug artifact is not a customer release.

## 8. Record results and decide readiness

Use columns: ID, result, expected, actual, device, language, order/case reference, evidence, owner. Keep failures and blocked items visible. Do not mark unimplemented requirements Pass simply because core shopping works. Release requires gateway/SMS configuration, business policy approval, missing roadmap features, real-device UAT and verification on the intended production database.

## Account creation and fingerprint unlock

- Open Account > Create account. Use a Saudi mobile number, or choose **Use email instead**.
- Enter the received six-digit code. New accounts must accept the current Terms and Privacy Policy; marketing is optional. Existing customers use the same verified-code flow.
- Android only: first enroll a fingerprint in the phone's system settings. After a verified sign-in, open Account > Fingerprint sign-in > Enable fingerprint, then complete the real system prompt.
- Background or close and reopen the app. Protected account pages must require unlocking. Open Sign in > Unlock with fingerprint. Success revalidates the saved session against `/me`; it never creates a new token or an account by itself.
- Cancel the prompt or use the wrong finger: remain signed out, with phone/email OTP still available. Remove fingerprint enrollment in system settings: the app must offer OTP rather than pretending to authenticate.
- Revoke/expire the saved session, then try fingerprint: require a new OTP. Sign out: remove both the saved token and enrollment. Signing in again with OTP requires opting into fingerprint again, preventing an account switch from inheriting another account's setting.
- On a laptop browser, fingerprint is intentionally unavailable; the native plugin's simulated browser mode is never treated as authentication. Test email and phone registration there.
- Repeat registration in AR/EN/FR and both appearance modes. Check the return to checkout after following Create account from sign-in.

**Code delivery:** the API currently uses `OTP_DRIVER=log` for local development; read the one-time code in the backend's local logs. Production SMS/email delivery still requires configured providers. Never deploy the local log driver for customer sign-ins. Physical biometric success, cancellation, lockout and background/resume must be verified on a supported Android phone after rebuilding the APK.

### Intro on every app entry

Open or reload `/home`, a product link or a checkout link: the loading logo must appear first for about 2.5 seconds, followed by the slider. Continue or Skip must then return directly to the requested page. Switch away and return to the browser tab; background and return to the rebuilt Android app; repeat the check. Navigating between tabs inside the app must remain direct. With reduced motion enabled the logo still appears, with animation disabled. Opening the native fingerprint prompt must not be mistaken for leaving the app; test success and cancellation on a physical phone.

## New individual/company shopping scenarios

Run these against the updated API after `php artisan migrate` and `php artisan optimize:clear`. Keep existing catalog data. Sign in with the configured local log OTP/provider. Repeat the main screens in Arabic/English/French, light/dark, narrow phone and desktop widths.

| Check                   | Steps                                                                                                                                | Expected result                                                                                                                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Individual billing      | Account > Buyer and billing details > Individual > Save                                                                              | No company fields required; stored company details are cleared when switching back to individual.                                                                                             |
| Company billing         | Choose Company, enter legal name and national billing address; optionally commercial/unified number and registered VAT number        | Saved to this account only; not presented as company verification.                                                                                                                            |
| Invalid company fields  | Leave required company name/address blank; use a short VAT number                                                                    | Submission is refused; optional CR is 10 digits and VAT is 15 digits beginning/ending in 3.                                                                                                   |
| Billing snapshot        | Save Company A, place order, change profile to Company B, reopen old order                                                           | Old order still shows Company A. New orders use Company B.                                                                                                                                    |
| PO reference            | Expand buyer/billing details in checkout; add purchase-order reference and place order                                               | Exact reference shown in order details; changing reference changes checkout attempt key.                                                                                                      |
| Saved products          | Sign in > product > Save product; open menu > Saved products                                                                         | Product appears once. Repeated server request does not duplicate it.                                                                                                                          |
| Remove saved            | Reopen saved product; Remove from saved; return to saved list                                                                        | Product disappears after refresh. Guest is invited to sign in.                                                                                                                                |
| Combined filters        | Search or category > Filter and sort; combine seller/category/budget/sort                                                            | Server request carries all choices; changing search text retains filters.                                                                                                                     |
| Availability filter     | Choose a delivery area then select Available                                                                                         | Only stock in active branches in that zone is included. Without area, checkbox is disabled.                                                                                                   |
| Low budget              | Choose maximum 2/3/4/5 SAR                                                                                                           | Empty results are honest: current unit price is 5.75 SAR. Clear filters restores products.                                                                                                    |
| Quotation request       | Account > Quotes and account requests > bulk quotation; specify item/quantity/city/date                                              | Submitted request appears; no discount, payment or order is fabricated.                                                                                                                       |
| Safe request retry      | Disconnect after submission, reconnect, send same unchanged request                                                                  | Same request reference is reused and only one request is created. Editing fields creates a new reference.                                                                                     |
| Request reply           | Run `php artisan customers:reply REQUEST_ID under_review "Checking availability"`                                                    | Customer sees reply/status after reopening the page.                                                                                                                                          |
| Data/closure request    | Select respective type and submit details                                                                                            | Tracked for review. Account/data is not silently deleted. Required-record retention is explained.                                                                                             |
| Payment artwork         | Open checkout in all themes/languages                                                                                                | mada, Visa, Mastercard and Apple Pay images load from local assets; no generic card/shield replaces them. Cash has a real cash photograph.                                                    |
| Cash checkout           | Choose Cash on delivery, valid address and slot, place order                                                                         | Confirmed order opens directly; payment says cash on delivery; paid date is empty, no bank page.                                                                                              |
| Double cash submission  | Tap place twice / replay same key                                                                                                    | One order, one stock deduction, one booked slot.                                                                                                                                              |
| Cash reservation expiry | Wait longer than online payment hold, run unpaid expiry task                                                                         | Confirmed cash order survives. It is not an expired online payment.                                                                                                                           |
| Cash cancellation       | Cancel cash order before preparation                                                                                                 | Stock and slot restored. No refund is invented for money never collected.                                                                                                                     |
| Cash collection         | Advance all deliveries to delivered on development server; run trusted `orders:collect-cash NUMBER AMOUNT_HALALAS RECEIPT_REFERENCE` | Exact full amount accepted after completion; paid time set. Repeating same receipt creates no second payment event. Wrong amount, premature collection and conflicting reference are refused. |
| Cash report             | View spending before and after cash collection                                                                                       | Uncollected cash is excluded from paid spending; recorded cash is included once.                                                                                                              |
| Online retry            | Start online payment, let it fail, choose another method                                                                             | Only online methods appear for that existing payment. Cash requires cancelling unpaid order and placing a new cash order.                                                                     |
| Account isolation       | Use two different accounts for billing/saved/requests/orders                                                                         | Neither account can list or change the other's records.                                                                                                                                       |

Production acceptance still requires the actual gateway, messaging, invoicing and courier/returns integrations listed in [CUSTOMER_FLOW.md](CUSTOMER_FLOW.md). Development helpers are not evidence of a real charge, cash handover or delivery.

## Individual pricing and category discovery acceptance

Pull both branches and migrate the backend. Existing prices remain 575 halalas. On a test database use `php artisan catalog:set-price PRODUCT_SLUG 100` and another at 250; keep one at 575.

1. Categories: search a category/subcategory name in Arabic or English. Only matching category cards remain; a nonsense name gives an empty state with Clear search.
2. Open Filter and sort, select a category/company and minimum 1 / maximum 3 SAR. Matching products replace category cards. Clear filters returns to browsing.
3. Try recommended/newest/rating, best selling, low-to-high and high-to-low prices. Load further cursor pages; no duplicates/skipped equal-price products. Best sellers count completed, paid units only; pending/cancelled/uncollected cash orders must not boost ranking.
4. Compare a 1 SAR and 2.50 SAR item in product/variant details, guest cart (including reload), signed-in cart, quote and placed order. Prices stay consistent and VAT is included once. Mixed quantities total correctly.
5. Quote, change that product's price, then place: require review of the changed quote. Editing a product later never rewrites an existing order's price.
6. Reject 99 / 576 / decimal halalas in the operator price command. Prices are entered as integer halalas, not riyals. Client-supplied prices are never trusted.
7. Repeat category filtering, price labels and clear/reset in AR/EN/FR and light/dark. Confirm welcome/home describe the new range/ceiling rather than one fixed price.

Earlier matrix rows B10/C13 and the old 2–8/fixed-price notes are superseded by this section. Existing seeded products remain 5.75 until explicitly repriced; do not expect the migration to assign arbitrary business prices.

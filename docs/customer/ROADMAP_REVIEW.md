# Customer roadmap review and dashboard

Reviewed against the supplied ALL575 Visual Roadmap & Mapping v2.0 (22 October 2026), pages 1, 6, 7 and 11. This is the customer scope, not completion of seller/courier/admin applications. The companion detailed specification mentioned by the PDF was not supplied. The later user choices override the original map where different: logo before slides; unit prices 1–5.75 SAR.

## Added in this update

| Customer requirement                  | Implementation                                                                                       | Acceptance                                                                                                |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| My orders dashboard (page 7)          | `/account/dashboard`, protected; entry in account and side menu                                      | Own all-time total/active/pending-online/completed counts, paid/refunded/net sums, no invented figures    |
| Active order access (page 7)          | Dashboard status cards link to filtered order history; three most recent orders                      | Complete pending online payment or open correct order details; cash confirmation is not paid              |
| Account → work area → action (page 1) | Six shopping links: browse, cart, address, checkout, track/review, support/returns                   | Existing screens open; checkout continues to validate actual cart/address/slot                            |
| Account shortcuts (pages 6–7)         | Saved products, addresses, company billing, quote/account requests and settings                      | Own counts for saved/addresses/open support/open account requests                                         |
| Order tracking filters (page 11)      | Status, literal order-number search, last 7/30 days and custom dates                                 | Combined server filtering and cursor pages remain customer-scoped                                         |
| Metric definitions and sync (page 11) | All-time label and generated timestamp, Saudi display time, refresh and foreground 30-second updates | Pending cash excluded; only succeeded refunds reduce net spending                                         |
| Personal report filters (page 7)      | Category/seller/status combined with date period, same filters on CSV                                | Whole matching orders are counted, not a misleading selected-line subtotal; category uses current catalog |
| Saudi date boundaries (page 11)       | Date boundaries converted from Saudi local day to UTC storage                                        | An order at 21:30 UTC belongs to the following Saudi day                                                  |

## Already present and connected to the dashboard

Guest catalog, category/subcategory and seller browsing, individual VAT-inclusive prices, real catalog photographs, variants/stock, saved products, guest-to-account cart merge, OTP consent flow, optional native biometric unlock, Saudi addresses with map suggestions/manual corrections, quotes/promos/slots, payment retry, cash ordering, order timeline and delivery code, product reviews, cancellation/refund statuses, line return/support requests and replies, spending/CSV, sessions/preferences and privacy-account requests. Local payment, code-delivery and delivery helpers remain simulations.

## Remaining requirements — do not mark complete

| Remaining point                                                           | What is needed                                                                                                                          |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Actual SMS/email, online gateway/wallets and notifications                | Provider accounts, merchant configuration and end-to-end sandbox/device acceptance                                                      |
| Requested Google Maps provider                                            | Appropriate project/key and provider implementation; current map is Leaflet/OpenStreetMap with server address suggestions               |
| Branch collection                                                         | Branch choice, collection capacity/pricing, collection code and operational handover                                                    |
| Live courier map/contact, dispatch, absence and rebooking                 | Courier integration, customer-safe contact and operational flows                                                                        |
| Whole-order, seller and courier reviews; reporting/replies/appeals        | Additional review models, permissions, moderation and customer screens; product reviews alone do not satisfy these                      |
| Evidence uploads, return window/category rules, collection and inspection | Secure attachments and approved return operations/policy; current text requests do not implement this process                           |
| Approved partial returns/refunds and credit notes                         | Operational approval, provider execution and compliant accounting integration                                                           |
| Tax invoices/credit-note PDF                                              | Approved issuer/ZATCA process and customer document access; order summaries are not tax invoices                                        |
| XLSX/PDF report exports and native CSV file sharing                       | Additional export generation and Android download/share handling; current CSV is browser-only with an honest native notice              |
| Channel-specific notification controls and verified email/mobile changes  | Additional preference/identity flows and configured delivery services                                                                   |
| Privacy request fulfilment and staff consoles                             | Identity verification, actual data copy/deletion with lawful retention, staff workflow; a submitted request is not completed fulfilment |
| Production policies and launch                                            | Legal operator/contacts, final provider/data arrangements, legal and operational approval, real Android UAT                             |

No unavailable function is represented by a fake button, made-up map position, successful payment or fabricated invoice. Existing valid orders, stock and buyer data are preserved.

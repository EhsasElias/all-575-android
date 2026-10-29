# Terms of Use and Privacy Policy — review notes

Draft date: 29 October 2026. Customer pages: `/legal/terms` and `/legal/privacy`, public without signing in, in AR/EN/FR with light/dark support. Source copy lives in `src/features/account/legal.en.ts`, `legal.ar.ts` and `legal.fr.ts`. The copy is original drafting for this implementation, not copied marketplace boilerplate.

## Confirm before accepting real orders

- Legal operator/controller name, commercial registration, National Address and customer/ privacy contacts; data protection officer contact if required.
- Actual sellers, delivery provider, payment/messaging processors, hosting countries, contractual responsibilities and any international-transfer safeguards.
- Retention schedule by data class, rights-request verification/response operations, security and breach handling.
- Practical cancellation, statutory return exceptions, return handling/cost allocation, refunds, warranties and complaint handling. The current support request flow is not a complete returns/refund operation.
- B2B arrangements, invoice compliance and any sector/product-specific requirements.
- Legal review/approval and consistency across the three language versions. The displayed draft notice remains until those facts are confirmed; it is not a compliance certificate.

## Consent version adoption

Set `STORE_TERMS_VERSION=2026-10-29` and `STORE_PRIVACY_VERSION=2026-10-29` in the backend environment, then `php artisan optimize:clear`. Defaults/example were updated, but existing environment values remain operator-controlled. Verify new accounts accept both current versions and returning accounts with older recorded consent receive the existing renewed-consent flow. Marketing must remain separate and optional. Publishing a draft is not proof of production approval.

## Authoritative references consulted

- Saudi E-Commerce Law, including consumer cancellation and delayed delivery: https://laws.boe.gov.sa/BoeLaws/Laws/SearchDetails/?Id=360de590-0286-4fa5-a243-aa9100c31979&Query=+
- Saudi PDPL: https://sdaia.gov.sa/en/SDAIA/about/Documents/Personal%20Data%20English%20V2-23April2023-%20Reviewed-.pdf
- SDAIA implementing regulations and data-subject rights: https://dgp.sdaia.gov.sa/
- Ministry of Commerce consumer rights: https://mc.gov.sa/Pages/cge.aspx

## Acceptance checks

Read both policies signed out in all languages/themes. Contents links jump to the correct readable heading without replaying the launch intro. Check that the backend legal version is displayed, version-request failure offers retry, and the text does not promise automated refunds/deletion, local-only hosting or actual gateway/courier integrations that are not configured. Test the published support/privacy request routes and confirm an official contact channel before launch.

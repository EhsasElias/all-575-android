---
name: fullstack-journey-qa
description: Coordinate end-to-end human-style QA across ALL 5.75 React frontend and Laravel backend repositories. Use when asked to test a full customer/seller/admin journey from browser to API to database, identify integration failures, verify OpenAPI compatibility, or trace broken requests across both projects.
---

# ALL 5.75 cross-repository end-to-end QA

Use this skill for actual FULL-STACK behavior: frontend all-575-android (v2) plus backend all-575-api (v2). Detect the backend working tree from the sibling folder, a user-given path, or repository metadata. Never assume both are mounted; report a blocker if either is unavailable. Run only against an isolated local/test API and browser, not the public production deployment.

## Setup

1. Record frontend and backend commit SHAs and environment/host names (redact secrets). Confirm frontend VITE_API_BASE_URL points to the intended isolated backend, not production; check public/config.js and stored test-device server overrides if applicable. Never overwrite a real deployment config.
2. Inspect backend docs/api/openapi.json and frontend pinned copy plus api-contract.json. Run frontend npm run api:check and npm run api:latest if available. Do NOT run npm run api:update or composer openapi as a workaround for a mismatch without an explicit user request; they change artifacts.
3. Use the repo-specific deep QA skills for each side. Establish safe seed identities/fixtures on a disposable local database; do not use personal or live data.
4. Only if a real local runtime is available, run backend with php artisan serve and frontend via Vite/Playwright; otherwise inspect integration code and label browser-to-database checks BLOCKED.

## Critical cross-stack journeys

- First launch > splash/welcome > browse/search/filter > product detail > variations > cart > update quantity.
- Sign in or OTP where configured > profile > Saudi address/map fallback > delivery slots > checkout > payment callback simulation on test backend > order history and state transitions.
- Seller application > document upload > reviewer decision > seller session/permissions > branch/product drafting > publish > inventory updates > orders > returns/refunds > settlement/finance dashboards and exports.
- Admin/super-admin roles > approve/disable actors > tracking, analytics, courier assignment and permission-limited data; attempt role changes and tenant crossover with isolated accounts.
- Real-world failures: browser refresh mid-action, two clicks, 422 validation, expired session, 409 conflict, timeout, poor network, backend 500, stale frontend caches, malformed download, CSV/Excel, Arabic/English and mobile/desktop.

For every journey build an evidence chain: browser step -> HTTP method/path/status/body -> backend route/controller/domain service -> persisted record/audit entry -> refreshed UI. Verify the same IDs, totals, VAT and stock throughout. A green frontend test with a mocked backend is NOT full-stack coverage; likewise a green PHPUnit test is NOT browser proof.

## Diagnosis and deliverable

Maintain an integration matrix: journey/role, frontend state, API endpoint, backend persistence assertion, executed outcome. Distinguish PASS, FAIL, BLOCKED, and NOT TESTED. For every confirmed defect provide FULLSTACK-BUG-ID, severity, exact repeatable clicks/requests, redacted fixture data, expected vs actual, HTTP trace and relevant source lines, classification (frontend, backend, contract, environment, unknown), recommended patch and regression tests needed in BOTH repositories. If the issue is only hypothetical, label it RISK.

Deliver one Arabic executive summary with prioritized confirmed bugs, separate technical appendix, and actionable verification commands. Do not modify source code, data or contracts without explicit authorization.

## Usage example

/fullstack-journey-qa Start from seller product creation and follow it through checkout, payment, stock, and finance using both local repos. Report every confirmed failure without changing code.

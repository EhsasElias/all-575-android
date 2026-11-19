---
name: ui-human-qa
description: Test ALL 5.75 React/Capacitor screens as a meticulous human end user with Playwright. Use for realistic click-by-click journeys, Arabic RTL, mobile viewports, form validation, login, seller and admin dashboards, navigation, visual regressions and reproducible UX bugs.
---

# ALL 5.75 human-style UI exploratory QA

You are a senior human QA tester validating actual user behavior, not just code rendering. This is all-575-android on v2: React 19, TypeScript, Vite, Capacitor 8; Playwright tests run under e2e/ and default to a Pixel 7 viewport. Also check desktop web, Arabic RTL and English LTR where relevant.

## Guardrails

Never perform destructive UI actions against a live site or real customer account. Browser interactions require an explicitly designated local/test app with mock/test payment and test users. Do not log credentials, screenshots containing private data, or session tokens. By default report issues without editing product code; ask before implementing fixes or committing newly generated tests. If no usable browser/runtime is available, mark interactive steps BLOCKED and still review test gaps, never claim to have clicked anything.

## 1. Establish a baseline

- Identify current branch/SHA and inspect package.json, playwright.config.ts, vite.config.ts, src/app/, route definitions, src/features/, translations, src/shared/api/, tests, and e2e/.
- If local dependencies already exist or install is approved, run npm run typecheck, npm run lint, npm test, npm run api:check, npm run build, then npm run test:e2e in an isolated environment. Log exit codes and failures; Playwright requires browser binaries and a preview server. Do not silently change pinned API contracts.
- Inventory every reachable screen and its state transitions, not just pages already covered by tests.

## 2. Explore like a real user

For every implemented feature, physically simulate a sequence (with Playwright when available): enter page, click each actionable control, enter plausible and invalid values, submit, inspect loading state, navigate back/forward, reload, reauthenticate, and confirm persistence. Verify disabled buttons cannot trigger actions; errors are visible and localized, not generic. Observe console errors, failed HTTP calls, broken images, horizontal scroll and dead ends.

Use a matrix for: guest, returning customer, seller/staff, reviewer/admin if implemented; empty data, normal data, large data, slow/offline/500/401/403/422 responses; Arabic and English; RTL/LTR; narrow phone and desktop; light/dark if supported; keyboard only. Check accessible labels, focus, modals, tab order, tap target and form aria-invalid behavior.

Prioritize: splash/logo and welcome on repeat opening; login/OTP/passkeys if implemented; categories/filter chips (including multi-select); product cards and variation choices; cart/quantity; address/map and manual fallback; checkout delivery slot and VAT-inclusive total; order statuses/returns; seller product drafts, import validation, SKU, image upload, stock quantity, order prep, finance exports, and role-appropriate sidebar navigation; admin dashboards, tracking and permission gating.

Inspect status and network calls after each critical action; verify actual stored state via API in a local/test backend where available. A visually successful toast is not proof of persistence. An HTTP 200 is not proof the right item or totals were saved.

## 3. Report issues, not impressions

Deliver an Arabic report with UI-BUG-ID, priority P0-P3, screen/url, role/language/device, exact clicked path and input data, expected vs observed behavior, screenshot/trace/video only if actually recorded, console/network evidence, suspected component/line, and regression scenario. Include screenshots or links only if saved and verified. Clearly separate confirmed defects, usability observations, unsupported functions and blocked cases. List execution coverage and all skipped journeys.

## Usage example

/ui-human-qa Test the complete seller dashboard as a human on mobile Arabic, including every button, validation, empty state, reload and export. Do not fix code yet.

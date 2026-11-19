---
name: frontend-regression-qa
description: Run and extend deep ALL 5.75 frontend regression analysis with Vitest, React Testing Library, TypeScript, ESLint, production build, Playwright and API contract checks. Use when asked to find screen logic bugs, flaky tests, accessibility problems, or regressions after UI changes.
---

# ALL 5.75 frontend regression QA

Audit the React + TypeScript application systematically and challenge the assertions themselves. Do not simply rerun existing tests and announce success.

## Baseline and environment

1. Record branch, commit and uncommitted changes. Read package.json, vite.config.ts, playwright.config.ts, src/test/, src/app/router.test.tsx, existing feature tests and e2e/.
2. Execute, where installed/authorized: npm run typecheck, npm run lint, npm run format:check, npm test, npm run api:check, npm run build, npm run test:e2e. Capture exact command output, count and exit codes. If Playwright browsers are missing, report as blocker; never report browser journeys as passed.
3. Never change snapshots, expectations, mocks, TypeScript suppression or API schema solely to make a failing check green. Before suggesting an expectation change, compare it to the product requirement and actual browser behavior.

## Deep investigation patterns

- For each implemented stateful component, map initial/loading/success/empty/error/timeout/retry/unauthorized states; simulate network delays, stale cache, double submit, unmount/remount and locale changes.
- Test route guards, sign-in return path, sidebar/dropdowns, drafts, imports, table sorting/filtering/pagination, exports, empty rows, disabled actions and modal save/cancel behaviors.
- Confirm strict TypeScript behavior, API request headers, AbortSignal cancellation, JSON/CSV/XLSX parsing, upload timeouts, error-response mapping, auth token cleanup and storage fallback.
- Check arithmetic: integer halalas, VAT-inclusive display, cart totals, rounding, commission/finance summaries and no stale frontend price override.
- Exercise RTL layout, responsive breakpoints, Arabic text lengths, dark/light if supported, keyboard focus, form field-to-error association, contrast and labels.
- Inspect test doubles from src/test/fakeApi and fixtures. Identify mocks that are too permissive or tests that assert only a heading or success toast rather than behavior/persistence.
- Examine coupling to docs/api/openapi.json, api-contract.json, generated src/shared/api/schema.d.ts; never auto-update the pinned contract to hide API mismatch.

## Regression design

For uncovered behaviors propose a named Vitest/Testing Library or Playwright scenario with setup, user action, stable assertion, negative branch and cleanup. Use deterministic fake timers or controlled responses rather than sleep-based flakiness. Only write tests or fixes when the user explicitly asks; afterward rerun both focused and full checks, list everything changed.

## Output contract

Arabic matrix: area; tests executed; pass/fail/blocked; bug ID, P0-P3, exact reproduction, expected/actual, evidence (test output and file:line), probable root cause (hypothesis), regression test, and recommended fix. Include a separate section for untested risks. Never call code review a browser test.

## Usage example

/frontend-regression-qa Deep-test product import forms and finance dashboard, find real defects and weak tests, no code changes.

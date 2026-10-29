# ALL 5.75 customer app

React 19 + TypeScript (strict) + Vite, wrapped by Capacitor for Android. Arabic (right-to-left, default) and English. Products cost from 1 to 5.75 SAR, VAT included. Prices are owned by the backend, per product. The backend is a separate repository: [all-575-api](https://github.com/EhsasElias/all-575-api), branch `v2`. Read `README.md` first.

## Commands

```
npm run lint            # ESLint, strict and type-aware
npm run typecheck       # tsc -b
npm run format:check    # Prettier (use `npx prettier --write <path>` to fix)
npm test                # Vitest; one folder: npx vitest run src/features/cart
npm run build           # tsc -b && vite build
npm run api:check       # the API contract copy matches api-contract.json and the backend at that commit (needs network)
npm run api:update      # take the backend's newest contract, then regenerate src/shared/api/schema.d.ts
```

Before you call a change done: format, lint, typecheck, and the tests of what you touched must pass. CI runs all of them plus the contract check, `npm audit` and a secret scan.

## The API contract

The backend owns `docs/api/openapi.json`. **Never edit `docs/api/openapi.json`, `api-contract.json` or `src/shared/api/schema.d.ts` by hand**:
run `npm run api:update`. Response and request types come from `Schemas['...']` in `@/shared/api`. If the backend changes, update the contract first, then fix what the type checker reports.

## Structure and rules (the linters enforce most of this)

- `src/app` (router, shell) -> `src/features/<name>` -> `src/shared`. `shared` never imports from `features` or `app`. A feature imports another feature only through its `index.ts`.
- Each feature owns its `routes.tsx`, `locales.ts` and tests. A screen does one job: put data fetching and rules in hooks (`useXxx.ts`), keep components presentational.
- No `as` casts, no `any`, no default exports, `type` instead of `interface`, files of at most 250 lines.
- Text only through i18next: add keys to the feature's `locales.ts` in **both** languages (`const ar: Translations<typeof en>` makes a missing key a compile error). Arabic must read naturally, not word for word.
- CSS Modules, design tokens from `src/shared/design/tokens.css`, **logical properties only** (`margin-inline-start`, never `margin-left`) so right-to-left is correct. Targets at least 44px, text at least 16px.
- Money is an **integer number of halalas** (575 = 5.75 SAR). Show it only with `formatMoney`. Never send an amount to the server; it prices everything.
- API failures: switch on `errorCode(error)` and show your own localized text. Every list needs a skeleton, an empty state with a next step, and an error state with retry.
- The sign-in token never goes into web storage (memory on the web, secure storage on Android). No secrets, tokens or personal data in logs or URLs.
- The interface must never mention planning documents, phases or roadmaps (a test checks this).

## Tests

Vitest and Testing Library. For screens use the real app: `renderApp({ route, signedIn, seenWelcome: true })` from `@/test/render`, with the server scripted by
`installFakeApi({ 'GET /products': { body: ... } })` from `@/test/fakeApi`. Assert what the customer sees and what was sent to the API; test both languages.

## Running against a backend

`VITE_API_BASE_URL=http://localhost:8000/api/v1 npm run dev`. For a phone or a static host, set the address after the build in `public/config.js`.
`VITE_TEST_PANEL=true` builds the buttons that play the payment provider on a test server; never ship that to production.
The Android test build is the manual workflow `.github/workflows/android-apk.yml`.

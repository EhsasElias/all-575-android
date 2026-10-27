# ALL 5.75 customer app

The customer app of ALL 5.75 (كل شيء بـ 5.75): a Saudi marketplace where everything costs 5.75 SAR, VAT included.
React 19 and TypeScript, built with Vite, wrapped by Capacitor for Android. Arabic (right-to-left, the default) and English.

## The two repositories

|                                       | Repository                                                                              | Branch |
| ------------------------------------- | --------------------------------------------------------------------------------------- | ------ |
| **Front end** (this repo)             | [EhsasElias/all-575-android](https://github.com/EhsasElias/all-575-android)             | `v2`   |
| **Backend**                           | [EhsasElias/all-575-api](https://github.com/EhsasElias/all-575-api)                     | `v2`   |
| Plan, roadmap and the combined source | [EhsasElias/all-575-platform](https://github.com/EhsasElias/all-575-platform) (private) | `main` |

The only thing the two share is the **API contract**, `docs/api/openapi.json`. The backend owns it. This app keeps a
copy, and [`api-contract.json`](api-contract.json) pins the exact backend commit and the SHA-256 of that copy.
The TypeScript types in `src/shared/api/schema.d.ts` are generated from it, so a backend change cannot break the app silently.

```
npm run api:check    # the copy matches the pin, and the pin matches the backend at that commit (CI runs this)
npm run api:latest   # has the backend published a newer contract?
npm run api:update   # take the backend's newest contract, then regenerate the types
```

When the backend changes its contract: run `npm run api:update`, fix what the type checker reports, commit the three changed files
(`api-contract.json`, `docs/api/openapi.json`, `src/shared/api/schema.d.ts`).

## Run it

Needs Node 22. The backend must be running (see its README: `composer setup`, `php artisan serve`).

```
npm ci
VITE_API_BASE_URL=http://localhost:8000/api/v1 npm run dev
```

| Command                                                       | What it does                                        |
| ------------------------------------------------------------- | --------------------------------------------------- |
| `npm test`                                                    | unit and screen tests (Vitest, Testing Library)     |
| `npm run lint` / `npm run typecheck` / `npm run format:check` | the quality gates CI runs                           |
| `npm run build`                                               | production build into `dist/`                       |
| `npm run test:e2e`                                            | browser tests (Playwright)                          |
| `npm run cap:sync`                                            | build and copy the web app into the Android project |

## Testing on a phone

The API address can be set after the build in `public/config.js` (`apiBaseUrl`), so one build can be pointed at any server.
A build made with `VITE_TEST_PANEL=true` shows buttons that play the payment provider on a test server; ordinary builds do not contain them.
Static hosts need the included `public/_redirects` so page links work.

### A test build with the server address typed in the app

A build made with `VITE_TEST_PANEL=true` also shows a bar at the top of every screen with the server it talks to and a **Change server** link.
The screen behind it takes an address such as `192.168.1.23:8000` (the API path is added), can check that the server answers, and saves it on the device.
That is how the Android test app is pointed at a laptop on the same Wi-Fi without building it again.
A saved address wins over `config.js` and the built-in address. A build without `VITE_TEST_PANEL` has no such screen, no bar and ignores any saved address.

For Android, run **Actions > Build Android APK > Run workflow** with the API address left empty and "test build" ticked.
A test build also allows plain `http` to a server on your network (`usesCleartextTraffic` and mixed content are off in every other build), so never give it to customers.
The backend then needs `APP_URL=http://<laptop address>:8000`, `CORS_ALLOWED_ORIGINS` containing `https://localhost` (the origin of the Android app; the test build runs from `http://localhost`, which a server with `APP_ENV=local` accepts by itself) and `php artisan serve --host=0.0.0.0`.

## Deploy on Railway

`nixpacks.toml` and `railway.json` are all Railway needs: it builds the app (`npm run build`) and serves `dist/` as a static site, sending unknown paths to `index.html`.
In a Railway project: **New > GitHub repo > this repository, branch `v2`**, open **Settings > Networking > Generate Domain**, then set these variables (they are used while building, so a change redeploys):

| Variable            | Value                                                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `VITE_API_BASE_URL` | the backend's public address plus `/api/v1`, for example `https://${{Backend.RAILWAY_PUBLIC_DOMAIN}}/api/v1` (`Backend` is the backend service's name) |
| `VITE_TEST_PANEL`   | `true` only on a test server that plays the payment provider; leave it out otherwise                                                                   |

Then add this app's address to the backend's `CORS_ALLOWED_ORIGINS`. The Android test build uses the same backend address: Actions > Build Android APK > Run workflow.

## How it is organised

```
src/app/       the shell: router, providers, tab bar
src/features/  one folder per feature (catalog, cart, auth, account, addresses, checkout, orders, welcome); features import each other only through their index file
src/shared/    API client, session, i18n, design tokens, UI kit; never imports from features or app
brand/         the exact logo and brand images
```

Rules the linters enforce: strict TypeScript with no `as` casts, no default exports, files of at most 250 lines, logical CSS properties only (so right-to-left is correct by default).
The sign-in token is never kept in web storage (memory on the web, secure storage on Android).

## Customer map and testing

See [Customer map and coverage](docs/customer/CUSTOMER_MAP.md) and the [step-by-step customer test guide](docs/customer/CUSTOMER_TEST_GUIDE.md). New support and return requests are available from an order and Account > Support and returns.

## Appearance and navigation

The header menu opens from the right in Arabic and the left in English/French. It includes the live category tree and links to existing customer pages. Language and light/dark/system appearance choices are saved on the device; system mode follows later device changes.

The first-launch sequence is the product slider, a brief logo-only introduction, then the shopping home. Reduced motion skips the animated delay. Product descriptions expand on tap so the main buying choices remain easy to scan.

The mobile browser workflow tests all six language/theme combinations and saves menu screenshots under the `mobile-ui-previews` artifact. The product and category pictures continue to come from the catalog API; this change does not replace real listings with generated products.

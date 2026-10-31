# Shared web and Android release

The same React/Vite codebase builds the customer website and the Capacitor Android app; both use the Laravel API. No Firebase secret, gateway secret or Laravel key belongs in `VITE_*`, `public/config.js`, the APK or the website bundle. Every frontend setting is public. Website desktop layout/SEO and real browser payment-provider acceptance remain separate work; this security update does not claim those are finished.

## Protections added

- JSON API requests and CSV downloads reject redirects rather than forwarding a bearer to another path. Cookies are omitted, referrers suppressed and browser request caching disabled.
- Requests stay inside the configured API prefix. Absolute/protocol-relative paths, traversal, control characters, credential-bearing addresses and configuration query/fragment values are rejected. Customer release API addresses require HTTPS. Vite development and explicitly flagged test builds retain local HTTP testing.
- Payment handoff rejects URLs containing embedded usernames/passwords as well as non-HTTPS addresses. Provider-host allowlisting must be set when the actual gateway is selected; HTTPS alone does not establish a provider's identity.
- API security headers cover success, OTP replies, errors and preflight. Authentication/personal/error responses use `no-store`. Production HTTPS API responses set HSTS. Existing OTP limits, ownership checks, server pricing and native secure storage remain in place.
- `php artisan security:check` is a read-only deployment check for unsafe production configuration. It never outputs keys and does not certify payment readiness.

## Website on market575.com

1. In the frontend directory, run `npm ci`, then build with `VITE_API_BASE_URL=https://api.market575.com/api/v1`; leave `VITE_TEST_PANEL` unset. Copy only `dist/` contents to `/var/www/market575/site`. Never serve the Git checkout, `.env`, source maps containing private data or the API repository.
2. Obtain the website's valid TLS certificate before using `deploy/nginx-site.conf.example`. Keep the API certificate/vhost separate. Preserve your Certbot-managed certificate options and renewal configuration; the example is for review, not a blind replacement of a working server.
3. Copy `deploy/nginx-security.conf` to `/etc/nginx/snippets/market575-security.conf`, adapt any approved API/image host, and include it in the website's HTTPS server. The CSP allows the current API, local assets and OpenStreetMap tiles. Current third-party image/CDN URLs require explicit approved hosts; verify actual catalog pictures before enabling. Do not weaken script protection with `unsafe-inline` or `unsafe-eval` to accommodate an unknown provider.
4. Check `sudo nginx -t` before reloading. Nginx `add_header` inheritance is all-or-nothing: if a child location declares headers, repeat/include the full security snippet there. The example intentionally keeps all headers at server level. The conservative no-store policy applies to assets too; optimize hashed-asset caching only while preserving all security headers.
5. API production `.env`: `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL=https://api.market575.com`, and `CORS_ALLOWED_ORIGINS=https://market575.com,https://localhost,capacitor://localhost`. Include `https://www.market575.com` only if that hostname is actually served. Never use wildcard origins or deploy local simulated payments to real buyers. Configure real code/payment providers before launch.
6. In the API directory run `php artisan optimize:clear`, `php artisan config:cache`, then `php artisan security:check`. Trust only your actual reverse proxy addresses; do not set `TRUSTED_PROXIES=*` on a directly internet-accessible PHP server. Use a persistent shared cache for rate limits if running multiple API instances.

These are repository changes and reviewed templates, not changes already installed on your VPS. Keep a copy of the active Nginx configuration; restore it if validation fails. No database reset or APP_KEY rotation is needed for this update.

## Acceptance checks

- `curl -I https://market575.com/` and `/account/dashboard`: confirm CSP, DENY, nosniff, no-referrer, HSTS and no-store; HTTP redirects to HTTPS. Confirm renewal with `sudo certbot renew --dry-run`.
- From a fresh browser session, test real catalog photos, AR/EN/FR, dark/light, map tiles and explicit location permission. Check the console for CSP violations. The website keeps its token only in memory; a full reload requires login again.
- Log in, open dashboard/addresses/cart/orders/CSV, sign out and use Back: no prior customer's protected details should appear. Attempt a protected API route without a token: 401 with no-store and security headers. Test a second account's order ID: refuse access.
- Existing fake-payment helpers are local tests only. Before taking real money test gateway sandbox success, decline, cancellation, timeout, webhook replay/signature rejection, retry and cash collection. API redirects are now treated as errors: fix the API base URL or server redirect rather than enabling automatic redirects.
- Test web and a real Android release separately. This repository change does not verify VPS firewall, database isolation, backups/restoration, WAF, provider credentials or production penetration resistance.

## Verification references

Dependency audit on 31 October 2026: `npm audit --omit=dev` reported no production dependency advisories; Composer audit reported no advisories or abandoned packages. The full npm audit still reports 20 moderate findings in build/development tooling (including minimatch/glob and the Capacitor CLI's UUID chain), with no high/critical findings. These are not all fixed by this change. Do not run `npm audit fix --force`: its suggested major downgrades would break the current toolchain. Review compatible upstream updates and rebuild/test separately; keep build tooling away from untrusted uploaded source/patterns.

[Fetch request redirect control](https://developer.mozilla.org/en-US/docs/Web/API/Request/redirect), [CSP frame-ancestors](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors), [Nginx header inheritance](https://nginx.org/en/docs/http/ngx_http_headers_module.html), [Laravel exception responses](https://laravel.com/framework/docs/13.x/errors).

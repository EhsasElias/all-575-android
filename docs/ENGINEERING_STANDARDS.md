# ALL-5.75 Customer App Engineering Standards

Applies to new work and refactors on the customer web and Capacitor app. Existing code must be audited before claiming full compliance.

## Design and usability
- Mobile-first layouts with accessible controls, clear empty/loading/error states and touch targets.
- Keep Arabic, English and French translations together; support RTL and LTR without duplicated layouts.
- Preserve familiar navigation and avoid surprising changes during upgrades.
- Test long text, small screens, dark mode and low-connectivity scenarios.

## Architecture and readability
- Keep visual components focused on display and interaction; put network access in dedicated API modules or hooks.
- Prefer small typed components, descriptive names, shared UI primitives, and simple state ownership.
- Never duplicate API endpoints, response parsing or authentication logic across screens.
- Use shared design tokens and scoped styles rather than inline styles for lasting UI.

## Security and reliability
- Treat all API responses and local storage as untrusted; never expose auth tokens in UI/logs.
- Validate navigation destinations and never open untrusted external URLs without checks.
- Scope customer data to the signed-in session and clear it on logout/account switches.
- Handle request failures and retries; cancel outdated requests where possible.
- Avoid unnecessary permissions and only request push notification permission when the feature is ready.

## Scalability
- Paginate long lists and avoid unnecessary re-renders or repeated fetching.
- Centralize notification API types and hooks; prepare for future Web Push without coupling UI to a provider.
- Keep frontend API contracts synchronized with the Laravel OpenAPI specification.

## Release gates
- Run `npm run build` and `npx vitest run` before deploying or regenerating the web archive.
- Run device and browser smoke tests for sign-in, cart, checkout, notifications, and RTL.
- Use versioned builds, backups, and verify deployed assets before claiming success.
- Record test results and limitations; never claim unrun tests passed.

# ALL-5.75 — Local map and address acceptance checklist

## Source of truth

Branch: `v2` in **all-575-api** and **all-575-android**.
No production deployment is made by this workflow.

The following are separate services:

- **Map display and draggable pin:** Leaflet with Geoapify raster tiles
  (optional browser-scoped key), OpenStreetMap as fallback.
- **Reverse address lookup:** Laravel `GET /api/v1/addresses/resolve`
  via Geoapify with a **server-side** key and optional Nominatim-compatible
  fallback. This suggests fields; it is not authoritative Saudi national
  address verification.
- **Delivery coverage:** Laravel zone resolution; a matching, active service
  zone is needed for checkout.
- **Persisting addresses:** Laravel `/api/v1/addresses`, which validates
  the coordinates and Saudi address fields independently of any map imagery.

## Local environment configuration

Backend `all-575-api/.env`:

```dotenv
GEOCODING_PROVIDER=geoapify
GEOAPIFY_API_KEY=YOUR_PRIVATE_SERVER_KEY
GEOCODING_REVERSE_URL=https://nominatim.openstreetmap.org/reverse
GEOCODING_FALLBACK_REVERSE_URL=
```

Frontend `all-575-android/.env.local`:

```dotenv
VITE_GEOAPIFY_MAP_KEY=YOUR_SEPARATE_BROWSER_RESTRICTED_KEY
```

Do not commit either key. Browser keys are inherently public: restrict the
frontend key to permitted origins (including localhost and production domains
as needed) and monitor quotas. The backend key must never use a `VITE_`
prefix. The free-tier quota and terms are controlled by Geoapify.

## Local run and verification

Backend:

```powershell
git checkout v2
git pull origin v2
php artisan optimize:clear
php artisan migrate
php artisan test --filter=MapAddressTest
php artisan serve --host=0.0.0.0 --port=8000
```

Frontend (separate terminal):

```powershell
git checkout v2
git pull origin v2
npm run build
npm test
npm run dev
```

Use the frontend URL configured for your LAN and ensure
`VITE_API_BASE_URL` points to your Laravel API host.

## Device acceptance scenarios

1. **Customer address:** Create a new Saudi delivery address. Use GPS, click
   on the map and drag the pin; verify the coordinates update. Check that
   Geoapify suggests the city/district/street when available.
2. **Manual fallback:** Simulate a failed or slow reverse lookup (offline
   or blocked service). Complete the Saudi address fields manually and save.
   Optional geocoding must **not** block saving the form. A valid pin and
   required fields are still necessary.
3. **Map images fail:** Block imagery in browser Network. The pin and
   coordinates must remain usable, the warning must be visible, and a
   Reload map action must be available. The Google Maps link is a free
   **external preview**, not a pin-selection or geocoding API.
4. **Coverage:** Check an address inside and outside a delivery zone.
   Outside areas may be saved if the API permits, but must not be
   checkout-ready.
5. **Checkout:** Choose the saved address, fetch delivery slots, select a
   time and verify that order confirmation only enables when the cart, slot
   and quote are valid. No real card payment required.
6. **Seller branch:** As an authorized seller owner, open
   Store and branches > Request new branch. Choose a service zone, then
   tap/drag the map pin. Verify latitude/longitude change. Submit and
   confirm the new branch stays inactive pending admin approval.
7. **Admin approval:** Sign in as a separately granted reviewer. Confirm
   that only an authorized reviewer can approve the proposed branch,
   after server validation of location/zone.

Browser DevTools > Network can distinguish tile requests
(`maps.geoapify.com`) from reverse geocoding requests
(`/api/v1/addresses/resolve`). Tile HTTP 401/403 points to key/restriction
issues, 429 to usage limits, and network failures to connectivity.

## Known external dependencies

- No third-party free public tile service offers guaranteed uptime.
- Country, street, building and postal suggestions can be incomplete.
  Manual verification of Saudi National Address fields is still required.
- Maps and geocoding need internet access; a fully offline street map is
  outside the scope of this feature.

## Seller account / branch mapping scenarios

- Sign in using the local seller test identity (configured in the backend seed).
  The seller must have an active owner membership; the identity does **not**
  grant admin review rights.
- Open **Seller workspace → Store and branches**, request a new branch and
  select an active service zone.
- Choose a location by tapping/dragging the map, using **Use my current
  location** (requires device permission), or entering coordinates manually.
- Try a pin outside the zone: the form must display a warning and refuse to
  submit. Try an inside pin: the request button becomes available if all
  required fields are completed.
- After proposing a branch, ensure it is listed as **inactive** until admin
  approval. Open its **View saved branch location** link and check the
  coordinates. Seller must not be able to activate it.
- Try branch creation as a seller staff member without owner access: the API
  must deny it. A seller owner from another store must not see this store's
  branches.
- Log in as an explicitly granted admin reviewer, check proposed branch
  location and approve. Confirm the branch becomes active and its coordinates
  remain unchanged.
- Repeat with imagery blocked: location can still be entered manually, and
  the fallback/reload message appears.

The business registration application's Saudi legal address fields are kept
separate from the **operational branch map**: they are not automatically
rewritten from a map pin. This prevents a map suggestion from silently
changing submitted legal/KYC records.

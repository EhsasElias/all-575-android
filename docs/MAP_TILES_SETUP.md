# Free map tiles configuration

The ALL-5.75 address picker uses Leaflet. The map marker, delivery-zone check
and saving coordinates do not depend on an external geocoder.

The visual **map tiles** are separate from Laravel's reverse-geocoding API.
If you see a plain background and a pin, map images did not load.

## Browser map image provider

For your existing Geoapify Free project, create an additional, browser-scoped
API key and set the following in **all-575-android/.env.local**:

```dotenv
VITE_GEOAPIFY_MAP_KEY=YOUR_BROWSER_MAP_TILES_KEY
```

In the Geoapify dashboard, limit this public key to the web origins you use,
including the production domain when deploying. Browser keys are part of the
JavaScript bundle; never treat one as a secret or reuse your private Laravel key.

The frontend will use Geoapify's `osm-carto` raster tiles for Leaflet. If
Geoapify imagery errors, it tries official OSM tiles. If neither loads, it
shows a clear error and retains the pin and link to view the coordinates in
Google Maps. Free-plan attribution is kept visible on the map.

For Laravel address suggestions, configure its **separate** server-only key:

```dotenv
GEOCODING_PROVIDER=geoapify
GEOAPIFY_API_KEY=YOUR_PRIVATE_BACKEND_KEY
```

Restart Vite after changing the frontend env:

```sh
npm run build
npm run dev
```

**Verify in browser DevTools > Network** that image requests to
`maps.geoapify.com/v1/tile/...` return 200 and image content. Check the free
quota in your Geoapify Usage & Statistics dashboard. The number of map tile
requests can be much larger than the number of address lookups.

Do not fetch all tile zoom levels, bulk-download areas or use unsupported
commercial tile servers. If every service is blocked on your network, the
image layer cannot be repaired by React alone; use another connection or a
licensed/hosted map tile provider.

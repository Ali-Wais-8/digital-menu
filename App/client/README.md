# Digital Restaurant Menu Platform

A multilingual digital menu for a confectionery store. Customers browse items via phone; the owner manages content through Strapi CMS.

## Supported Languages

- Arabic (`ar`) — default, RTL
- English (`en`) — LTR
- Kurdish Sorani (`ckb`) — RTL

RTL is applied automatically throughout the UI whenever `locale === "ar" || locale === "ckb"`, including layout direction, image placement, text alignment, and back-button arrow orientation.

---

## Architecture

| Service | Tech | Host |
|---|---|---|
| Customer frontend | Next.js 16 | Vercel (free) |
| CMS & Admin panel | Strapi | Render Starter ($7/mo) |
| Database | PostgreSQL | Supabase (free) |
| Image storage | Cloudflare R2 | Cloudflare (free) |

---

## Project Structure

```
web/
├── app/
│   ├── [locale]/
│   │   ├── layout.jsx               # Locale layout — sets dir, lang, NextIntlClientProvider
│   │   ├── page.jsx                 # Home page — fetches sections + categories, renders MenuGrid
│   │   └── category/[categoryId]/
│   │       └── page.jsx             # Category page — fetches items, renders CategoryItemsGrid
│   ├── api/
│   │   └── revalidate/
│   │       └── route.js             # Webhook endpoint — calls revalidateTag("menu")
│   └── globals.css
├── components/
│   ├── TopNavBar.jsx                # Server Component — logo, tagline, LanguageSwitcher
│   ├── LanguageSwitcher.jsx         # Client Component — locale dropdown with prefetching
│   ├── MenuGrid.jsx                 # Server Component — resolves translations, wraps MenuGridClient
│   ├── MenuGridClient.jsx           # Client Component — owns section filter state (URL-based)
│   ├── CategoryBar.jsx              # Client Component — memoized pill filter bar
│   ├── CategoryCard.jsx             # Server Component — links to category page, embeds ?from= param
│   ├── CategoryItemsGrid.jsx        # Client Component — back nav + ItemModal open/close state
│   ├── MenuCard.jsx                 # Client Component — memoized item card (desktop + mobile layouts)
│   └── ItemModal.jsx                # Client Component — lazy-loaded modal/bottom sheet
└── lib/
    └── strapi.js                    # Data layer — all Strapi REST calls, tagged "menu" for cache
```

---

## Component Architecture

The app follows Next.js's Server/Client component split strictly to minimise client-side JavaScript.

### Server Components (no JS sent to browser)
- **`TopNavBar`** — renders logo and tagline statically; only `LanguageSwitcher` is a client island inside it.
- **`MenuGrid`** — resolves `next-intl` translations server-side and passes them as strings to `MenuGridClient`.
- **`CategoryCard`** — pure `<Link>` with image; zero interactivity. Appends `?from=<sectionDocumentId>` to the href when a section filter is active so the back button on the category page can restore the correct filter.

### Client Components (interactive islands)
- **`MenuGridClient`** — owns `activeSection` state, stored in the URL as `?section=<documentId>` so it survives locale switches and page shares.
- **`CategoryBar`** — memoized pill nav; receives state from `MenuGridClient` via props.
- **`CategoryItemsGrid`** — owns `selectedItem` state for the modal. Wraps the inner implementation in a `<Suspense>` boundary required by `useSearchParams` during static generation.
- **`MenuCard`** — memoized to avoid re-renders on modal open/close. Uses `useMemo` for price formatting.
- **`ItemModal`** — lazy-loaded via `next/dynamic` with `ssr: false`; only downloaded after the first item tap. Locks body scroll and listens for Escape key via `useEffect`.
- **`LanguageSwitcher`** — prefetches all other locale routes on mount and on hover so switching locale is instant with no server round-trip.

---

## Data Layer (`lib/strapi.js`)

All Strapi calls use Next.js fetch cache tagging:

```js
fetch(url, { next: { tags: ["menu"] } })
```

This means all cached responses (sections, categories, items — across all locales) are purged in a single `revalidateTag("menu")` call when the Strapi webhook fires. Until then, pages are served from the static cache with no Strapi round-trip.

### Available functions

| Function | Description |
|---|---|
| `getSections(locale)` | All sections, sorted by `order` asc |
| `getCategories(locale)` | All categories with image and section relation |
| `getMenuItems(locale)` | All available items (`isAvailable: true`), with image and category |
| `getMenuItem(id, locale)` | Single item by `documentId` |

The data layer handles both Strapi v4 (`item.attributes`) and v5 (flat `item`) response shapes automatically.

---

## Cache Invalidation (`app/api/revalidate/route.js`)

Strapi calls this endpoint via webhook after any content change.

**Setup:**
1. Set `REVALIDATE_SECRET` in your Vercel environment variables.
2. In Strapi: **Settings → Webhooks → Add webhook**
   - URL: `https://your-site.vercel.app/api/revalidate?secret=YOUR_SECRET`
   - Events: all entry events (create, update, delete, publish, unpublish)

The endpoint validates the secret, then calls `revalidateTag("menu")` to purge all tagged fetch caches across every locale simultaneously.

---

## Navigation & Filtering

### Section filter (home page)
The active section is stored as `?section=<documentId>` in the URL via `MenuGridClient`. This means:
- Switching locale (via `LanguageSwitcher`) preserves the active filter because `LanguageSwitcher` forwards all existing query params.
- Sharing or refreshing the URL restores the correct filter.
- `documentId` is used (not the numeric `id`) because it is stable across locales in Strapi.

### Back navigation (category page)
When a user taps a `CategoryCard` while a section filter is active, the href includes `?from=<sectionDocumentId>`. On the category page, `CategoryItemsGrid` reads this param and navigates to `/<locale>?section=<from>` on back — bypassing `router.back()` so that locale switches on the category page don't corrupt the back destination.

---

## Performance Notes

- **LCP:** The first two `CategoryCard` images use `priority` / `fetchpriority="high"` since either can be the LCP element on mobile.
- **`ItemModal`:** Excluded from the initial JS bundle via `next/dynamic` + `ssr: false`. Downloaded only after the first tap.
- **`MenuCard` + `CategoryBar` pills:** Wrapped in `React.memo` to prevent re-renders on unrelated state changes (e.g. modal open/close).
- **Locale prefetching:** `LanguageSwitcher` calls `router.prefetch()` for all other locales on mount so switching is instant.
- **Static generation:** All locale and category routes are pre-rendered at build time via `generateStaticParams`. `setRequestLocale()` is called in `layout.jsx` before any `next-intl` API to keep rendering fully static and avoid breaking Vercel CDN caching.

---

## Local Development

### 1. Start the CMS (Strapi)
```bash
cd cms
cp .env.example .env   # fill in your values
npm install
npm run develop
```
Strapi admin: http://localhost:1337/admin

### 2. Start the Frontend (Next.js)
```bash
cd web
cp .env.local.example .env.local   # fill in your values
npm install
npm run dev
```
Frontend: http://localhost:3000 → redirects to http://localhost:3000/ar

---

## Deployment

### Strapi → Render
1. Push `cms/` to a Git repo.
2. Create a new **Web Service** on Render, connect the repo.
3. Set build command: `npm install && npm run build`
4. Set start command: `npm start`
5. Add all environment variables from `cms/.env.example`.

### Next.js → Vercel
1. Push `web/` to a Git repo.
2. Import the project on Vercel.
3. Add environment variables (see below).

---

## Environment Variables

### `web/.env.local`
```
NEXT_PUBLIC_STRAPI_URL=https://your-strapi.onrender.com
REVALIDATE_SECRET=your-secret-token
```

### `cms/.env`
```
DATABASE_CLIENT=postgres
DATABASE_HOST=
DATABASE_PORT=5432
DATABASE_NAME=
DATABASE_USERNAME=
DATABASE_PASSWORD=
DATABASE_SSL=true

CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET=
CLOUDFLARE_R2_ENDPOINT=https://ACCOUNT_ID.r2.cloudflarestorage.com
CLOUDFLARE_R2_PUBLIC_URL=https://pub-XXXX.r2.dev

APP_KEYS=
API_TOKEN_SALT=
ADMIN_JWT_SECRET=
TRANSFER_TOKEN_SALT=
JWT_SECRET=
```

---

## Strapi Setup After First Deploy

1. Open `/admin` and create your owner account.
2. Go to **Settings → Roles → Public**.
3. Enable `find` and `findOne` for `Category`, `MenuItem`, and `Section`.
4. Go to **Settings → Internationalization** and add: `ar`, `en`, `ckb`.
5. Set `ar` as the default locale.

---

## Content Entry Workflow

1. Create **Sections** (e.g. Sweets, Drinks) in all 3 locales, set the `order` field to control display order.
2. Create **Categories** under each section — fill name, upload image, select section, set `order`.
3. Add **Menu Items** — fill name, description, price, upload image, select category.
4. Switch locale in the Strapi content manager to add Arabic/Kurdish translations for each entry.
5. Toggle `isAvailable` to `false` to instantly hide an item from customers (takes effect on next revalidation, within ~1 minute via webhook).

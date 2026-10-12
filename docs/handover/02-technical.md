# 02 — Technical architecture

## Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 App Router, React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| Database | PostgreSQL on **Neon** via Prisma 7 (`@prisma/adapter-pg`) |
| Auth | **Clerk** (optional; required for `/admin` and `/account`) |
| Payments | **Paystack** (NGN) |
| Email | **Resend** |
| Images | **Cloudinary** (admin uploads); catalogue may use Cloudinary URLs |
| Analytics | **Vercel Analytics** (consent-gated) + optional Vercel Web Analytics API on admin dashboard |
| Deploy | **Vercel** (`cacheComponents: true` in `next.config.ts`) |

## Repository layout

```
app/
  (site)/          Public marketing and shop routes
  admin/           Staff dashboard (Clerk + requireAdmin)
  api/             Paystack webhook, email health check
  layout.tsx       Root layout, fonts, JSON-LD
components/        UI, shop, booking, admin shells
actions/           Server actions (checkout, booking, admin, contact)
lib/
  catalog.ts       Static starter catalogue (fallback when DB empty)
  data.ts          Cached reads from DB with fallback to catalog
  payments.ts      Paystack settlement, stock, emails (idempotent)
  generated/prisma Client output (do not edit)
prisma/
  schema.prisma    Data model
  seed.ts          Optional seed script
proxy.ts           Clerk middleware (exported as Next.js proxy)
public/brand/      Logo and mark assets
```

## Data model (Prisma)

Core entities:

- **Product** / **ProductCategory** / **ProductImage** — shop catalogue, stock integer (kobo not used; amounts are **integer Naira** throughout).
- **DeliveryZone** — slug, fee, ETA text.
- **Order** / **OrderItem** — `accessToken` for public order page; statuses `PENDING` → `PAID` → `PACKED` → `OUT_FOR_DELIVERY` / pickup path → `DELIVERED` or `CANCELLED`.
- **Payment** — one per order or appointment deposit; `paystackReference` unique.
- **InfusionService** — drip definition, price, deposit.
- **Appointment** — slot, `accessToken`, links to service and optional payment.
- **AvailabilityRule** / **BlockedDate** — booking slots (Africa/Lagos-oriented helpers in `lib/datetime.ts`, `lib/availability.ts`).
- **ContactMessage** — contact form submissions.
- **Testimonial** — optional homepage content.

Client generated to `lib/generated/prisma` on `prisma generate` (runs in `postinstall` and `npm run build`).

## Catalogue: database vs static fallback

`lib/data.ts` loads active products, infusions, zones, etc. from Neon when `DATABASE_URL` is valid. If the DB is missing or empty, **starter data** from `lib/catalog.ts` is shown so marketing pages still render.

**Checkout, bookings, and admin writes require Neon.** Without `DATABASE_URL`, checkout returns a clear error.

First-time DB setup:

```bash
npx prisma db push
```

Then in `/admin`, use **Load starter catalogue** (`seedCatalogue` in `actions/admin.ts`) to copy starter products, infusions, zones, and availability into Neon.

## Caching

Public catalogue reads use Next.js **Cache Components** (`"use cache"`, `cacheTag`, `cacheLife("hours")`). Admin mutations call `revalidateTag` / `revalidatePath` in `actions/admin.ts`.

Pages that use `searchParams`, session, or uncached auth set `export const instant = false` (e.g. `/account`, `/orders/[token]`, `/appointments/[token]`). `/checkout` wraps Paystack return query handling in `<Suspense>` so the shell can prerender.

## Auth and admin

- `proxy.ts`: Clerk protects `/admin(.*)`; Paystack webhook is excluded from auth.
- `lib/admin-access.ts`: admin if Clerk public metadata `role === "admin"` **or** email in `ADMIN_EMAIL` (comma-separated list allowed).
- `requireAdmin()` in `lib/admin.ts`: redirects non-admins to `/account`.

## Payments (summary)

- Initialize: `lib/paystack.ts` + server actions in `actions/checkout.ts` / `actions/booking.ts`.
- Settle: `lib/payments.ts` — webhook (`app/api/paystack/webhook/route.ts`) and browser return (`confirmPaystackReturn` on order/appointment pages). Both paths are **idempotent**.
- Stock is decremented in a transaction when an order payment first becomes **PAID**; insufficient stock aborts settlement and alerts admin.

## Server actions map

| File | Responsibility |
|------|----------------|
| `actions/checkout.ts` | Create order, Paystack init, rate limit by IP |
| `actions/booking.ts` | Slots, create/update/cancel appointment, deposit |
| `actions/admin.ts` | CRUD catalogue, orders, appointments, availability, seed |
| `actions/contact.ts` | Contact form → `ContactMessage` |

## Local development

```bash
npm install
cp .env.example .env
# fill DATABASE_URL, keys…
npx prisma db push
npm run dev
```

Useful scripts: `npm run typecheck`, `npm run lint`, `npm run db:studio`, `npm run email:test`, `npm run env:prepare-vercel` (builds `.env.production` from `.env`).

## npm install scripts

`package.json` includes `allowScripts` for Prisma, esbuild, and related postinstall binaries (npm 11+ policy). After major dependency bumps, run `npm install-scripts ls` and approve any new packages.

## Branches and deploy

- Primary integration branch in use: **`dev`**.
- Vercel builds from connected Git; production URL should match `NEXT_PUBLIC_APP_URL` (`https://www.thevitaminspotltd.com`).
- `lib/site.ts` `resolveSiteUrl()` prefers non-localhost `NEXT_PUBLIC_APP_URL`, then Vercel production URL, then preview `VERCEL_URL`.

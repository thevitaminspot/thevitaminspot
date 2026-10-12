# The Vitamin Spot

Upscale wellness lounge and shop for Abuja. Infusion bookings and a vitamin atelier.

**Owner handover (plain English):** [docs/handover/docx/The-Vitamin-Spot-Owner-Handover.docx](./docs/handover/docx/The-Vitamin-Spot-Owner-Handover.docx)

## Stack

Next.js App Router, TypeScript, Tailwind CSS, Prisma, Neon Postgres, Clerk, Cloudinary, Paystack, Resend.

## Setup

```bash
npm install
cp .env.example .env
```

Fill in:

- `DATABASE_URL` — Neon pooled Postgres connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` — use **Development** (`pk_test_` / `sk_test_`) keys locally; put **Production** (`pk_live_` / `sk_live_`) keys only on Vercel
- `NEXT_PUBLIC_APP_URL` — `http://localhost:3000` locally; `https://www.thevitaminspotltd.com` on Vercel
- `ADMIN_EMAIL` — Clerk user allowed into `/admin` (or set public metadata `role` to `admin`)
- `CLOUDINARY_URL` — product and session image uploads
- `PAYSTACK_SECRET_KEY` and `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
- `RESEND_API_KEY` and `RESEND_FROM_EMAIL` — transactional email via Resend; verify `thevitaminspotltd.com` first ([RESEND_DOMAIN.md](./RESEND_DOMAIN.md))

Then:

```bash
npx prisma db push
npm run dev
```

Open `/admin` and load the starter catalogue. That writes products, infusions, delivery zones, and hours into Neon. The public shop can still show the starter catalogue before the database is connected. Checkout, bookings, and admin saves require Neon.

## Scripts

```bash
npm run dev
npm run build
npm run typecheck
npm run lint
npm run db:seed
```

## Paystack webhook

See [PAYSTACK_WEBHOOK.md](./PAYSTACK_WEBHOOK.md). Register:

`https://www.thevitaminspotltd.com/api/paystack/webhook`

The handler verifies `x-paystack-signature`, validates amount/currency, marks the order paid, and reduces stock atomically.

## WhatsApp

Confirmation pages include a prefilled `wa.me` link. Set the lounge number in `lib/site.ts`.

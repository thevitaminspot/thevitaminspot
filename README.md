# The Vitamin Spot!

Upscale wellness lounge and shop for Maitama, Abuja. Infusion bookings and a vitamin atelier.

## Stack

Next.js App Router, TypeScript, Tailwind CSS, Framer Motion, Prisma, Supabase (Postgres, Auth, Storage), Paystack, Resend.

## Setup

```bash
npm install
cp .env.example .env
```

Fill in:

- `DATABASE_URL` — Supabase Postgres connection string
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `PAYSTACK_SECRET_KEY` and `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
- `RESEND_API_KEY`
- `ADMIN_EMAIL` — the Supabase user allowed into `/admin`

Then:

```bash
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

The public catalogue, drip menu, and home page also read from `lib/catalog.ts`, so the site can be designed and browsed before the database is connected. Bookings, checkout, and admin writes need Prisma + Paystack.

## Scripts

```bash
npm run dev
npm run build
npm run typecheck
npm run lint
npm run db:migrate
npm run db:seed
```

## Paystack webhook

Point Paystack to `/api/paystack/webhook`. The handler verifies `x-paystack-signature` with HMAC SHA512.

## WhatsApp

Confirmation pages include a prefilled `wa.me` link. Set the lounge number in `lib/site.ts`.

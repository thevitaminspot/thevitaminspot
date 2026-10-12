# 03 — Vendors, accounts, and secrets

Never commit real secrets. Use `.env` locally and Vercel Environment Variables in production. Template: `.env.example`.

## Environment variables

| Variable | Where | Purpose |
|----------|--------|---------|
| `DATABASE_URL` | Server | Neon pooled Postgres connection string |
| `NEXT_PUBLIC_APP_URL` | Public | Canonical site URL (production: `https://www.thevitaminspotltd.com`) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Public | Clerk frontend |
| `CLERK_SECRET_KEY` | Server | Clerk backend / middleware |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Public | `/login` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Public | `/sign-up` |
| `ADMIN_EMAIL` | Server | Comma-separated emails allowed into `/admin` |
| `CLOUDINARY_URL` | Server | `cloudinary://key:secret@cloud_name` for admin image upload |
| `PAYSTACK_SECRET_KEY` | Server | Webhook signature + server API |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Public | Paystack inline checkout |
| `RESEND_API_KEY` | Server | Transactional email |
| `RESEND_FROM_EMAIL` | Server | e.g. `The Vitamin Spot <hello@thevitaminspotltd.com>` |
| `VERCEL_API_TOKEN` | Server | Optional: admin dashboard site traffic (`lib/site-analytics.ts`) |
| `VERCEL_PROJECT_ID`, `VERCEL_ORG_ID` | Server | Set on Vercel automatically when linked |
| `NEXT_PUBLIC_DEVELOPER_URL` | Public | Footer credit link (optional) |

## Vendor consoles

| Service | Typical tasks |
|---------|----------------|
| **Vercel** | Deployments, env vars, domains, analytics |
| **Neon** | Database branches, connection strings, backups |
| **Clerk** | Users, production keys, admin user metadata `role: admin` |
| **Paystack** | Live/test keys, webhook URL, transaction logs |
| **Resend** | Domain verification, API keys, send logs |
| **Cloudinary** | Media library, upload preset via API URL env |
| **GitHub** | `thevitaminspot/thevitaminspot` — code and PRs |

## Go-live checklist

1. **Domain** on Vercel: `www.thevitaminspotltd.com` (and apex if used).
2. **Neon** production `DATABASE_URL` on Vercel; run migrations/`db push` against production once.
3. **Clerk** production keys (`pk_live_` / `sk_live_`); add production domain to allowed origins.
4. **Paystack** live keys; webhook → `https://www.thevitaminspotltd.com/api/paystack/webhook` (see [PAYSTACK_WEBHOOK.md](../../PAYSTACK_WEBHOOK.md)).
5. **Resend** domain verified for `thevitaminspotltd.com` (see [RESEND_DOMAIN.md](../../RESEND_DOMAIN.md)).
6. **`NEXT_PUBLIC_APP_URL`** exactly matches public HTTPS URL.
7. **`ADMIN_EMAIL`** matches the Clerk user(s) who should access `/admin`.
8. Load or verify catalogue in `/admin` (products, zones, infusions, availability).
9. Smoke test: place test order (test mode) and booking; confirm email and order page.

## Syncing env to Vercel

From a filled local `.env`:

```bash
npm run env:prepare-vercel   # writes .env.production, warns on test keys
npm run env:import-vercel  # requires Vercel CLI linked
```

Review warnings for test Clerk/Paystack keys before importing to **Production**.

## Who to contact for access

Document externally (password manager / shared vault):

- Vercel team owner
- Neon project owner
- Clerk application owner
- Paystack business account
- Resend account
- Cloudinary account
- Domain registrar DNS (for Resend + Vercel)

Developer footer credit in site config points to `NEXT_PUBLIC_DEVELOPER_URL` (default Adesanoye studio site) for original build contact.

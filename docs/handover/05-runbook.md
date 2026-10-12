# 05 — Runbook (troubleshooting)

## Build / deploy failures

| Symptom | Likely cause | Action |
|---------|----------------|--------|
| Prisma client missing | `prisma generate` not run | `npm run db:generate` or redeploy; `postinstall` runs generate |
| `/checkout` prerender error | Runtime `searchParams` | Ensure latest `dev`: Paystack redirect in `<Suspense>` on checkout page |
| npm install-script warnings | npm 11 `allowScripts` | Run `npm install-scripts ls`; approve packages; commit `allowScripts` in `package.json` |
| TypeScript errors | Drift from schema | `npx prisma generate`, `npm run typecheck` |

## Runtime: “Checkout needs the Neon database”

- `DATABASE_URL` missing or placeholder on Vercel.
- Fix env, redeploy, run `npx prisma db push` against that database if schema is new.
- Seed catalogue from `/admin`.

## Runtime: Paystack works but order stays unpaid

1. Confirm webhook URL in Paystack matches production (see [PAYSTACK_WEBHOOK.md](../../PAYSTACK_WEBHOOK.md)).
2. Confirm `PAYSTACK_SECRET_KEY` on Vercel matches the mode (test vs live) of the transaction.
3. Check Vercel function logs for `/api/paystack/webhook`.
4. Ask customer to revisit order URL with `?reference=` from Paystack email.

Webhook health (GET):

```bash
curl -s https://www.thevitaminspotltd.com/api/paystack/webhook
```

## Runtime: Emails not sending

1. Resend domain verified? ([RESEND_DOMAIN.md](../../RESEND_DOMAIN.md))
2. `RESEND_API_KEY` and `RESEND_FROM_EMAIL` on Vercel Production.
3. Hit `GET /api/health/email` on deployment (if configured) or run `npm run email:test`.
4. Check Resend dashboard for bounces/blocks.

## Runtime: Admin redirect loop or access denied

- User must be in `ADMIN_EMAIL` or have Clerk `publicMetadata.role = "admin"`.
- Clerk keys must be production keys on production domain.
- `/admin` requires sign-in via `proxy.ts` (Clerk middleware).

## Runtime: Shop shows old products

- Admin saves should revalidate cache tags. Try a small product save again.
- Hard refresh; check product `isActive` and stock in admin.

## Runtime: Booking slots empty

- Check **Admin → Availability** rules for that weekday.
- Check **Blocked dates**.
- Appointments already booked remove slots (`lib/availability.ts`).

## Safe maintenance commands

```bash
npm run typecheck
npm run lint
npm run build
npx prisma db push          # schema sync (prefer migrations if you introduce them)
npm run db:studio           # inspect data locally only
```

### Destructive (do not run on production without backup)

```bash
npm run db:wipe -- --confirm   # wipes transactional data; keeps catalog pattern per script
```

Read `prisma/wipe-keep-catalog.ts` before using.

## Logs

- **Vercel**: Project → Logs (filter `/api/paystack/webhook`, server actions).
- **Paystack**: Dashboard → Transactions / Webhooks.
- **Resend**: Logs per message.
- **Neon**: Query insights / connection errors.

## Security notes

- Order and appointment URLs are capability URLs (`accessToken`). Do not expose tokens in public channels.
- Rotate `PAYSTACK_SECRET_KEY`, `CLERK_SECRET_KEY`, `RESEND_API_KEY` if leaked.
- Webhook handler verifies `x-paystack-signature` before settlement.

## Escalation

1. Check recent deploy on Vercel and GitHub `dev` branch.
2. Reproduce on preview deployment with test Paystack keys.
3. Contact original developer via `NEXT_PUBLIC_DEVELOPER_URL` / studio site if codebase changes are needed.

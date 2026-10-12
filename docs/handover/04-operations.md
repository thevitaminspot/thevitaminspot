# 04 — Day-to-day operations (admin)

## Signing in

1. Open [https://www.thevitaminspotltd.com/admin](https://www.thevitaminspotltd.com/admin) (or your preview URL).
2. Sign in with Clerk using an email listed in `ADMIN_EMAIL`, or a user with Clerk public metadata `role: admin`.
3. Non-admins are sent to `/account`.

If you see “Admin is locked”, Clerk keys are missing on that deployment.

## First-time catalogue

1. Ensure Neon is connected (`DATABASE_URL` on Vercel).
2. Go to `/admin` → **Load starter catalogue** (if offered).
3. Review **Products**, **Infusions**, **Zones**, and **Availability**.

Edits in admin update the live site after save (cache revalidation runs automatically).

## Orders workflow

Statuses (in order of typical flow):

| Status | Meaning |
|--------|---------|
| `PENDING` | Awaiting payment |
| `PAID` | Paystack confirmed; pack stock reduced |
| `PACKED` | Ready for courier or pickup |
| `OUT_FOR_DELIVERY` | Delivery only |
| `DELIVERED` | Complete |
| `CANCELLED` | Cancelled |

**Admin → Orders** lists orders; open an order to change status and add internal notes.

Customers track via the link in their email: `/orders/[token]` (token is secret—treat emails as confidential).

### Payment issues

- Customer paid but order still pending: check Paystack dashboard for the reference; webhook may have failed. Customer can open the order link with `?reference=` from Paystack—return URL confirmation is idempotent.
- Stock oversell: settlement logs stock issues; admin may need to refund manually in Paystack and cancel the order in admin.

## Bookings workflow

| Status | Meaning |
|--------|---------|
| `PENDING` | Booked; deposit may be unpaid |
| `CONFIRMED` | Staff confirmed |
| `COMPLETED` | Session done |
| `CANCELLED` | Cancelled |

**Admin → Appointments**: confirm, cancel, or mark complete. Customers manage via `/appointments/[token]`.

**Admin → Availability**: set weekly rules and block specific dates (holidays, closures).

## Products and images

**Admin → Products**: edit copy, price (integer Naira), stock, active flag, images.

Images upload to Cloudinary via server (`lib/images.ts`); `CLOUDINARY_URL` must be set.

## Delivery zones

**Admin → Zones**: name, slug, fee, ETA text. Checkout loads active zones from DB.

## Contact messages

**Admin → Messages**: submissions from `/contact`.

## Email

- Order and booking emails use Resend from `RESEND_FROM_EMAIL`.
- Admin notifications go to addresses from `ADMIN_EMAIL` (fallback: site email in `lib/site.ts`).
- Test after DNS changes: `npm run email:test you@example.com` (with `RESEND_API_KEY` locally).

## WhatsApp

Confirmation UIs link to `wa.me` with prefilled text. Primary number is configured in `lib/site.ts` (`whatsapp`, `phone`).

## Customer support shortcuts

- Resend order link: look up order in admin, copy customer email, or use Paystack receipt reference to find the order in admin/Paystack.
- Change appointment: customer uses appointment link; staff use admin appointments.

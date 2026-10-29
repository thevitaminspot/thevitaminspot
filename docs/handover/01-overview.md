# 01 — Overview

## What this is

The Vitamin Spot is an Abuja wellness lounge and supplement shop. The site lets customers:

1. **Shop** vitamin packs (browse, cart, checkout, Paystack payment, delivery or pickup).
2. **Book IV infusion sessions** (pick drip, slot, optional deposit via Paystack).
3. **Contact** the lounge (form stored in admin).
4. **Sign in** (optional Clerk account to see past orders and bookings).

Staff use **`/admin`** (Clerk-protected) to manage products, infusions, delivery zones, availability, orders, appointments, and contact messages.

## Public routes (high level)

| Path | Purpose |
|------|---------|
| `/` | Home |
| `/shop`, `/shop/[slug]` | Product catalogue and PDP |
| `/checkout` | Guest or signed-in checkout |
| `/orders/[token]` | Order status and pay / retry (magic link token) |
| `/infusions` | Drip catalogue + booking UI |
| `/appointments/[token]` | Manage booking, pay deposit |
| `/account` | Signed-in order and booking history |
| `/contact` | Contact form |
| `/privacy` | Privacy and cookies |
| `/terms` | Terms of use |
| `/shipping` | Shipping and pickup |
| `/refunds` | Returns, refunds, booking fee |
| `/login`, `/sign-up` | Clerk auth |

## Admin routes

| Path | Purpose |
|------|---------|
| `/admin` | Dashboard (revenue, traffic, quick actions) |
| `/admin/products` | Products and images (Cloudinary upload) |
| `/admin/infusions` | IV services |
| `/admin/zones` | Delivery zones and fees |
| `/admin/orders`, `/admin/orders/[id]` | Fulfillment pipeline |
| `/admin/appointments` | Confirm / cancel bookings |
| `/admin/availability` | Weekly hours, blocked dates |
| `/admin/customers` | Customer list |
| `/admin/messages` | Contact form inbox |

## Business details (code source of truth: `lib/site.ts`)

- **Brand:** The Vitamin Spot  
- **Email:** thevitaminspotltd@gmail.com  
- **Phone / WhatsApp (primary):** +234 814 224 6407  
- **Instagram:** [@the_vitaminspot](https://instagram.com/the_vitaminspot)  
- **Address:** Theodak Plaza, Plot 1008 National Hospital Road, CBD, Abuja  
- **Currency:** NGN  

Change lounge copy, hours messaging, and map links in `lib/site.ts`. Product and drip content lives in **Neon** after the catalogue is seeded (with a static fallback in `lib/catalog.ts` when the DB is empty).

## Customer journeys

### Shop checkout

1. Customer adds items to cart (client state in `stores/cart-store.ts`, persisted in localStorage).
2. Checkout collects name, email, phone, delivery zone or pickup, address if delivery.
3. Server action `createCheckout` creates `Order` + `Payment`, opens Paystack.
4. On success: webhook and/or return URL marks payment **PAID**, decrements stock, sends emails.
5. Customer lands on `/orders/[accessToken]` with order number and status.

### Infusion booking

1. Customer picks drip on `/infusions`, chooses slot from availability rules in DB.
2. Booking creates `Appointment` (status **PENDING** until deposit paid if required).
3. Paystack deposit uses same payment pipeline with `PaymentPurpose.APPOINTMENT_DEPOSIT`.
4. Staff confirm or cancel in `/admin/appointments`; emails notify customer and admin.

### Guest vs account

Checkout and booking work **without** Clerk. If the user is signed in, orders/appointments can link to `User` via email. Clerk is optional locally if keys are omitted (providers skip Clerk; admin is locked).

## Compliance

- Cookie banner (`components/legal/cookie-consent.tsx`): essential vs analytics; Vercel Analytics loads only after “Accept all”.
- Privacy page describes cookies and Paystack.

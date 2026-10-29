# Admin guide — The Vitamin Spot

Complete reference for running the business through the website admin panel. Written for staff and owners; no coding required.

**Admin URL:** [www.thevitaminspotltd.com/admin](https://www.thevitaminspotltd.com/admin)

**Public site:** [www.thevitaminspotltd.com](https://www.thevitaminspotltd.com)

For a shorter owner summary, see [owner-guide.md](./owner-guide.md). For engineering details (webhooks, env vars), see [04-operations.md](./04-operations.md) and [PAYSTACK_WEBHOOK.md](../../PAYSTACK_WEBHOOK.md) in the repo root.

---

## Table of contents

1. [Getting in](#getting-in)
2. [How the admin is laid out](#how-the-admin-is-laid-out)
3. [Today (dashboard)](#today-dashboard)
4. [Shop: Orders](#shop-orders)
5. [Shop: Products](#shop-products)
6. [Shop: Customers](#shop-customers)
7. [Shop: Delivery zones](#shop-delivery-zones)
8. [Clinic: Bookings](#clinic-bookings)
9. [Clinic: Infusions](#clinic-infusions)
10. [Clinic: Hours & blocked dates](#clinic-hours--blocked-dates)
11. [Inbox: Messages](#inbox-messages)
12. [Paystack & payments](#paystack--payments)
13. [Emails & notifications](#emails--notifications)
14. [Customer-facing links (tracking)](#customer-facing-links-tracking)
15. [Tips, toasts, and mobile](#tips-toasts-and-mobile)
16. [Common problems](#common-problems)
17. [When to call your developer](#when-to-call-your-developer)

---

## Getting in

### Sign in

1. Open `/admin` on the live site.
2. Sign in with **Clerk** (email + password or magic link, depending on how your account was set up).
3. You must be recognised as an **admin**. That happens if either:
   - Your email is listed in the hosting environment variable `ADMIN_EMAIL` (comma-separated for multiple admins), **or**
   - Your Clerk user has public metadata `role` set to `admin`.

If you land on the normal **Account** page instead of admin, your login is not authorised — ask your developer to add your email to `ADMIN_EMAIL` or set the Clerk role.

### If admin says “locked”

The site is missing Clerk configuration on that deployment. Only your developer can fix keys on Vercel (or your host).

### If admin says database is not connected

You will see a **Neon is not connected** panel. Products, orders, bookings, and zones live in Postgres. Your developer must set `DATABASE_URL` and run database migrations. You cannot fix this from the admin UI.

### First-time empty shop

On **Today**, if there are zero products, use **Load starter catalogue** to seed sample products, infusions, and zones. Then review **Products**, **Infusions**, and **Delivery** before going live.

---

## How the admin is laid out

The left sidebar (or **Menu** on mobile) groups pages like this:

| Group | Page | Path |
|--------|------|------|
| **Overview** | **Today** | `/admin` |
| **Shop** | **Orders** | `/admin/orders` |
| **Shop** | **Products** | `/admin/products` |
| **Shop** | **Customers** | `/admin/customers` |
| **Shop** | **Delivery** | `/admin/zones` |
| **Clinic** | **Bookings** | `/admin/appointments` |
| **Clinic** | **Infusions** | `/admin/infusions` |
| **Clinic** | **Hours** | `/admin/availability` |
| **Inbox** | **Messages** | `/admin/messages` |

Footer actions:

- **View shop** — opens the public storefront.
- **Account** — Clerk profile / sign out.

All times in admin are shown in **Lagos** time unless noted otherwise.

---

## Today (dashboard)

**Purpose:** Morning check-in — revenue snapshot, work queues, and shortcuts.

### What you see

- **Banner** if bookings are waiting (status `PENDING` without staff action — see [Bookings](#clinic-bookings); note that paid online deposits usually auto-confirm).
- **Quick actions:** Orders, Bookings, Products, Messages.
- **Stats:**
  - **Open orders** — paid orders not yet delivered (status `PAID`, `PACKED`, or `OUT_FOR_DELIVERY`).
  - **Total revenue** — paid shop orders plus successful **infusion booking fees** (deposits).
  - **Bookings to accept** — count of `PENDING` appointments.
  - **Low stock alerts** — active products with **5 or fewer** units.
  - **Visitors · 7 days** — site analytics when Vercel Web Analytics is configured.

### Lists on the page

- **Orders in progress** — recent open orders; click through to **Orders**.
- **Upcoming sessions** — confirmed visits starting today onward.
- **Stock watch** — low-stock products when applicable.

Use **Today** to decide what to handle first; do the actual work on the dedicated tabs.

---

## Shop: Orders

**Purpose:** Fulfill paid shop orders (delivery in Abuja or pickup at the lounge).

### Order list

- **Tabs:** **Open** (in progress), **Fulfilled** (`DELIVERED`), **Cancelled**, **All**.
- **Search** by order number, customer name, or email.
- Each row shows fulfillment type (**DELIVERY** vs **PICKUP**), total, status, and a **next step** button when applicable.

Only orders that have **completed Paystack payment** appear in normal operations (`PAID` and beyond). Unpaid checkouts do not need packing.

### Order statuses (full flow)

| Status | Meaning for staff |
|--------|-------------------|
| `PENDING` | Created but payment not confirmed yet. Rare in admin once Paystack succeeds. |
| `PAID` | Money received; **stock has been reduced** for line items. **Pack now.** |
| `PACKED` | Packed. Delivery: ready for courier. Pickup: **ready for customer collection**. |
| `OUT_FOR_DELIVERY` | **Delivery only** — with courier or en route. |
| `DELIVERED` | Complete — delivered or picked up. |
| `CANCELLED` | Cancelled; customer is emailed. |

### Delivery vs pickup steps

The admin shows a **step bar** on the order detail page:

**Delivery:**  
`Unfulfilled (PAID)` → **Mark packed** → **Out for delivery** → **Mark delivered**

**Pickup:**  
`Unfulfilled (PAID)` → **Ready for pickup** → **Mark picked up** (skips “out for delivery”)

Labels on badges match this (e.g. “Ready for pickup”, “Picked up”).

### Completing an order (step by step)

1. Go to **Orders** → open the order (click the row or order number).
2. Check **Items in order**, delivery address or pickup, and **Courier notes** if the customer left any.
3. Use **Fulfillment** → click the primary button for the **next** step only (you cannot skip steps).
4. Contact the customer if needed via **WhatsApp**, **Call**, or **Email** on the right panel.
5. When the handoff is done, advance to **Delivered** / **Picked up**.

Each status change sends the customer an **order update email** with their tracking link.

### Cancelling an order

On the order detail page, **Cancel order** (under the main button). You must confirm in the browser dialog.

- Allowed until the order is **delivered** or already cancelled.
- Customer receives a cancellation email.
- If the order was **paid** and still at `PAID` or `PACKED`, **stock is put back** automatically (unless the order was flagged for a stock issue — see [Paystack](#paystack--payments)).

Refunds are **not** issued automatically from admin. Use **Paystack** to refund if money must be returned.

### Order detail extras

- **Customer public tracking link** — path `/orders/[token]`. You can open **Open View** to see what the customer sees. Treat tokens as private (they are in email only).
- **Payment** line — “Payment received” when Paystack marked the payment `PAID`.

### Stock issues after payment

If someone paid while stock was insufficient, the order may still show **PAID** with an internal note like *“stock ran short at settlement”*. **Do not** only cancel without calling the customer — coordinate partial shipment, substitute, or refund in Paystack.

---

## Shop: Products

**Purpose:** Manage the vitamin shop catalogue — prices, stock, photos, and visibility.

### List view

- **Tabs:** All, **Active** (visible on shop), **Hidden**, **Low stock** (≤ 5 units).
- **Search** by name, tagline, or slug.
- **+ Add product** toggles the add form at the top.

### Quick actions on each product

- **+/− stock** — adjusts count immediately (toast confirms).
- **Hide / Show** — toggles `isActive` (hidden products are not sold on the shop).
- **Edit** — opens the full editor below the list.
- **Delete** — removes if never sold; if the product was on a past order, it is **hidden** and stock zeroed instead of deleted.

### Adding or editing a product

Required and important fields:

| Field | Notes |
|--------|--------|
| **Name** | At least 2 characters. |
| **Price** | Whole **Naira** (not kobo). Must be &gt; 0. |
| **Compare at price** | Optional “was” price for sales display. |
| **Stock** | Whole number ≥ 0. Checkout blocks oversell; payment settlement also checks stock. |
| **Category** | One of the fixed shop categories (e.g. Everyday, Glow support). |
| **Tagline, description** | Shown on product page. |
| **Benefits, ingredients** | One item per line in the form; stored as lists. |
| **Usage** | How to take / use. |
| **Featured** | Highlights on the shop. |
| **Images** | **At least one** image required; **up to 4** per product. Upload goes to **Cloudinary** (handled by the site). |

Save shows a **success or error toast** (top of screen). The public shop updates after save.

### Starter image library

When editing, you may pick from a **library** of existing URLs your developer seeded — useful for quick launches.

### Low stock

**Today** and the **Low stock** tab flag products with **5 or fewer** units. Restock before marketing pushes.

---

## Shop: Customers

**Purpose:** Read-only rollup of people who **successfully paid** for at least one order.

- **Search** by name, email, or phone.
- Columns: order count, **total spent** (excludes cancelled order totals).
- There is no “edit customer” here — use **Orders** or email/WhatsApp for support.

Book-only guests **do not** appear unless they also paid for a shop order.

---

## Shop: Delivery zones

**Purpose:** Abuja delivery areas, fees, and ETA text at checkout.

### List

Each zone has:

- **Name** (shown to customers)
- **Fee** (Naira)
- **ETA** (text, e.g. “Same day”)
- **Active** — only active zones appear at checkout

### Add a zone

**+ Add delivery zone** → fill name, fee, ETA, active → save. Success/error via toast.

### Edit or deactivate

Use the zone row actions to update fee/ETA or turn a zone off without deleting history.

Checkout **subtotal + zone fee = total**; pickup orders use **PICKUP** fulfillment with no delivery fee.

---

## Clinic: Bookings

**Purpose:** Manage IV infusion appointments booked on the public **Infusions** flow.

**Path:** `/admin/appointments` (sidebar label: **Bookings**).

### How customers book (context for staff)

1. Choose infusion, date, and time slot (slots respect **Hours** and **blocked dates**).
2. Accept policy: **booking fee required online**; **cancellations are not free**; **fee is non-refundable**.
3. Pay the **booking fee** via Paystack (full session price is separate — deposit is the online fee).
4. Receive email with link to **manage appointment** (`/appointments/[token]`).

Online booking **requires** a positive **booking fee** on the infusion in admin. If fee is ₦0, the site tells guests to contact you instead.

### When payment succeeds

Paystack settlement **automatically** moves the appointment from `PENDING` to **`CONFIRMED`** when the deposit pays. You should still see it under **Upcoming** and on **Today**.

Staff **Confirm booking** is mainly for edge cases (e.g. legacy rows) where status is still `PENDING`.

### Booking list tabs

| Tab | Shows |
|-----|--------|
| **Requests** | `PENDING` |
| **Upcoming** | `CONFIRMED` (future sessions) |
| **Completed** | `COMPLETED` |
| **Cancelled** | `CANCELLED` |
| **All** | Everything |

Search by guest name, email, phone, or session name. **Overdue** appears if a confirmed session time has passed without **Mark session done**.

### Actions

| Action | When | Effect |
|--------|------|--------|
| **Confirm booking** | Status `PENDING` | Sets `CONFIRMED`; guest gets **confirmation email**. |
| **Mark session done** | Status `CONFIRMED` | Sets `COMPLETED` after the visit. |
| **Cancel** | Not completed/cancelled already | Modal → guest emailed immediately; **cannot undo** from admin. Optional internal note (for your records; cancellation reason in email is standard copy). |

**Cancellation policy:** Booking fee is **non-refundable** by site policy. Refunds, if any, are manual in Paystack.

### Deposit column

- **Paid** — Paystack deposit received.
- **Due** — deposit not paid (unusual for new online flow because checkout requires payment).
- **None** — infusion has no deposit configured.

---

## Clinic: Infusions

**Purpose:** Services shown on the booking page — names, prices, duration, booking fee, image.

### List

Tabs: **All**, **Live**, **Hidden**. Search across name and description fields.

### Add / edit infusion

| Field | Notes |
|--------|--------|
| **Name, tagline, description** | Customer-facing copy. |
| **Benefits, ingredients** | One per line. |
| **Session price** | Full price in Naira (informational for guest; settlement of remainder may be in-clinic). |
| **Booking fee** | **Required &gt; ₦0** for online self-serve booking. This is what Paystack charges online. |
| **Duration** | Minutes; minimum 15. Drives slot length on the calendar. |
| **Image** | One required image (upload/library). |

**Hide / show** controls whether new bookings can select the drip.

**Delete:** If past appointments exist, the service is **hidden** instead of deleted. With no bookings, it can be removed entirely.

---

## Clinic: Hours & blocked dates

**Path:** `/admin/availability` (sidebar: **Hours**).

### Weekly schedule

Edit each weekday: open/closed, start and end hour (24-hour lounge time), slot length, and buffer between appointments. Click **Save weekly hours**.

Sunday closed by default in the starter catalogue — tick **Open** if you want Sunday slots.

### Block / unblock a date

Use **Block date**: pick a calendar date, optional reason, **Block date**. That day has **no bookable slots** online.

The **Blocked dates** list is searchable. Use **Unblock** on a row to open that day again.

### Lead time

Customers cannot book slots starting in less than about **one hour** from “now” (system rule).

---

## Inbox: Messages

**Purpose:** Contact form submissions from the website.

Each row: date, name, email, phone, message body.

A copy is also sent by email (**Resend**) to admin addresses. Use **Messages** as the archive if email was missed.

There is no “reply in admin” — reply from your mail app or WhatsApp.

---

## Paystack & payments

**Paystack** is the payment partner for **Naira** card, bank transfer, USSD, etc. Money settles to your **Paystack business account**, not into the website.

### What uses Paystack on the site

| Flow | What is charged |
|------|------------------|
| **Shop checkout** | Order total (products + delivery fee). |
| **Infusion booking** | **Booking fee** (deposit) for the selected drip. |
| **Retry pay** | Customer can pay again from their order link if payment failed. |

### How the site knows payment worked

Two paths (both safe if they run twice):

1. **Paystack webhook** — Paystack servers call your site (`/api/paystack/webhook`) on `charge.success` / failures.
2. **Browser return** — Customer returns from Paystack to the order or appointment page; the site verifies the transaction reference.

Your developer registers the webhook URL in the Paystack dashboard (see `PAYSTACK_WEBHOOK.md`).

### After successful shop payment

- Payment record → `PAID`
- Order → `PAID`
- **Stock decreased** per line item
- Customer + admin **emails** (one batch per payment — duplicate emails are guarded in code)

### After successful booking fee

- Payment → `PAID`
- Appointment → **`CONFIRMED`** (from `PENDING`)
- Deposit confirmation emails

### What you do in Paystack (not in admin)

- View all charges and settlements
- **Refunds** and disputes
- Download receipts
- Test mode vs live mode keys (developer-managed)

**Never** share Paystack secret keys in chat or email.

### Customer says they paid but order shows unpaid

1. Ask them to open the **link from their email** again (refreshes payment state).
2. Check **Paystack dashboard** for the reference and amount.
3. If Paystack shows success but admin does not, contact your developer (webhook or env issue).

### Customer paid after you cancelled

Admin gets an **alert email** suggesting a **manual Paystack refund**. The site does not auto-refund.

---

## Emails & notifications

| Event | Who gets email |
|--------|----------------|
| New paid order | Customer confirmation + admin alert |
| Order status change | Customer update (from admin buttons) |
| Booking confirmed / cancelled | Customer |
| Booking deposit paid | Customer (+ admin booking notifications per site config) |
| Contact form | Admin (+ stored in **Messages**) |
| Payment on cancelled order/booking | Admin alert |

From address is configured by your developer (**Resend**, domain DNS). Replies often go to the business Gmail.

If emails stop globally, that is usually **Resend/DNS**, not an admin toggle.

---

## Customer-facing links (tracking)

| Type | URL pattern | Use |
|------|-------------|-----|
| Order tracking | `/orders/[accessToken]` | In order emails; shows status and pay-again if needed |
| Appointment | `/appointments/[accessToken]` | Reschedule/cancel per site rules; policy on non-refundable fee |
| Shop | `/shop`, `/checkout` | Public |

Staff should not post tokens in public social comments.

---

## Tips, toasts, and mobile

- **Toasts** (small notifications, e.g. Sonner) confirm saves, stock changes, and errors on Products, Infusions, Delivery, etc.
- **Mobile:** Use **Menu** top-left for navigation; tables paginate for long lists.
- **Image uploads** must stay within server size limits (large photos may fail — try a smaller file or ask developer).
- **Sign out** via the account control in the sidebar footer.

---

## Common problems

| Problem | What to try |
|---------|-------------|
| Cannot access `/admin` | Wrong email; need `ADMIN_EMAIL` or Clerk `admin` role |
| Product won’t save | Missing image, price, or category; read toast error |
| “Online booking not available” | Set **booking fee** &gt; ₦0 on that infusion |
| No time slots on a day | Closed weekday, **blocked date**, or slot already taken |
| Order stuck on PAID | Normal — click next fulfillment step |
| Double email to customer | Should be rare; report to developer with order id |
| Stock went negative on screen | Use **Products** stock controls; investigate Paystack note on order |
| Weekly hours wrong | Developer must change availability rules |

---

## When to call your developer

- Site or admin down for everyone
- Clerk login broken
- Paystack live keys, webhook, or refund integration
- New admin user, DNS/email (Resend), Cloudinary, database
- Legal/copy sitewide changes, new features

Technical runbooks: `docs/handover/02-technical.md`, `05-runbook.md`.

---

*Aligned with admin navigation and flows as of deployment at www.thevitaminspotltd.com.*

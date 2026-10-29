# The Vitamin Spot — website handover (for the owner)

This guide is for running the business on the website. You do not need to understand code or servers.

**Your live website:** [www.thevitaminspotltd.com](https://www.thevitaminspotltd.com)

---

## What the website does for you

1. **Shop** — Customers browse vitamin packs, add to bag, pay online, and choose delivery in Abuja or pickup at the lounge.
2. **IV bookings** — Customers pick a drip, choose a time, and can pay a deposit online.
3. **Contact form** — Messages land in your admin inbox.
4. **Optional accounts** — Customers can sign in to see past orders and bookings; guest checkout still works.

The lounge phone, WhatsApp, address, and Instagram on the site are set in the business details your developer maintains (Theodak Plaza, CBD Abuja · +234 814 224 6407 · thevitaminspotltd@gmail.com).

---

## Your admin panel (where you run the shop)

**Address to bookmark:** [www.thevitaminspotltd.com/admin](https://www.thevitaminspotltd.com/admin)

**How to sign in**

1. Open the link above.
2. Sign in with the **email address your developer set as admin** (usually the main business Gmail).
3. If you see a normal shop “account” page instead of admin, that email is not set up as admin — ask your developer to add you.

**Main areas in admin**

| Area | What you use it for |
|------|---------------------|
| **Today / home** | Quick picture of orders, bookings, and sales |
| **Orders** | Pack paid orders, mark sent or delivered |
| **Appointments** | Confirm drip bookings, cancel or complete |
| **Products** | Change prices, stock, photos, descriptions |
| **Infusions** | IV drip list, prices, deposits |
| **Zones** | Delivery areas and fees |
| **Availability** | Opening hours and days you are closed |
| **Messages** | Contact form enquiries |
| **Customers** | People who have ordered or booked |

---

## Day to day: online orders

**What happens when someone buys**

1. Customer pays with card, transfer, or USSD (through **Paystack** — your payment partner).
2. You get an email alert; the customer gets a confirmation email with a **private link** to track the order.
3. In **Admin → Orders**, the order appears once payment is confirmed.

**What you should do**

1. Open the order in admin.
2. Pack the items.
3. Update the status as you go — for example: paid → packed → out for delivery (or ready for pickup) → delivered.

Use the status labels in admin; they match where the order is in your process.

**If a customer says they paid but the order still shows unpaid**

- Ask them to open the **link from their confirmation email** again (that often fixes a slow connection).
- Check **Paystack** (your payment dashboard) to see if the money arrived.
- If money is in Paystack but the site still says unpaid, contact your developer — do not refund from the site yourself unless you know the order failed.

---

## Day to day: drip bookings

**What happens when someone books**

1. They choose a drip and time on the **Infusions** page.
2. If a deposit is required, they pay through Paystack.
3. You see the booking under **Admin → Appointments**.

**What you should do**

1. Review new bookings regularly.
2. **Confirm** when the slot is real and you are ready.
3. **Cancel** if you cannot take it (the customer should get an email).
4. Mark **complete** after the session.

**Changing hours or closing a day**

- Use **Admin → Availability** (weekly hours and blocked dates).

---

## Updating the shop (prices, stock, photos)

1. Go to **Admin → Products**.
2. Open a product, change price (in **Naira**, whole numbers), stock count, text, or photos, then save.
3. Changes show on the public shop after you save.

For new products or big catalogue changes, your developer can help the first time.

---

## Payments (Paystack)

- Customer payments go to your **Paystack business account**, not into the website itself.
- Use the Paystack app or website to see settlements, refunds, and disputes.
- **Never share** Paystack secret keys or passwords in WhatsApp or email.

### Refunds (manual — not in admin)

The website **does not refund money**. Admin can cancel an order (and may restore stock) or cancel a booking, but **Paystack still holds the charge** until you refund there.

**When to refund in Paystack**
1. Open [Paystack Dashboard → Transactions](https://dashboard.paystack.com/#/transactions).
2. Find the charge by customer email, amount, or reference from the order/booking email.
3. Open the transaction → **Refund** (full or partial) and confirm.

**Typical cases**
- Paid order cancelled before dispatch, or wrong/damaged item you agreed to refund.
- Customer paid after you already cancelled (you get an admin alert email).
- IV **booking fee** is **non-refundable** by site policy — only refund that fee if you personally decide an exception.

Keep a short note of why you refunded (WhatsApp or spreadsheet) so disputes are easy to answer.

---

## Emails customers receive

Order and booking emails are sent from your domain (for example **hello@thevitaminspotltd.com**). Replies can go to **thevitaminspotltd@gmail.com**.

If customers stop receiving mail, tell your developer — it is usually a setting on the email service (Resend), not something you fix in admin.

---

## WhatsApp

The site offers WhatsApp links with a pre-filled message. The number used is your main lounge WhatsApp (+234 814 224 6407). To change it, ask your developer.

---

## Accounts you should have (or know who has)

| Service | Why it matters |
|---------|----------------|
| **Admin login email** | Access to /admin |
| **Paystack** | See all card and transfer payments |
| **Business Gmail** | thevitaminspotltd@gmail.com — alerts and replies |
| **Domain / website hosting** | Often managed by your developer on Vercel |
| **Instagram** | @the_vitaminspot — separate from the website |

Keep passwords in a safe place (password manager), not in a shared notes app.

---

## When to call your developer

- Website will not load at all.
- Admin login stopped working for everyone.
- Payments work in Paystack but never show as paid on the site.
- You need a new admin user, new payment keys for “going live”, or legal/copy changes across the site.

**Developer contact (site footer):** [studio.adesanoye.online](https://studio.adesanoye.online) — or whoever maintains the project for you now.

---

## What you should not need to do

- Edit code or use GitHub.
- Change secret keys in hosting unless your developer guides you.
- Run commands in a terminal.

Your developer keeps the technical handover (hosting, database, backups) in separate notes for IT help.

---

*Last updated with the website as deployed at www.thevitaminspotltd.com.*

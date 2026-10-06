# Paystack webhook

## Production URL

Register this in Paystack Dashboard → **Settings** → **API Keys & Webhooks**:

```
https://www.thevitaminspotltd.com/api/paystack/webhook
```

Use **Live** mode keys on Vercel when going live. Test keys only work with test payments.

## What it does

1. Paystack POSTs `charge.success` or `charge.failed` after payment
2. We verify `x-paystack-signature` (HMAC SHA512 with `PAYSTACK_SECRET_KEY`)
3. We match `reference`, `amount`, and `currency` against the stored payment
4. Order is marked **PAID**, stock is decremented, confirmation emails send

The customer return URL (`/orders/[token]?reference=…`) also confirms payment if the webhook is delayed — both paths are idempotent.

## Environment (Vercel Production)

```env
PAYSTACK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_...
NEXT_PUBLIC_APP_URL=https://www.thevitaminspotltd.com
```

## Test the endpoint

```bash
curl https://www.thevitaminspotltd.com/api/paystack/webhook
```

Should return `{ "ok": true, ... }`.

In Paystack Dashboard, use **Send test webhook** on a successful charge after a test order.

## Local development

Paystack cannot reach `localhost`. Options:

- Deploy to Vercel preview and point test webhook there, or
- Rely on the return URL (`confirmPaystackReturn` on the order page) during local checkout tests

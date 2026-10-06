# Resend domain setup — The Vitamin Spot

Your API key can **send email only**. Add the domain in the Resend dashboard (one time).

## 1. Add domain

1. Open [resend.com/domains](https://resend.com/domains)
2. **Add domain** → `thevitaminspotltd.com`
3. Copy the DNS records Resend shows (DKIM, SPF/MX on `send`, etc.)

## 2. Add DNS at your registrar

Where you bought `thevitaminspotltd.com` (GoDaddy, Namecheap, Cloudflare, etc.), add **every record** Resend lists. Typical set:

| Type | Name / Host | Value |
|------|-------------|--------|
| TXT | `send` | SPF value from Resend |
| MX | `send` | `feedback-smtp.us-east-1.amazonses.com` (priority 10) |
| CNAME | `*. _domainkey` rows | DKIM targets from Resend |

Use **exact** names Resend gives you — they differ per account.

## 3. Verify

In Resend → Domains → **Verify**. Status should become **Verified** (often 5–30 minutes after DNS propagates).

## 4. Environment variables

Already set locally in `.env`:

```env
RESEND_FROM_EMAIL="The Vitamin Spot <hello@thevitaminspotltd.com>"
```

Add the same on **Vercel → Settings → Environment Variables** (Production):

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `ADMIN_EMAIL=thevitaminspotltd@gmail.com`

## 5. Test

After verification, run:

```bash
npm run email:test
```

Or place a test order — the customer should receive mail from `hello@thevitaminspotltd.com`. Replies go to `thevitaminspotltd@gmail.com`.

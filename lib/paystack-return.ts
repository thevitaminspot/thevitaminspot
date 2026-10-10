import { site } from "@/lib/site";

/** Path-only callbacks so Paystack can append ?reference= without dropping our token. */
export function orderPaystackReturnUrl(token: string) {
  return `${site.url}/orders/${encodeURIComponent(token)}`;
}

export function appointmentPaystackReturnUrl(token: string) {
  return `${site.url}/appointments/${encodeURIComponent(token)}`;
}

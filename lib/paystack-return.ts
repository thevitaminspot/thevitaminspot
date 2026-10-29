import { site } from "@/lib/site";

/** Path-only callbacks so Paystack can append ?reference= without dropping our token. */
export function orderReturnPath(token: string) {
  return `/orders/${encodeURIComponent(token)}`;
}

export function appointmentReturnPath(token: string) {
  return `/appointments/${encodeURIComponent(token)}`;
}

export function orderPaystackReturnUrl(token: string) {
  return `${site.url}${orderReturnPath(token)}`;
}

export function appointmentPaystackReturnUrl(token: string) {
  return `${site.url}${appointmentReturnPath(token)}`;
}

export function withPaymentCancelled(absoluteUrl: string) {
  const url = new URL(absoluteUrl);
  url.searchParams.set("payment", "cancelled");
  return url.toString();
}

const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

export function formatNaira(kobo: number) {
  return naira.format(Math.round(kobo / 100));
}

export function nairaLabel(kobo: number) {
  const amount = Math.round(kobo / 100).toString();
  return `₦${amount.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

export function nairaToKobo(nairaAmount: number) {
  return Math.round(nairaAmount * 100);
}

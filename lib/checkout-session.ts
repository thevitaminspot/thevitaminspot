const KEY = "tvs-open-checkout";

export type SavedCheckout = {
  token: string;
  fingerprint: string;
};

export function checkoutFingerprint(input: {
  items: { productId: string; quantity: number; price: number }[];
  name: string;
  email: string;
  phone: string;
  fulfillment: string;
  zoneSlug?: string;
  address?: string;
  notes?: string;
}) {
  return JSON.stringify({
    items: input.items.map((item) => [item.productId, item.quantity, item.price]),
    name: input.name.trim().toLowerCase(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    fulfillment: input.fulfillment,
    zoneSlug: input.zoneSlug ?? "",
    address: (input.address ?? "").trim().toLowerCase(),
    notes: (input.notes ?? "").trim(),
  });
}

export function readSavedCheckout(): SavedCheckout | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedCheckout;
    if (!parsed.token || !parsed.fingerprint) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveCheckout(value: SavedCheckout) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    /* private mode */
  }
}

export function clearSavedCheckout() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* private mode */
  }
}

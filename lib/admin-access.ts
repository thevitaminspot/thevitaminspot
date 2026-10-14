type SessionClaims = Record<string, unknown> | null | undefined;

import { site } from "@/lib/site";

export function adminEmails() {
  return (process.env.ADMIN_EMAIL ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function adminRecipients() {
  const emails = adminEmails();
  return emails.length > 0 ? emails : [site.email];
}

/** Avoid duplicate inbox when a customer email is also listed in ADMIN_EMAIL. */
export function adminRecipientsExcluding(...emails: string[]) {
  const exclude = new Set(
    emails.map((email) => email.trim().toLowerCase()).filter(Boolean),
  );
  const seen = new Set<string>();
  return adminRecipients().filter((email) => {
    const key = email.toLowerCase();
    if (exclude.has(key) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function isAdminSession(sessionClaims: SessionClaims) {
  if (!sessionClaims) return false;

  const metadata = sessionClaims.metadata;
  if (
    typeof metadata === "object" &&
    metadata !== null &&
    "role" in metadata &&
    metadata.role === "admin"
  ) {
    return true;
  }

  const email =
    typeof sessionClaims.email === "string" ? sessionClaims.email.toLowerCase() : "";
  return Boolean(email && adminEmails().includes(email));
}

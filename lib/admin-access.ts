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

import { randomBytes } from "node:crypto";

export function createToken() {
  return randomBytes(24).toString("hex");
}

export function createOrderNumber() {
  const stamp = Date.now().toString(36).toUpperCase();
  const salt = randomBytes(2).toString("hex").toUpperCase();
  return `TVS-${stamp}-${salt}`;
}

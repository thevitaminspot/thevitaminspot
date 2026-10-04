import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  infusions,
  products,
  type CatalogInfusion,
  type CatalogProduct,
} from "@/lib/catalog";

export type LocalAppointment = {
  id: string;
  accessToken: string;
  startsAt: string;
  endsAt: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  serviceName: string;
  serviceSlug: string;
};

type Store = {
  products?: CatalogProduct[];
  infusions?: CatalogInfusion[];
  appointments?: LocalAppointment[];
  notes?: string[];
};

const file = path.join(process.cwd(), "data", "local-store.json");

async function readStore(): Promise<Store> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as Store;
  } catch {
    return {};
  }
}

async function writeStore(store: Store) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(store, null, 2));
}

export async function readLocalProducts() {
  const store = await readStore();
  return store.products ?? null;
}

export async function readLocalInfusions() {
  const store = await readStore();
  return store.infusions ?? null;
}

export async function readLocalAppointments() {
  const store = await readStore();
  return store.appointments ?? [];
}

export async function withProducts(
  change: (rows: CatalogProduct[]) => CatalogProduct[] | { error: string },
) {
  const store = await readStore();
  const rows = structuredClone(store.products ?? products);
  const next = change(rows);
  if (!Array.isArray(next)) return next;
  store.products = next;
  await writeStore(store);
  return { ok: true as const };
}

export async function withInfusions(
  change: (rows: CatalogInfusion[]) => CatalogInfusion[] | { error: string },
) {
  const store = await readStore();
  const rows = structuredClone(store.infusions ?? infusions);
  const next = change(rows);
  if (!Array.isArray(next)) return next;
  store.infusions = next;
  await writeStore(store);
  return { ok: true as const };
}

export async function saveNoteEmail(email: string) {
  const store = await readStore();
  const notes = store.notes ?? [];
  if (!notes.includes(email)) notes.push(email);
  store.notes = notes;
  await writeStore(store);
}

export async function saveLocalAppointment(appointment: LocalAppointment) {
  const store = await readStore();
  store.appointments = [...(store.appointments ?? []), appointment];
  await writeStore(store);
}

export async function updateLocalAppointment(
  id: string,
  patch: Partial<Pick<LocalAppointment, "status" | "startsAt" | "endsAt">>,
) {
  const store = await readStore();
  const rows = store.appointments ?? [];
  const index = rows.findIndex((row) => row.id === id || row.accessToken === id);
  if (index < 0) return null;
  rows[index] = { ...rows[index], ...patch };
  store.appointments = rows;
  await writeStore(store);
  return rows[index];
}

export async function findLocalAppointment(token: string) {
  const rows = await readLocalAppointments();
  return rows.find((row) => row.accessToken === token) ?? null;
}

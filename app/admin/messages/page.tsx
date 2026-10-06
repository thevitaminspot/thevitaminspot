import { DatabaseSetup } from "@/components/admin/setup";
import { requireAdmin } from "@/lib/admin";
import { tryPrisma } from "@/lib/db";

export const metadata = { title: "Messages" };

export default async function AdminMessagesPage() {
  await requireAdmin();
  const prisma = await tryPrisma();
  if (!prisma) return <DatabaseSetup />;

  const rows = await prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div>
      <h1 className="font-display text-4xl">Messages</h1>
      <p className="mt-2 text-sm text-deep/60">Notes from the contact form and the mailing list. Copies also go out through Resend.</p>
      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-deep/60">No messages yet.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((row) => (
            <li key={row.id} className="rounded-lg border border-deep/10 bg-white px-4 py-4">
              <p className="text-sm text-deep/50">
                {row.createdAt.toLocaleString("en-NG")} · {row.name} · {row.email}
                {row.phone ? ` · ${row.phone}` : ""}
              </p>
              <p className="mt-2 text-sm leading-7">{row.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

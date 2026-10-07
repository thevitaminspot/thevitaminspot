import { DatabaseSetup } from "@/components/admin/setup";
import {
  AdminEmptyState,
  AdminMessageCard,
  AdminPageHeader,
} from "@/components/admin/ui";
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
      <AdminPageHeader
        eyebrow="Inbox"
        title="Messages"
        description="Notes from the contact form and mailing list. Copies also go out through Resend."
      />

      {rows.length === 0 ? (
        <AdminEmptyState>No messages yet.</AdminEmptyState>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.id}>
              <AdminMessageCard
                meta={`${row.createdAt.toLocaleString("en-NG")} · ${row.name} · ${row.email}${
                  row.phone ? ` · ${row.phone}` : ""
                }`}
              >
                {row.message}
              </AdminMessageCard>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

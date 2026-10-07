import { AdminMessageList } from "@/components/admin/message-list";
import { DatabaseSetup } from "@/components/admin/setup";
import { AdminPageHeader } from "@/components/admin/ui";
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

      <AdminMessageList
        rows={rows.map((row) => ({
          id: row.id,
          createdAt: row.createdAt.toISOString(),
          name: row.name,
          email: row.email,
          phone: row.phone,
          message: row.message,
        }))}
      />
    </div>
  );
}

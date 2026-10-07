import { AdminBlockedDatesList } from "@/components/admin/blocked-dates-list";
import { BlockDateForm } from "@/components/admin/block-date-form";
import { DatabaseSetup } from "@/components/admin/setup";
import {
  AdminPageHeader,
  AdminSection,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeaderCell,
  AdminTableRow,
  AdminTableWrap,
} from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin";
import { getRules } from "@/lib/availability";
import { tryPrisma } from "@/lib/db";

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function AdminAvailabilityPage() {
  await requireAdmin();
  const prisma = await tryPrisma();
  if (!prisma) return <DatabaseSetup />;
  const rules = await getRules();
  const blocked = await prisma.blockedDate.findMany({ orderBy: { date: "asc" } });

  return (
    <div>
      <AdminPageHeader
        eyebrow="Clinic"
        title="Hours"
        description="Weekly chair availability and dates blocked from online booking."
      />

      <AdminSection title="Weekly schedule">
        <AdminTableWrap>
          <table className="w-full text-left text-sm">
            <AdminTableHead>
              <tr>
                <AdminTableHeaderCell>Day</AdminTableHeaderCell>
                <AdminTableHeaderCell>Hours</AdminTableHeaderCell>
                <AdminTableHeaderCell>Slots</AdminTableHeaderCell>
              </tr>
            </AdminTableHead>
            <tbody>
              {rules.map((rule) => (
                <AdminTableRow key={`${rule.weekday}-${rule.startMin}`}>
                  <AdminTableCell className="font-medium">{days[rule.weekday]}</AdminTableCell>
                  <AdminTableCell>
                    {Math.floor(rule.startMin / 60)}:00–{Math.floor(rule.endMin / 60)}:00
                  </AdminTableCell>
                  <AdminTableCell className="text-deep/60">
                    {rule.slotMin} min · {rule.bufferMin} min buffer
                  </AdminTableCell>
                </AdminTableRow>
              ))}
            </tbody>
          </table>
        </AdminTableWrap>
      </AdminSection>

      <div className="mt-10">
        <BlockDateForm />
      </div>

      <AdminSection title="Blocked dates" className="mt-10">
        <AdminBlockedDatesList
          rows={blocked.map((row) => ({
            id: row.id,
            date: row.date.toISOString(),
            reason: row.reason,
          }))}
        />
      </AdminSection>
    </div>
  );
}

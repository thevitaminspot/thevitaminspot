import { AdminBlockedDatesList } from "@/components/admin/blocked-dates-list";
import { BlockDateForm } from "@/components/admin/block-date-form";
import { DatabaseSetup } from "@/components/admin/setup";
import { WeeklyHoursForm } from "@/components/admin/weekly-hours-form";
import { AdminPageHeader, AdminSection } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin";
import { getRules } from "@/lib/availability";
import { tryPrisma } from "@/lib/db";

export const instant = false;

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
        description="Edit weekly chair hours and block or unblock dates for online booking."
      />

      <AdminSection title="Weekly schedule">
        <WeeklyHoursForm
          initialRules={rules.map((rule) => ({
            weekday: rule.weekday,
            startMin: rule.startMin,
            endMin: rule.endMin,
            slotMin: rule.slotMin,
            bufferMin: rule.bufferMin,
          }))}
        />
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

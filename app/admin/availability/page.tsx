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
  const [rules, blocked] = await Promise.all([
    getRules(),
    prisma.blockedDate.findMany({ orderBy: { date: "asc" } }),
  ]);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Clinic"
        title="Hours"
        description="Set open days and lounge hours for online booking, then block any closed dates."
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

      <AdminSection title="Blocked dates" className="mt-10">
        <div className="space-y-6">
          <BlockDateForm />
          <AdminBlockedDatesList
            rows={blocked.map((row) => ({
              id: row.id,
              date: row.date.toISOString(),
              reason: row.reason,
            }))}
          />
        </div>
      </AdminSection>
    </div>
  );
}

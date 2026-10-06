import { BlockDateForm } from "@/components/admin/block-date-form";
import { DatabaseSetup } from "@/components/admin/setup";
import { requireAdmin } from "@/lib/admin";
import { getRules } from "@/lib/availability";
import { tryPrisma } from "@/lib/db";

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function AdminAvailabilityPage() {
  await requireAdmin();
  const prisma = await tryPrisma();
  if (!prisma) return <DatabaseSetup />;
  const rules = await getRules();
  const blocked = await prisma.blockedDate.findMany();

  return (
    <div>
      <h1 className="font-display text-4xl">Hours</h1>
      <ul className="mt-6 divide-y divide-deep/10 overflow-hidden rounded-lg border border-deep/10 bg-white text-sm">
        {rules.map((rule) => (
          <li key={`${rule.weekday}-${rule.startMin}`} className="px-4 py-3">
            {days[rule.weekday]} · {Math.floor(rule.startMin / 60)}:00–
            {Math.floor(rule.endMin / 60)}:00 · {rule.slotMin} min + {rule.bufferMin} min buffer
          </li>
        ))}
      </ul>
      <BlockDateForm />
      <h2 className="mt-10 font-display text-3xl">Blocked dates</h2>
      <ul className="mt-3 text-sm text-deep/70">
        {blocked.map((row) => (
          <li key={row.id}>{row.date.toDateString()}</li>
        ))}
        {blocked.length === 0 ? <li>None.</li> : null}
      </ul>
    </div>
  );
}

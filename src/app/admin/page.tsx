import { Equipment } from "@/db/models/equipment";
import { Transaction } from "@/db/models/transaction";
import { requireAdminUser } from "@/lib/auth/current-user";

export default async function AdminDashboardPage() {
  const user = await requireAdminUser();

  const labId = typeof user.assignedLab === "object" && user.assignedLab !== null
    ? (user.assignedLab as { _id: string })._id
    : null;

  const labName = typeof user.assignedLab === "object" && user.assignedLab !== null
    ? (user.assignedLab as { name: string }).name
    : "Unassigned";

  const [
    totalEquipment,
    activeEquipment,
    pendingBorrows,
    pendingReturns,
    activeBorrows,
    completedReturns,
  ] = await Promise.all([
    Equipment.countDocuments({ lab: labId, isDeleted: false }),
    Equipment.countDocuments({ lab: labId, isDeleted: false, isActive: true }),
    Transaction.countDocuments({ lab: labId, status: "requested" }),
    Transaction.countDocuments({ lab: labId, status: "returning" }),
    Transaction.countDocuments({ lab: labId, status: "accepted" }),
    Transaction.countDocuments({ lab: labId, status: "completed" }),
  ]);

  const stats = [
    { label: "Total Equipment", value: totalEquipment, tone: "text-[#022742]" },
    { label: "Active Equipment", value: activeEquipment, tone: "text-emerald-600" },
    { label: "Pending Borrow Requests", value: pendingBorrows, tone: "text-amber-600" },
    { label: "Pending Return Requests", value: pendingReturns, tone: "text-violet-600" },
    { label: "Active Borrows", value: activeBorrows, tone: "text-blue-600" },
    { label: "Completed Returns", value: completedReturns, tone: "text-slate-600" },
  ];

  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#319f9a]">
          Lab Admin Workspace
        </p>
        <div className="mt-3 flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-[#1f2933]">Dashboard</h1>
            <p className="mt-2 text-sm text-slate-600">
              Managing <span className="font-semibold text-[#022742]">{labName}</span>
            </p>
          </div>
          <div className="rounded-md bg-[#e8edf4] px-3 py-2 text-sm font-semibold text-[#1e3a5f]">
            Signed in as {user.email}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <article key={stat.label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <p className={`mt-3 text-3xl font-semibold ${stat.tone}`}>{stat.value}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
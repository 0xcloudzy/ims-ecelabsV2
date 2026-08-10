import { Lab } from "@/db/models/lab";
import { Transaction } from "@/db/models/transaction";
import { requireStudentUser } from "@/lib/auth/current-user";

const statCards = [
  { label: "Currently Equipped", valueKey: "borrowed", tone: "text-[#022742]" },
  { label: "Waiting Approval", valueKey: "pending", tone: "text-amber-600" },
  { label: "Return Requested", valueKey: "returning", tone: "text-violet-600" },
  { label: "Returned Items", valueKey: "completed", tone: "text-emerald-600" },
] as const;

type DashboardTransaction = {
  _id: string;
  quantity: number;
  status: string;
  requestedAt: Date;
  dueDate: Date;
  returnedAt?: Date;
  equipment?: {
    name: string;
  };
  lab?: {
    name: string;
    code: string;
  };
};

function formatDate(date?: Date) {
  if (!date) {
    return "-";
  }

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    requested: "border-amber-200 bg-amber-50 text-amber-700",
    approved_for_pickup: "border-blue-200 bg-blue-50 text-blue-700",
    issued: "border-emerald-200 bg-emerald-50 text-emerald-700",
    return_requested: "border-violet-200 bg-violet-50 text-violet-700",
    approved_for_dropoff: "border-blue-200 bg-blue-50 text-blue-700",
    completed: "border-slate-200 bg-slate-50 text-slate-700",
    declined: "border-red-200 bg-red-50 text-red-700",
    cancelled: "border-slate-200 bg-slate-100 text-slate-600",
  };

  const label: Record<string, string> = {
    requested: "Waiting for Approval",
    approved_for_pickup: "Waiting for Pickup",
    issued: "Equipped",
    return_requested: "Return Requested",
    approved_for_dropoff: "Waiting for Dropoff",
    completed: "Returned",
    declined: "Declined",
    cancelled: "Cancelled",
  };

  return (
    <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${styles[status] ?? styles.completed}`}>
      {label[status] ?? status}
    </span>
  );
}

export default async function StudentPage() {
  const user = await requireStudentUser();

  const [borrowed, pending, returning, completed, activeTransactions, returnedTransactions] = await Promise.all([
    Transaction.countDocuments({ student: user._id, status: "issued" }),
    Transaction.countDocuments({ student: user._id, status: { $in: ["requested", "approved_for_pickup"] } }),
    Transaction.countDocuments({ student: user._id, status: { $in: ["return_requested", "approved_for_dropoff"] } }),
    Transaction.countDocuments({ student: user._id, status: "completed" }),
    Transaction.find({ student: user._id, status: { $in: ["requested", "approved_for_pickup", "issued", "return_requested", "approved_for_dropoff"] } })
      .populate("equipment", "name")
      .populate({ path: "lab", model: Lab, select: "name code" })
      .sort({ requestedAt: -1 })
      .limit(8)
      .lean<DashboardTransaction[]>(),
    Transaction.find({ student: user._id, status: "completed" })
      .populate("equipment", "name")
      .populate({ path: "lab", model: Lab, select: "name code" })
      .sort({ returnedAt: -1, updatedAt: -1 })
      .limit(8)
      .lean<DashboardTransaction[]>(),
  ]);

  const stats = { borrowed, pending, returning, completed };

  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#319f9a]">
          Student Workspace
        </p>
        <div className="mt-3 flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-[#1f2933]">Dashboard</h1>
            <p className="mt-2 text-sm text-slate-600">Signed in as {user.email}</p>
          </div>
          <div className="rounded-md bg-[#e8edf4] px-3 py-2 text-sm font-semibold text-[#1e3a5f]">
            {user.studentProfile?.department?.toUpperCase()} / {user.studentProfile?.programme?.toUpperCase()}
          </div>
        </div>
      </div>

      {user.studentProfile?.duesClearance?.isCleared && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-semibold text-emerald-800">No Dues Clearance Granted</h3>
              <p className="mt-1 text-sm text-emerald-700">
                You have been cleared by an admin on {formatDate(user.studentProfile.duesClearance.clearedAt)}. You can no longer request equipment.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <article key={card.valueKey} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{card.label}</p>
            <p className={`mt-3 text-3xl font-semibold ${card.tone}`}>{stats[card.valueKey]}</p>
          </article>
        ))}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-xl font-semibold text-[#022742]">Active Requests</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-[#022742] text-white">
              <tr>
                <th className="px-4 py-3 font-semibold">S.No</th>
                <th className="px-4 py-3 font-semibold">Equipment Name</th>
                <th className="px-4 py-3 font-semibold">Lab</th>
                <th className="px-4 py-3 font-semibold">Quantity</th>
                <th className="px-4 py-3 font-semibold">Last Date of Return</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                    No active requests or equipped items.
                  </td>
                </tr>
              ) : (
                activeTransactions.map((transaction, index) => (
                  <tr key={transaction._id} className="hover:bg-slate-50">
                    <td className="px-4 py-4 text-slate-600">{index + 1}</td>
                    <td className="px-4 py-4 font-medium text-slate-900">
                      {transaction.equipment?.name ?? "Equipment removed"}
                    </td>
                    <td className="px-4 py-4 text-slate-600">{transaction.lab?.code ?? "-"}</td>
                    <td className="px-4 py-4 text-slate-600">{transaction.quantity}</td>
                    <td className="px-4 py-4 text-slate-600">
                      {transaction.dueDate ? formatDate(transaction.dueDate) : "TBD"}
                    </td>
                    <td className="px-4 py-4"><StatusBadge status={transaction.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-xl font-semibold text-[#319f9a]">Returned Items</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-[#022742] text-white">
              <tr>
                <th className="px-4 py-3 font-semibold">S.No</th>
                <th className="px-4 py-3 font-semibold">Equipment Name</th>
                <th className="px-4 py-3 font-semibold">Quantity</th>
                <th className="px-4 py-3 font-semibold">Lab</th>
                <th className="px-4 py-3 font-semibold">Returned On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {returnedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                    No returned items yet.
                  </td>
                </tr>
              ) : (
                returnedTransactions.map((transaction, index) => (
                  <tr key={transaction._id} className="hover:bg-slate-50">
                    <td className="px-4 py-4 text-slate-600">{index + 1}</td>
                    <td className="px-4 py-4 font-medium text-slate-900">
                      {transaction.equipment?.name ?? "Equipment removed"}
                    </td>
                    <td className="px-4 py-4 text-slate-600">{transaction.quantity}</td>
                    <td className="px-4 py-4 text-slate-600">{transaction.lab?.code ?? "-"}</td>
                    <td className="px-4 py-4 text-slate-600">{formatDate(transaction.returnedAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
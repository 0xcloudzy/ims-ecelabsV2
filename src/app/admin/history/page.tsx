import { Lab } from "@/db/models/lab";
import { Transaction } from "@/db/models/transaction";
import { User } from "@/db/models/user";
import { Equipment } from "@/db/models/equipment";
import { requireAdminUser } from "@/lib/auth/current-user";

type HistoryItem = {
  _id: string;
  quantity: number;
  status: string;
  requestedAt: Date;
  dueDate?: Date;
  returnedAt?: Date;
  student?: { name: string; email: string };
  equipment?: { name: string };
};

function formatDate(date?: Date) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export default async function AdminHistoryPage(
  props: { searchParams?: Promise<{ q?: string }> }
) {
  const user = await requireAdminUser();
  const searchParams = await props.searchParams;
  const q = searchParams?.q?.toLowerCase() || "";

  const labId = typeof user.assignedLab === "object" && user.assignedLab !== null
    ? String((user.assignedLab as { _id: string })._id)
    : null;

  const history = await Transaction.find({
    lab: labId,
    status: { $in: ["completed", "declined", "cancelled"] },
  })
    .populate({ path: "student", model: User, select: "name email" })
    .populate({ path: "equipment", model: Equipment, select: "name" })
    .sort({ requestedAt: -1 })
    .limit(100) // Show last 100 for now
    .lean<HistoryItem[]>();

  const filteredHistory = history.filter(item => {
    if (!q) return true;
    const sName = item.student?.name?.toLowerCase() || "";
    const sEmail = item.student?.email?.toLowerCase() || "";
    const eName = item.equipment?.name?.toLowerCase() || "";
    return sName.includes(q) || sEmail.includes(q) || eName.includes(q);
  });

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#319f9a]">
            Transaction History
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#1f2933]">
            History
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            View completed, declined, and cancelled requests.
          </p>
        </div>
        
        <form className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto" action="/admin/history">
          <label className="flex flex-1 items-center gap-2 sm:min-w-[320px] xl:flex-none">
            <span className="sr-only">Search</span>
            <input
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Search by student or equipment..."
              className="h-11 min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-[#319f9a] focus:ring-2 focus:ring-[#319f9a]/20"
            />
          </label>
          <button
            type="submit"
            className="rounded-md bg-[#022742] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#064463]"
          >
            Search
          </button>
        </form>
      </div>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-[#022742] text-white">
              <tr>
                <th className="w-12 px-4 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Student</th>
                <th className="px-4 py-3 font-semibold">Equipment</th>
                <th className="w-24 px-4 py-3 font-semibold">Qty</th>
                <th className="w-32 px-4 py-3 font-semibold">Status</th>
                <th className="w-36 px-4 py-3 font-semibold">Requested</th>
                <th className="w-36 px-4 py-3 font-semibold">Completed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                    No history found matching your search.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item, i) => (
                  <tr key={item._id} className="hover:bg-slate-50">
                    <td className="px-4 py-4 text-slate-500">{i + 1}</td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-900">{item.student?.name}</p>
                      <p className="text-xs text-slate-500">{item.student?.email}</p>
                    </td>
                    <td className="px-4 py-4 font-medium text-slate-700">
                      {item.equipment?.name || <span className="italic text-slate-400">Deleted Equipment</span>}
                    </td>
                    <td className="px-4 py-4 font-semibold text-[#022742]">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold uppercase tracking-wider
                        ${item.status === "completed" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : ""}
                        ${item.status === "declined" ? "border-red-200 bg-red-50 text-red-700" : ""}
                        ${item.status === "cancelled" ? "border-slate-200 bg-slate-50 text-slate-600" : ""}
                      `}>
                        {item.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{formatDate(item.requestedAt)}</td>
                    <td className="px-4 py-4 text-slate-600">{formatDate(item.returnedAt || item.requestedAt)}</td>
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

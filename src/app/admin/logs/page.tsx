import { EquipmentLog } from "@/db/models/equipment-log";
import { Equipment } from "@/db/models/equipment";
import { User } from "@/db/models/user";
import { requireAdminUser } from "@/lib/auth/current-user";

type LogItem = {
  _id: string;
  action: string;
  changes: Record<string, any>;
  note: string;
  createdAt: Date;
  equipment?: { _id: string; name: string; lab: string };
  changedBy?: { name: string; email: string };
};

function formatDateTime(date?: Date) {
  if (!date) return "-";
  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

function formatChanges(changes: Record<string, any>) {
  if (!changes || Object.keys(changes).length === 0) return null;
  return (
    <ul className="mt-1 space-y-1 text-xs text-slate-500">
      {Object.entries(changes).map(([key, val]) => (
        <li key={key}>
          <span className="font-semibold text-slate-600">{key}:</span>{" "}
          {val.from !== undefined ? (
            <span>
              <span className="line-through opacity-70">{String(val.from)}</span>{" "}
              <span className="text-[#319f9a]">→</span> {String(val.to)}
            </span>
          ) : (
            String(val)
          )}
        </li>
      ))}
    </ul>
  );
}

export default async function AdminLogsPage(
  props: { searchParams?: Promise<{ q?: string }> }
) {
  const user = await requireAdminUser();
  const searchParams = await props.searchParams;
  const q = searchParams?.q?.toLowerCase() || "";

  const labId = typeof user.assignedLab === "object" && user.assignedLab !== null
    ? String((user.assignedLab as { _id: string })._id)
    : null;

  // Fetch all logs and populate
  const logs = await EquipmentLog.find({})
    .populate({ path: "equipment", model: Equipment, select: "name lab" })
    .populate({ path: "changedBy", model: User, select: "name email" })
    .sort({ createdAt: -1 })
    .limit(200) // limit for performance
    .lean<LogItem[]>();

  // Filter logs in memory to only include this lab's equipment and apply search
  const filteredLogs = logs.filter((log) => {
    // 1. Filter by lab (if equipment still exists and has a lab)
    if (log.equipment && String(log.equipment.lab) !== labId) {
      return false;
    }

    // 2. Search filter
    if (!q) return true;
    
    const eName = log.equipment?.name?.toLowerCase() || "";
    const uName = log.changedBy?.name?.toLowerCase() || "";
    const action = log.action?.toLowerCase() || "";
    const note = log.note?.toLowerCase() || "";
    
    return eName.includes(q) || uName.includes(q) || action.includes(q) || note.includes(q);
  });

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#319f9a]">
            Inventory Logs
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#1f2933]">
            Equipment Change Logs
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Track all inventory additions, edits, and deletions over time.
          </p>
        </div>
        <form className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto" action="/admin/logs">
          <label className="flex flex-1 items-center gap-2 sm:min-w-[320px] xl:flex-none">
            <span className="sr-only">Search</span>
            <input
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Search by equipment, admin, or action..."
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
                <th className="w-48 px-4 py-3 font-semibold">Date & Time</th>
                <th className="px-4 py-3 font-semibold">Equipment</th>
                <th className="w-32 px-4 py-3 font-semibold">Action</th>
                <th className="px-4 py-3 font-semibold">Changed By</th>
                <th className="px-4 py-3 font-semibold">Details / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                    No logs found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50">
                    <td className="px-4 py-4 text-slate-600">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-900">
                      {log.equipment?.name || <span className="italic text-slate-400">Deleted Equipment</span>}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold uppercase tracking-wider
                        ${log.action === "created" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : ""}
                        ${log.action === "updated" ? "border-blue-200 bg-blue-50 text-blue-700" : ""}
                        ${log.action === "deleted" ? "border-red-200 bg-red-50 text-red-700" : ""}
                        ${log.action === "restored" ? "border-orange-200 bg-orange-50 text-orange-700" : ""}
                      `}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-700">{log.changedBy?.name || "System"}</p>
                      <p className="text-xs text-slate-400">{log.changedBy?.email}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-slate-700">{log.note || "—"}</p>
                      {formatChanges(log.changes)}
                    </td>
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

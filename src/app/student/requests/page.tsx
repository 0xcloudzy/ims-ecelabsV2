import { Lab } from "@/db/models/lab";
import { Transaction } from "@/db/models/transaction";
import { requireStudentUser } from "@/lib/auth/current-user";

type RequestListItem = {
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

const statusStyles: Record<string, string> = {
  requested: "border-amber-200 bg-amber-50 text-amber-700",
  accepted: "border-emerald-200 bg-emerald-50 text-emerald-700",
  returning: "border-violet-200 bg-violet-50 text-violet-700",
  completed: "border-slate-200 bg-slate-50 text-slate-700",
  declined: "border-red-200 bg-red-50 text-red-700",
  cancelled: "border-slate-200 bg-slate-100 text-slate-600",
};

const statusLabels: Record<string, string> = {
  requested: "Waiting for Approval",
  accepted: "Equipped",
  returning: "Return Requested",
  completed: "Returned",
  declined: "Declined",
  cancelled: "Cancelled",
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
  return (
    <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${statusStyles[status] ?? statusStyles.cancelled}`}>
      {statusLabels[status] ?? status}
    </span>
  );
}

function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-slate-500">
        {label}
      </td>
    </tr>
  );
}

export default async function StudentRequestsPage() {
  const user = await requireStudentUser();

  const [activeRequests, closedRequests] = await Promise.all([
    Transaction.find({ student: user._id, status: { $in: ["requested", "accepted", "returning"] } })
      .populate("equipment", "name")
      .populate({ path: "lab", model: Lab, select: "name code" })
      .sort({ requestedAt: -1 })
      .limit(50)
      .lean<RequestListItem[]>(),
    Transaction.find({ student: user._id, status: { $in: ["completed", "declined", "cancelled"] } })
      .populate("equipment", "name")
      .populate({ path: "lab", model: Lab, select: "name code" })
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean<RequestListItem[]>(),
  ]);

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#319f9a]">
          Request Status
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#1f2933]">
          Borrow and return records
        </h1>
      </div>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-xl font-semibold text-[#319f9a]">Active Requests</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-[#022742] text-white">
              <tr>
                <th className="px-4 py-3 font-semibold">S.No</th>
                <th className="px-4 py-3 font-semibold">Equipment Name</th>
                <th className="px-4 py-3 font-semibold">Lab</th>
                <th className="px-4 py-3 font-semibold">Quantity</th>
                <th className="px-4 py-3 font-semibold">Date of Request</th>
                <th className="px-4 py-3 font-semibold">Last Date of Return</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeRequests.length === 0 ? (
                <EmptyRow colSpan={8} label="No active requests yet." />
              ) : (
                activeRequests.map((request, index) => (
                  <tr key={request._id} className="hover:bg-slate-50">
                    <td className="px-4 py-4 text-slate-600">{index + 1}</td>
                    <td className="px-4 py-4 font-medium text-slate-900">
                      {request.equipment?.name ?? "Equipment removed"}
                    </td>
                    <td className="px-4 py-4 text-slate-600">{request.lab?.code ?? "-"}</td>
                    <td className="px-4 py-4 text-slate-600">{request.quantity}</td>
                    <td className="px-4 py-4 text-slate-600">{formatDate(request.requestedAt)}</td>
                    <td className="px-4 py-4 text-slate-600">{formatDate(request.dueDate)}</td>
                    <td className="px-4 py-4"><StatusBadge status={request.status} /></td>
                    <td className="px-4 py-4 text-slate-400">-</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-xl font-semibold text-[#319f9a]">Closed Requests</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-[#022742] text-white">
              <tr>
                <th className="px-4 py-3 font-semibold">S.No</th>
                <th className="px-4 py-3 font-semibold">Equipment Name</th>
                <th className="px-4 py-3 font-semibold">Quantity</th>
                <th className="px-4 py-3 font-semibold">Lab</th>
                <th className="px-4 py-3 font-semibold">Closed On</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {closedRequests.length === 0 ? (
                <EmptyRow colSpan={6} label="No closed requests yet." />
              ) : (
                closedRequests.map((request, index) => (
                  <tr key={request._id} className="hover:bg-slate-50">
                    <td className="px-4 py-4 text-slate-600">{index + 1}</td>
                    <td className="px-4 py-4 font-medium text-slate-900">
                      {request.equipment?.name ?? "Equipment removed"}
                    </td>
                    <td className="px-4 py-4 text-slate-600">{request.quantity}</td>
                    <td className="px-4 py-4 text-slate-600">{request.lab?.code ?? "-"}</td>
                    <td className="px-4 py-4 text-slate-600">{formatDate(request.returnedAt)}</td>
                    <td className="px-4 py-4"><StatusBadge status={request.status} /></td>
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
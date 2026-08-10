import { Lab } from "@/db/models/lab";
import { Transaction } from "@/db/models/transaction";
import { User } from "@/db/models/user";
import { Equipment } from "@/db/models/equipment";
import { requireAdminUser } from "@/lib/auth/current-user";
import { AdminTransactionActions } from "../borrow-requests/actions";

type ReturnRequest = {
  _id: string;
  quantity: number;
  status: string;
  issuedAt: Date;
  dueDate: Date;
  returnRequestedAt?: Date;
  dropoffTime?: Date;
  student?: { name: string; email: string };
  equipment?: { name: string };
};

function formatDate(date?: Date) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function formatDateTime(date?: Date) {
  if (!date) return "-";
  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
  });
}

export default async function AdminReturnRequestsPage() {
  const user = await requireAdminUser();

  const labId = typeof user.assignedLab === "object" && user.assignedLab !== null
    ? String((user.assignedLab as { _id: string })._id)
    : null;

  const requests = await Transaction.find({
    lab: labId,
    status: { $in: ["return_requested", "approved_for_dropoff"] },
  })
    .populate({ path: "student", model: User, select: "name email" })
    .populate({ path: "equipment", model: Equipment, select: "name" })
    .sort({ returnRequestedAt: -1 })
    .lean<ReturnRequest[]>();

  const newReturnRequests = requests.filter(r => r.status === "return_requested");
  const waitingDropoff = requests.filter(r => r.status === "approved_for_dropoff");

  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#319f9a]">
          Return Requests
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#1f2933]">
          Manage Returns
        </h1>
      </div>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-xl font-semibold text-[#022742]">New Return Requests</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-[#022742] text-white">
              <tr>
                <th className="w-12 px-4 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Student</th>
                <th className="px-4 py-3 font-semibold">Equipment</th>
                <th className="w-20 px-4 py-3 font-semibold">Qty</th>
                <th className="w-28 px-4 py-3 font-semibold">Issued On</th>
                <th className="w-28 px-4 py-3 font-semibold">Due Date</th>
                <th className="w-32 px-4 py-3 font-semibold">Return Req.</th>
                <th className="w-48 px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {newReturnRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500">
                    No new return requests.
                  </td>
                </tr>
              ) : (
                newReturnRequests.map((req, i) => (
                  <tr key={req._id} className="hover:bg-slate-50">
                    <td className="px-4 py-4 text-slate-500">{i + 1}</td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-900">{req.student?.name ?? "Unknown"}</p>
                      <p className="text-xs text-slate-500">{req.student?.email}</p>
                    </td>
                    <td className="px-4 py-4 font-medium text-slate-900">
                      {req.equipment?.name ?? "Removed"}
                    </td>
                    <td className="px-4 py-4 text-slate-700">{req.quantity}</td>
                    <td className="px-4 py-4 text-slate-600">{formatDate(req.issuedAt)}</td>
                    <td className="px-4 py-4 text-slate-600">{formatDate(req.dueDate)}</td>
                    <td className="px-4 py-4 text-slate-600">{formatDate(req.returnRequestedAt)}</td>
                    <td className="px-4 py-4">
                      <AdminTransactionActions id={JSON.parse(JSON.stringify(req._id))} type="return" status={req.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-xl font-semibold text-[#022742]">Waiting for Dropoff</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-[#022742] text-white">
              <tr>
                <th className="w-12 px-4 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Student</th>
                <th className="px-4 py-3 font-semibold">Equipment</th>
                <th className="w-20 px-4 py-3 font-semibold">Qty</th>
                <th className="w-40 px-4 py-3 font-semibold">Scheduled Dropoff</th>
                <th className="w-48 px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {waitingDropoff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                    No students waiting to drop off items.
                  </td>
                </tr>
              ) : (
                waitingDropoff.map((req, i) => (
                  <tr key={req._id} className="hover:bg-slate-50">
                    <td className="px-4 py-4 text-slate-500">{i + 1}</td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-900">{req.student?.name ?? "Unknown"}</p>
                      <p className="text-xs text-slate-500">{req.student?.email}</p>
                    </td>
                    <td className="px-4 py-4 font-medium text-slate-900">
                      {req.equipment?.name ?? "Removed"}
                    </td>
                    <td className="px-4 py-4 text-slate-700">{req.quantity}</td>
                    <td className="px-4 py-4 font-semibold text-blue-700">{formatDateTime(req.dropoffTime)}</td>
                    <td className="px-4 py-4">
                      <AdminTransactionActions id={JSON.parse(JSON.stringify(req._id))} type="return" status={req.status} />
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

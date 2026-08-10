import { Lab } from "@/db/models/lab";
import { Transaction } from "@/db/models/transaction";
import { User } from "@/db/models/user";
import { Equipment } from "@/db/models/equipment";
import { requireAdminUser } from "@/lib/auth/current-user";
import { AdminTransactionActions } from "./actions";

type BorrowRequest = {
  _id: string;
  quantity: number;
  status: string;
  requestedAt: Date;
  requestedDays: number;
  pickupTime?: Date;
  studentComment?: string;
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

export default async function AdminBorrowRequestsPage() {
  const user = await requireAdminUser();

  const labId = typeof user.assignedLab === "object" && user.assignedLab !== null
    ? String((user.assignedLab as { _id: string })._id)
    : null;

  const requests = await Transaction.find({
    lab: labId,
    status: { $in: ["requested", "approved_for_pickup"] },
  })
    .populate({ path: "student", model: User, select: "name email" })
    .populate({ path: "equipment", model: Equipment, select: "name" })
    .sort({ requestedAt: -1 })
    .lean<BorrowRequest[]>();

  const pendingRequests = requests.filter(r => r.status === "requested");
  const waitingPickup = requests.filter(r => r.status === "approved_for_pickup");

  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#319f9a]">
          Borrow Requests
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#1f2933]">
          Manage Borrowing
        </h1>
      </div>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-xl font-semibold text-[#022742]">New Requests</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-[#022742] text-white">
              <tr>
                <th className="w-12 px-4 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Student</th>
                <th className="px-4 py-3 font-semibold">Equipment</th>
                <th className="w-20 px-4 py-3 font-semibold">Qty</th>
                <th className="w-28 px-4 py-3 font-semibold">Requested</th>
                <th className="w-28 px-4 py-3 font-semibold">Days Needed</th>
                <th className="px-4 py-3 font-semibold">Comment</th>
                <th className="w-48 px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pendingRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500">
                    No new borrow requests.
                  </td>
                </tr>
              ) : (
                pendingRequests.map((req, i) => (
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
                    <td className="px-4 py-4 text-slate-600">{formatDate(req.requestedAt)}</td>
                    <td className="px-4 py-4 text-slate-600">{req.requestedDays} days</td>
                    <td className="max-w-xs px-4 py-4 text-slate-600">
                      {req.studentComment || "—"}
                    </td>
                    <td className="px-4 py-4">
                      <AdminTransactionActions id={JSON.parse(JSON.stringify(req._id))} type="borrow" status={req.status} />
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
          <h2 className="text-xl font-semibold text-[#022742]">Waiting for Pickup</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-[#022742] text-white">
              <tr>
                <th className="w-12 px-4 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Student</th>
                <th className="px-4 py-3 font-semibold">Equipment</th>
                <th className="w-20 px-4 py-3 font-semibold">Qty</th>
                <th className="w-40 px-4 py-3 font-semibold">Scheduled Pickup</th>
                <th className="w-48 px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {waitingPickup.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                    No students waiting to pick up items.
                  </td>
                </tr>
              ) : (
                waitingPickup.map((req, i) => (
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
                    <td className="px-4 py-4 font-semibold text-blue-700">{formatDateTime(req.pickupTime)}</td>
                    <td className="px-4 py-4">
                      <AdminTransactionActions id={JSON.parse(JSON.stringify(req._id))} type="borrow" status={req.status} />
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

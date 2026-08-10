import { Lab } from "@/db/models/lab";
import { Transaction } from "@/db/models/transaction";
import { User } from "@/db/models/user";
import { Equipment } from "@/db/models/equipment";
import { requireAdminUser } from "@/lib/auth/current-user";

type IssuedItem = {
  _id: string;
  quantity: number;
  status: string;
  issuedAt: Date;
  dueDate: Date;
  requestedDays: number;
  student?: { name: string; email: string };
  equipment?: { name: string };
};

function formatDate(date?: Date) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function isOverdue(dueDate?: Date) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

export default async function AdminIssuedItemsPage() {
  const user = await requireAdminUser();

  const labId = typeof user.assignedLab === "object" && user.assignedLab !== null
    ? String((user.assignedLab as { _id: string })._id)
    : null;

  const issuedItems = await Transaction.find({
    lab: labId,
    status: "issued",
  })
    .populate({ path: "student", model: User, select: "name email" })
    .populate({ path: "equipment", model: Equipment, select: "name" })
    .sort({ dueDate: 1 })
    .lean<IssuedItem[]>();

  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#319f9a]">
          Issued Items
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#1f2933]">
          Currently Issued Equipment
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {issuedItems.length} item{issuedItems.length !== 1 ? "s" : ""} currently out with students
        </p>
      </div>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
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
                <th className="w-28 px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {issuedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                    No equipment is currently issued to any student.
                  </td>
                </tr>
              ) : (
                issuedItems.map((item, i) => {
                  const overdue = isOverdue(item.dueDate);
                  return (
                    <tr key={item._id} className={`hover:bg-slate-50 ${overdue ? "bg-red-50/50" : ""}`}>
                      <td className="px-4 py-4 text-slate-500">{i + 1}</td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-900">{item.student?.name ?? "Unknown"}</p>
                        <p className="text-xs text-slate-500">{item.student?.email}</p>
                      </td>
                      <td className="px-4 py-4 font-medium text-slate-900">
                        {item.equipment?.name ?? "Removed"}
                      </td>
                      <td className="px-4 py-4 text-slate-700">{item.quantity}</td>
                      <td className="px-4 py-4 text-slate-600">{formatDate(item.issuedAt)}</td>
                      <td className={`px-4 py-4 font-semibold ${overdue ? "text-red-600" : "text-slate-600"}`}>
                        {formatDate(item.dueDate)}
                      </td>
                      <td className="px-4 py-4">
                        {overdue ? (
                          <span className="inline-flex rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
                            Overdue
                          </span>
                        ) : (
                          <span className="inline-flex rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                            On Time
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

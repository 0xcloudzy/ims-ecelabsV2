import { requireAdminUser } from "@/lib/auth/current-user";
import { User } from "@/db/models/user";
import { Transaction } from "@/db/models/transaction";
import { DuesActionButtons } from "./actions";

type StudentDoc = {
  _id: string;
  name: string;
  email: string;
  studentProfile?: {
    rollNumber: string;
    department: string;
    programme: string;
    phoneNumber: string;
    duesClearance?: {
      isCleared: boolean;
      clearedAt?: Date;
      clearedBy?: { name: string; email: string };
    };
  };
};

function formatDate(date?: Date) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export default async function AdminStudentsPage() {
  await requireAdminUser();

  // Find all students
  const students = await User.find({ role: "student" })
    .populate({
      path: "studentProfile.duesClearance.clearedBy",
      model: User,
      select: "name email",
    })
    .sort({ "studentProfile.rollNumber": 1 })
    .lean<StudentDoc[]>();

  // Fetch active transactions for all students
  const activeTransactions = await Transaction.aggregate([
    {
      $match: {
        status: {
          $in: [
            "requested",
            "approved_for_pickup",
            "issued",
            "return_requested",
            "approved_for_dropoff",
          ],
        },
      },
    },
    {
      $group: {
        _id: "$student",
        count: { $sum: 1 },
      },
    },
  ]);

  const activeCountMap = new Map<string, number>(
    activeTransactions.map((t) => [String(t._id), t.count])
  );

  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#319f9a]">
          Student Management
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#1f2933]">
          Students & Dues Clearance
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Manage "No Dues" clearance for graduating students. Students cannot be cleared if they have any active equipment across any lab.
        </p>
      </div>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-[#022742] text-white">
              <tr>
                <th className="w-12 px-4 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Student</th>
                <th className="w-32 px-4 py-3 font-semibold">Roll No</th>
                <th className="w-40 px-4 py-3 font-semibold">Program</th>
                <th className="w-32 px-4 py-3 text-center font-semibold">Active Borrows</th>
                <th className="w-48 px-4 py-3 font-semibold">Dues Status</th>
                <th className="w-32 px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                    No students registered yet.
                  </td>
                </tr>
              ) : (
                students.map((student, i) => {
                  const borrows = activeCountMap.get(String(student._id)) || 0;
                  const profile = student.studentProfile;
                  const clearance = profile?.duesClearance;

                  return (
                    <tr key={student._id} className="hover:bg-slate-50">
                      <td className="px-4 py-4 text-slate-500">{i + 1}</td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-900">{student.name}</p>
                        <p className="text-xs text-slate-500">{student.email}</p>
                      </td>
                      <td className="px-4 py-4 text-slate-700">{profile?.rollNumber ?? "-"}</td>
                      <td className="px-4 py-4">
                        {profile ? (
                          <span className="uppercase text-slate-700">
                            {profile.department} / {profile.programme}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {borrows > 0 ? (
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                            {borrows}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {clearance?.isCleared ? (
                          <div>
                            <span className="inline-flex rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                              Cleared
                            </span>
                            <div className="mt-1 text-[11px] text-slate-500">
                              On {formatDate(clearance.clearedAt)}
                              <br />
                              By {clearance.clearedBy?.name || "Admin"}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600">
                            Not Cleared
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <DuesActionButtons
                          studentId={JSON.parse(JSON.stringify(student._id))}
                          isCleared={!!clearance?.isCleared}
                          activeBorrows={borrows}
                        />
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

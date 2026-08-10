import { requireStudentUser } from "@/lib/auth/current-user";

const departmentLabels: Record<string, string> = {
  cse: "CSE",
  cb: "CB",
  mathematics: "Mathematics",
  design: "Design",
  ece: "ECE",
  ssh: "SSH",
};

const programmeLabels: Record<string, string> = {
  btech: "B.Tech",
  mtech: "M.Tech",
  phd: "PhD",
  organisation: "Organisation",
};

export default async function StudentProfilePage() {
  const user = await requireStudentUser();
  const profile = user.studentProfile;

  const rows = [
    { label: "Full Name", value: user.name },
    { label: "Institute Email", value: user.email },
    { label: "Roll Number / ID", value: profile?.rollNumber },
    { label: "Phone Number", value: profile?.phoneNumber },
    { label: "Department", value: departmentLabels[profile?.department ?? ""] ?? profile?.department },
    { label: "Programme", value: programmeLabels[profile?.programme ?? ""] ?? profile?.programme },
  ];

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#319f9a]">
          Profile
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#1f2933]">
          Student details
        </h1>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.85fr_1.35fr]">
        <aside className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[#e6f6f5] text-2xl font-semibold text-[#247f7b]">
            {user.name.slice(0, 1).toUpperCase()}
          </div>
          <h2 className="mt-5 text-xl font-semibold text-[#1f2933]">{user.name}</h2>
          <p className="mt-1 text-sm text-slate-500">{user.email}</p>
          {profile?.duesClearance?.isCleared ? (
            <div className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
              Graduation Clearance Granted
            </div>
          ) : (
            <div className="mt-5 rounded-md border border-[#d3eeee] bg-[#f2fbfa] px-3 py-2 text-sm font-semibold text-[#247f7b]">
              Active student account
            </div>
          )}
        </aside>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-xl font-semibold text-[#319f9a]">Onboarding Information</h2>
          </div>
          <dl className="divide-y divide-slate-100">
            {rows.map((row) => (
              <div key={row.label} className="grid gap-2 px-5 py-4 sm:grid-cols-[220px_1fr]">
                <dt className="text-sm font-semibold text-slate-500">{row.label}</dt>
                <dd className="text-sm font-semibold text-slate-900">{row.value || "-"}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </section>
  );
}
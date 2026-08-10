import { Equipment } from "@/db/models/equipment";
import { Lab } from "@/db/models/lab";
import { requireStudentUser } from "@/lib/auth/current-user";
import { BorrowButton } from "./borrow-button";
import Link from "next/link";
import type { Types } from "mongoose";

type EquipmentListItem = {
  _id: string;
  name: string;
  description?: string;
  type: string;
  link?: string;
  quantityAvailable: number;
  quantityTotal: number;
  lab?: {
    _id: string;
    name: string;
    code: string;
  };
};

type LabFilterItem = {
  _id: string;
  name: string;
  code: string;
};

type EquipmentPageProps = {
  searchParams?: Promise<{
    q?: string;
    lab?: string;
  }>;
};

export default async function StudentEquipmentPage({ searchParams }: EquipmentPageProps) {
  const user = await requireStudentUser();
  const isCleared = !!user.studentProfile?.duesClearance?.isCleared;

  const params = await searchParams;
  const query = params?.q?.trim() ?? "";
  const selectedLab = params?.lab?.trim() ?? "all";

  const labs = await Lab.find({ isActive: true })
    .sort({ code: 1 })
    .lean<LabFilterItem[]>();

  const equipmentFilter: {
    isDeleted: boolean;
    isActive: boolean;
    lab?: Types.ObjectId;
    $text?: { $search: string };
  } = {
    isDeleted: false,
    isActive: true,
  };

  const selectedLabRecord = labs.find((lab) => String(lab._id) === selectedLab);

  if (selectedLabRecord) {
    equipmentFilter.lab = selectedLabRecord._id as unknown as Types.ObjectId;
  }

  if (query) {
    equipmentFilter.$text = { $search: query };
  }

  const equipment = await Equipment.find(equipmentFilter)
    .populate({ path: "lab", model: Lab, select: "name code" })
    .sort(query ? { score: { $meta: "textScore" } } : { name: 1 })
    .limit(100)
    .lean<EquipmentListItem[]>();

  const labTabs = [{ _id: "all", code: "all", name: "All Labs" }, ...labs];

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#319f9a]">
              Equipment List
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#1f2933]">
              Browse equipment
            </h1>
          </div>

          <form className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto" action="/student/equipment">
            <label className="flex flex-1 items-center gap-2 sm:min-w-[360px] xl:flex-none">
              <span className="text-sm font-medium text-slate-700">Search</span>
              <input
                name="q"
                type="search"
                defaultValue={query}
                placeholder="Search equipment, description, type..."
                className="h-11 min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-[#319f9a] focus:ring-2 focus:ring-[#319f9a]/20"
              />
            </label>
            {selectedLab !== "all" ? <input type="hidden" name="lab" value={selectedLab} /> : null}
            <button
              type="submit"
              className="h-11 rounded-md bg-[#022742] px-6 text-sm font-semibold text-white transition hover:bg-[#064463]"
            >
              Filter
            </button>
          </form>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
        {labTabs.map((lab) => {
          const isActive = selectedLab === String(lab._id) || (selectedLab === "all" && lab._id === "all");
          const href = `/student/equipment?${new URLSearchParams({
            ...(query ? { q: query } : {}),
            ...(lab._id === "all" ? {} : { lab: String(lab._id) }),
          }).toString()}`;

          return (
            <Link
              key={String(lab._id)}
              href={href}
              className={`whitespace-nowrap rounded-md px-4 py-2 text-sm font-semibold transition ${
                isActive
                  ? "bg-[#319f9a] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {lab.code === "all" ? "All Labs" : lab.code.toUpperCase()}
            </Link>
          );
        })}
      </div>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1060px] text-left text-sm">
            <thead className="bg-[#022742] text-white">
              <tr>
                <th className="w-16 px-4 py-3 font-semibold">ID</th>
                <th className="px-4 py-3 font-semibold">Equipment Name</th>
                <th className="px-4 py-3 font-semibold">Description</th>
                <th className="w-28 px-4 py-3 font-semibold">More Info</th>
                <th className="w-44 px-4 py-3 font-semibold">Type</th>
                <th className="w-28 px-4 py-3 font-semibold">Quantity</th>
                <th className="w-32 px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {equipment.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                    No equipment matches this view.
                  </td>
                </tr>
              ) : (
                equipment.map((item, index) => (
                  <tr key={item._id} className="hover:bg-slate-50">
                    <td className="px-4 py-4 text-slate-600">{index + 1}</td>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-slate-900">{item.name}</div>
                      <div className="mt-1 text-xs font-medium uppercase tracking-wide text-[#319f9a]">
                        {item.lab?.code ?? "unassigned"}
                      </div>
                    </td>
                    <td className="max-w-xl px-4 py-4 leading-6 text-slate-700">
                      {item.description || "No description provided."}
                    </td>
                    <td className="px-4 py-4">
                      {item.link ? (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                        >
                          Link
                        </a>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-slate-700">{item.type}</td>
                    <td className="px-4 py-4">
                      <span className="font-semibold text-[#022742]">{item.quantityAvailable}</span>
                      <span className="text-slate-400"> / {item.quantityTotal}</span>
                    </td>
                    <td className="px-4 py-4">
                      <BorrowButton item={JSON.parse(JSON.stringify(item))} isCleared={isCleared} />
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
import { Equipment } from "@/db/models/equipment";
import { Lab } from "@/db/models/lab";
import { requireAdminUser } from "@/lib/auth/current-user";
import { AdminEquipmentTable } from "./equipment-table";

type EquipmentItem = {
  _id: string;
  name: string;
  description: string;
  type: string;
  link?: string;
  quantityTotal: number;
  quantityAvailable: number;
  isActive: boolean;
  lab: {
    _id: string;
    code: string;
    name: string;
  };
};

export default async function AdminEquipmentPage() {
  const user = await requireAdminUser();

  const labId = typeof user.assignedLab === "object" && user.assignedLab !== null
    ? String((user.assignedLab as { _id: string })._id)
    : null;

  const equipment = await Equipment.find({
    isDeleted: false,
  })
    .populate({ path: "lab", model: Lab, select: "name code" })
    .sort({ name: 1 })
    .lean<EquipmentItem[]>();

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#319f9a]">
          Equipment Management
        </p>
        <div className="mt-3 flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-[#1f2933]">
              All Lab Equipment
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {equipment.length} item{equipment.length !== 1 ? "s" : ""} across all labs
            </p>
          </div>
        </div>
      </div>

      <AdminEquipmentTable
        equipment={JSON.parse(JSON.stringify(equipment))}
        adminLabId={labId}
      />
    </section>
  );
}

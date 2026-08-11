import { Equipment } from "@/db/models/equipment";
import { Lab } from "@/db/models/lab";
import { requireStudentUser } from "@/lib/auth/current-user";
import { StudentEquipmentTable } from "./student-equipment-table";

type EquipmentListItem = {
  _id: string;
  name: string;
  description?: string;
  type: string;
  link?: string;
  quantityAvailable: number;
  quantityTotal: number;
  isConsumable?: boolean;
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

export default async function StudentEquipmentPage() {
  const user = await requireStudentUser();
  const isCleared = !!user.studentProfile?.duesClearance?.isCleared;

  const labs = await Lab.find({ isActive: true })
    .sort({ code: 1 })
    .lean<LabFilterItem[]>();

  // Fetch ALL active equipment (no server-side text filtering needed)
  const equipment = await Equipment.find({
    isDeleted: false,
    isActive: true,
  })
    .populate({ path: "lab", model: Lab, select: "name code" })
    .sort({ name: 1 })
    .lean<EquipmentListItem[]>();

  return (
    <StudentEquipmentTable
      equipment={JSON.parse(JSON.stringify(equipment))}
      labs={JSON.parse(JSON.stringify(labs))}
      isCleared={isCleared}
    />
  );
}
import { connectToDatabase } from "@/db/connect";
import { Equipment } from "@/db/models/equipment";
import { EquipmentLog } from "@/db/models/equipment-log";
import { requireAdminUser } from "@/lib/auth/current-user";
import { createEquipmentSchema } from "@/lib/validation/equipment";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const user = await requireAdminUser();

  await connectToDatabase();

  const labId = typeof user.assignedLab === "object" && user.assignedLab !== null
    ? (user.assignedLab as { _id: string })._id
    : null;

  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("q")?.trim() ?? "";

  const filter: Record<string, unknown> = {
    lab: labId,
    isDeleted: false,
  };

  if (search) {
    filter.$text = { $search: search };
  }

  const equipment = await Equipment.find(filter)
    .sort(search ? { score: { $meta: "textScore" } } : { name: 1 })
    .limit(200)
    .lean();

  return NextResponse.json({ equipment });
}

export async function POST(request: NextRequest) {
  const user = await requireAdminUser();

  await connectToDatabase();

  const labId = typeof user.assignedLab === "object" && user.assignedLab !== null
    ? (user.assignedLab as { _id: string })._id
    : null;

  if (!labId) {
    return NextResponse.json({ error: "No lab assigned" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createEquipmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const equipment = await Equipment.create({
    ...parsed.data,
    lab: labId,
    quantityAvailable: parsed.data.quantityTotal,
    isActive: true,
    isDeleted: false,
    createdBy: user._id,
    updatedBy: user._id,
  });

  await EquipmentLog.create({
    equipment: equipment._id,
    action: "created",
    changedBy: user._id,
    changes: parsed.data,
  });

  return NextResponse.json({ equipment }, { status: 201 });
}

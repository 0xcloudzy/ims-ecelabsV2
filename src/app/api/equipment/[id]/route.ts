import { connectToDatabase } from "@/db/connect";
import { Equipment } from "@/db/models/equipment";
import { EquipmentLog } from "@/db/models/equipment-log";
import { requireAdminUser } from "@/lib/auth/current-user";
import { updateEquipmentSchema } from "@/lib/validation/equipment";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, context: RouteContext) {
  const user = await requireAdminUser();
  const { id } = await context.params;

  await connectToDatabase();

  const labId = typeof user.assignedLab === "object" && user.assignedLab !== null
    ? (user.assignedLab as { _id: string })._id
    : null;

  const existing = await Equipment.findOne({
    _id: id,
    lab: labId,
    isDeleted: false,
  });

  if (!existing) {
    return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateEquipmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  // Build changes diff for the log
  const changes: Record<string, { from: unknown; to: unknown }> = {};

  for (const [key, value] of Object.entries(parsed.data)) {
    if (value !== undefined) {
      const existingValue = existing.get(key);
      if (String(existingValue) !== String(value)) {
        changes[key] = { from: existingValue, to: value };
      }
    }
  }

  // If quantityTotal changed, adjust quantityAvailable proportionally
  if (parsed.data.quantityTotal !== undefined && parsed.data.quantityTotal !== existing.quantityTotal) {
    const borrowed = existing.quantityTotal - existing.quantityAvailable;
    const newAvailable = Math.max(0, parsed.data.quantityTotal - borrowed);
    existing.quantityAvailable = newAvailable;
    changes.quantityAvailable = { from: existing.quantityAvailable, to: newAvailable };
  }

  Object.assign(existing, parsed.data);
  existing.updatedBy = user._id;
  await existing.save();

  if (Object.keys(changes).length > 0) {
    await EquipmentLog.create({
      equipment: existing._id,
      action: "updated",
      changedBy: user._id,
      changes,
    });
  }

  return NextResponse.json({ equipment: existing });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const user = await requireAdminUser();
  const { id } = await context.params;

  await connectToDatabase();

  const labId = typeof user.assignedLab === "object" && user.assignedLab !== null
    ? (user.assignedLab as { _id: string })._id
    : null;

  const equipment = await Equipment.findOne({
    _id: id,
    lab: labId,
    isDeleted: false,
  });

  if (!equipment) {
    return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
  }

  equipment.isDeleted = true;
  equipment.updatedBy = user._id;
  await equipment.save();

  await EquipmentLog.create({
    equipment: equipment._id,
    action: "deleted",
    changedBy: user._id,
    changes: { isDeleted: { from: false, to: true } },
  });

  return NextResponse.json({ success: true });
}

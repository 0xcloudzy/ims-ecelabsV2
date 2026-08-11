import { connectToDatabase } from "@/db/connect";
import { Equipment } from "@/db/models/equipment";
import { EquipmentLog } from "@/db/models/equipment-log";
import { requireAdminUser } from "@/lib/auth/current-user";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

const bulkEquipmentSchema = z.object({
  items: z.array(
    z.object({
      name: z.string().trim().min(2),
      description: z.string().trim().optional().default(""),
      type: z.string().trim().min(1),
      quantityTotal: z.coerce.number().int().min(1),
      link: z.string().trim().url().optional().or(z.literal("")),
      isConsumable: z.boolean().optional().default(false),
    })
  ).min(1, "No valid items found to upload"),
});

export async function POST(request: NextRequest) {
  const user = await requireAdminUser();

  await connectToDatabase();

  const labId = typeof user.assignedLab === "object" && user.assignedLab !== null
    ? String((user.assignedLab as { _id: string })._id)
    : null;

  if (!labId) {
    return NextResponse.json({ error: "No lab assigned" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = bulkEquipmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed on one or more items", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { items } = parsed.data;
  let createdCount = 0;
  let updatedCount = 0;

  for (const item of items) {
    // Check if equipment with the EXACT name already exists in THIS lab
    const existing = await Equipment.findOne({
      name: { $regex: new RegExp(`^${item.name}$`, "i") },
      lab: labId,
      isDeleted: false,
    });

    if (existing) {
      // Update existing item
      const addedQuantity = item.quantityTotal;
      const changes: Record<string, { from: unknown; to: unknown }> = {};

      changes.quantityTotal = {
        from: existing.quantityTotal,
        to: existing.quantityTotal + addedQuantity,
      };
      existing.quantityTotal += addedQuantity;

      changes.quantityAvailable = {
        from: existing.quantityAvailable,
        to: existing.quantityAvailable + addedQuantity,
      };
      existing.quantityAvailable += addedQuantity;

      if (item.description && existing.description !== item.description) {
        changes.description = { from: existing.description, to: item.description };
        existing.description = item.description;
      }

      existing.updatedBy = user._id;
      await existing.save();

      await EquipmentLog.create({
        equipment: existing._id,
        action: "updated",
        changedBy: user._id,
        changes,
        note: "Bulk uploaded from Excel/CSV",
      });

      updatedCount++;
    } else {
      // Create new item
      const newEquipment = await Equipment.create({
        name: item.name,
        description: item.description,
        type: item.type,
        quantityTotal: item.quantityTotal,
        quantityAvailable: item.quantityTotal,
        link: item.link || undefined,
        isConsumable: item.isConsumable,
        lab: labId,
        isActive: true,
        isDeleted: false,
        createdBy: user._id,
        updatedBy: user._id,
      });

      await EquipmentLog.create({
        equipment: newEquipment._id,
        action: "created",
        changedBy: user._id,
        changes: item,
        note: "Bulk uploaded from Excel/CSV",
      });

      createdCount++;
    }
  }

  return NextResponse.json({
    success: true,
    message: `Successfully created ${createdCount} new items and updated ${updatedCount} existing items.`,
  });
}

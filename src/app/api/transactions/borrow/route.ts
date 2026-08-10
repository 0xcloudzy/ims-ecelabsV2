import { connectToDatabase } from "@/db/connect";
import { Equipment } from "@/db/models/equipment";
import { Lab } from "@/db/models/lab";
import { Transaction } from "@/db/models/transaction";
import { requireStudentUser } from "@/lib/auth/current-user";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

const borrowSchema = z.object({
  equipmentId: z.string().min(1),
  quantity: z.coerce.number().int().min(1, "Must borrow at least 1"),
  requestedDays: z.coerce.number().int().min(1, "Must borrow for at least 1 day"),
  comment: z.string().trim().max(500).optional(),
});

export async function POST(request: NextRequest) {
  const user = await requireStudentUser();

  await connectToDatabase();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = borrowSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { equipmentId, quantity, requestedDays, comment } = parsed.data;

  const equipment = await Equipment.findOne({
    _id: equipmentId,
    isDeleted: false,
    isActive: true,
  }).populate({ path: "lab", model: Lab, select: "name code" });

  if (!equipment) {
    return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
  }

  if (quantity > equipment.quantityAvailable) {
    return NextResponse.json(
      { error: `Only ${equipment.quantityAvailable} units available` },
      { status: 400 },
    );
  }

  // Check for duplicate pending request
  const existingRequest = await Transaction.findOne({
    student: user._id,
    equipment: equipmentId,
    status: { $in: ["requested", "approved_for_pickup"] },
  });

  if (existingRequest) {
    return NextResponse.json(
      { error: "You already have an active request for this equipment" },
      { status: 409 },
    );
  }

  const transaction = await Transaction.create({
    student: user._id,
    equipment: equipmentId,
    lab: equipment.lab._id,
    quantity,
    status: "requested",
    requestedAt: new Date(),
    requestedDays,
    studentComment: comment || undefined,
  });

  return NextResponse.json({ transaction }, { status: 201 });
}

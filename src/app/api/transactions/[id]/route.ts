import { connectToDatabase } from "@/db/connect";
import { Equipment } from "@/db/models/equipment";
import { Transaction } from "@/db/models/transaction";
import { requireAdminUser } from "@/lib/auth/current-user";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

const actionSchema = z.object({
  action: z.enum(["approve_for_pickup", "issue", "decline", "approve_for_dropoff", "complete_return"]),
  timeSlot: z.string().optional(),
  comment: z.string().trim().max(500).optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const user = await requireAdminUser();
  const { id } = await context.params;

  await connectToDatabase();

  const labId = typeof user.assignedLab === "object" && user.assignedLab !== null
    ? String((user.assignedLab as { _id: string })._id)
    : null;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid action", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { action, timeSlot, comment } = parsed.data;

  const transaction = await Transaction.findById(id);

  if (!transaction) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  // Ensure admin can only act on transactions for their lab
  if (String(transaction.lab) !== labId) {
    return NextResponse.json({ error: "Not authorized for this lab" }, { status: 403 });
  }

  if (action === "approve_for_pickup") {
    if (transaction.status !== "requested") {
      return NextResponse.json({ error: "Can only approve pending requests" }, { status: 400 });
    }
    if (!timeSlot) {
      return NextResponse.json({ error: "Pickup time is required" }, { status: 400 });
    }

    // Reserve stock immediately when approving for pickup
    const equipment = await Equipment.findById(transaction.equipment);
    if (!equipment || equipment.quantityAvailable < transaction.quantity) {
      return NextResponse.json({ error: "Insufficient stock available" }, { status: 400 });
    }
    equipment.quantityAvailable -= transaction.quantity;
    await equipment.save();

    transaction.status = "approved_for_pickup";
    transaction.pickupTime = new Date(timeSlot);
    transaction.decidedAt = new Date();
    transaction.decidedBy = user._id;
    if (comment) transaction.adminComment = comment;
    await transaction.save();

    return NextResponse.json({ success: true, status: "approved_for_pickup" });
  }

  if (action === "issue") {
    if (transaction.status !== "approved_for_pickup") {
      return NextResponse.json({ error: "Can only issue items waiting for pickup" }, { status: 400 });
    }

    transaction.status = "issued";
    const now = new Date();
    transaction.issuedAt = now;
    // Calculate final due date by adding requestedDays to current time
    const dueDate = new Date(now.getTime() + transaction.requestedDays * 86400000);
    transaction.dueDate = dueDate;

    if (comment) transaction.adminComment = comment;
    await transaction.save();

    return NextResponse.json({ success: true, status: "issued" });
  }

  if (action === "decline") {
    if (transaction.status !== "requested" && transaction.status !== "approved_for_pickup") {
      return NextResponse.json({ error: "Can only decline pending requests or items waiting for pickup" }, { status: 400 });
    }

    // If we are declining after already approving for pickup, we must restore the stock we reserved
    if (transaction.status === "approved_for_pickup") {
      const equipment = await Equipment.findById(transaction.equipment);
      if (equipment) {
        equipment.quantityAvailable += transaction.quantity;
        await equipment.save();
      }
    }

    transaction.status = "declined";
    transaction.decidedAt = new Date();
    transaction.decidedBy = user._id;
    if (comment) transaction.adminComment = comment;
    await transaction.save();

    return NextResponse.json({ success: true, status: "declined" });
  }

  if (action === "approve_for_dropoff") {
    if (transaction.status !== "return_requested") {
      return NextResponse.json({ error: "Can only approve dropoff for items requested for return" }, { status: 400 });
    }
    if (!timeSlot) {
      return NextResponse.json({ error: "Dropoff time is required" }, { status: 400 });
    }

    transaction.status = "approved_for_dropoff";
    transaction.dropoffTime = new Date(timeSlot);
    if (comment) transaction.adminComment = comment;
    await transaction.save();

    return NextResponse.json({ success: true, status: "approved_for_dropoff" });
  }

  if (action === "complete_return") {
    if (transaction.status !== "approved_for_dropoff") {
      return NextResponse.json({ error: "Can only complete items approved for dropoff" }, { status: 400 });
    }

    // Restore stock
    const equipment = await Equipment.findById(transaction.equipment);
    if (equipment) {
      equipment.quantityAvailable += transaction.quantity;
      await equipment.save();
    }

    transaction.status = "completed";
    transaction.returnedAt = new Date();
    transaction.decidedBy = user._id;
    if (comment) transaction.adminComment = comment;
    await transaction.save();

    return NextResponse.json({ success: true, status: "completed" });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

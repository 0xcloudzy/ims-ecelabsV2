import { connectToDatabase } from "@/db/connect";
import { Transaction } from "@/db/models/transaction";
import { requireStudentUser } from "@/lib/auth/current-user";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const user = await requireStudentUser();
  const { id } = await context.params;

  await connectToDatabase();

  const transaction = await Transaction.findOne({
    _id: id,
    student: user._id,
    status: "issued",
  });

  if (!transaction) {
    return NextResponse.json(
      { error: "Transaction not found or not eligible for return" },
      { status: 404 },
    );
  }

  transaction.status = "return_requested";
  transaction.returnRequestedAt = new Date();
  await transaction.save();

  return NextResponse.json({ success: true, status: "return_requested" });
}

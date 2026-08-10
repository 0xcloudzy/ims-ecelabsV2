import { requireAdminUser } from "@/lib/auth/current-user";
import { User } from "@/db/models/user";
import { Transaction } from "@/db/models/transaction";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const duesSchema = z.object({
  action: z.enum(["clear", "revoke"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminUser();
    const { id: studentId } = await params;

    const body = await request.json();
    const parsed = duesSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }

    const { action } = parsed.data;

    const studentUser = await User.findById(studentId);
    if (!studentUser || studentUser.role !== "student" || !studentUser.studentProfile) {
      return NextResponse.json(
        { error: "Student not found or invalid profile" },
        { status: 404 }
      );
    }

    if (action === "clear") {
      // Verify no active transactions across ANY lab
      const activeTransactionsCount = await Transaction.countDocuments({
        student: studentId,
        status: {
          $in: [
            "requested",
            "approved_for_pickup",
            "issued",
            "return_requested",
            "approved_for_dropoff",
          ],
        },
      });

      if (activeTransactionsCount > 0) {
        return NextResponse.json(
          {
            error: `Cannot clear dues. Student still has ${activeTransactionsCount} active transaction(s) pending or issued.`,
          },
          { status: 400 }
        );
      }

      studentUser.studentProfile.duesClearance = {
        isCleared: true,
        clearedAt: new Date(),
        clearedBy: admin._id,
      };
    } else if (action === "revoke") {
      studentUser.studentProfile.duesClearance = {
        isCleared: false,
        clearedAt: undefined,
        clearedBy: undefined,
      };
    }

    // Force Mongoose to recognize the nested object change
    studentUser.markModified("studentProfile");
    await studentUser.save();

    return NextResponse.json({ success: true, action });
  } catch (error: any) {
    console.error("Dues clearance error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update dues clearance" },
      { status: 500 }
    );
  }
}

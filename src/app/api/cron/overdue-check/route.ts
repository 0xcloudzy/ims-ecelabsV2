import { connectToDatabase } from "@/db/connect";
import { Transaction } from "@/db/models/transaction";
import { Equipment } from "@/db/models/equipment";
import { Lab } from "@/db/models/lab";
import { User } from "@/db/models/user";
import { sendEmail } from "@/lib/email/send-email";
import { dueDateReminderEmail, overdueNoticeEmail } from "@/lib/email/templates";
import { NextRequest, NextResponse } from "next/server";

function fmtDate(d: Date) {
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export async function GET(request: NextRequest) {
  // Protect with a secret so only cron can call this
  const secret = request.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 86400000);

  // 1. Find items due within the next 24 hours (reminders)
  const dueSoon = await Transaction.find({
    status: "issued",
    dueDate: { $gte: now, $lte: tomorrow },
  })
    .populate({ path: "student", model: User, select: "name email" })
    .populate({ path: "equipment", model: Equipment, select: "name" })
    .populate({ path: "lab", model: Lab, select: "name code" })
    .populate({ path: "decidedBy", model: User, select: "name email" })
    .lean();

  let remindersSent = 0;
  for (const tx of dueSoon) {
    const student = tx.student as any;
    const equip = tx.equipment as any;
    const lab = tx.lab as any;
    const admin = tx.decidedBy as any;

    if (!student?.email) continue;

    const email = dueDateReminderEmail({
      studentName: student.name,
      equipmentName: equip?.name || "Equipment",
      quantity: tx.quantity,
      dueDate: fmtDate(tx.dueDate),
      labName: lab ? `${lab.name} (${lab.code.toUpperCase()})` : "Lab",
      adminName: admin?.name || "Lab Admin",
      adminEmail: admin?.email || "",
    });

    await sendEmail(student.email, email.subject, email.html);
    remindersSent++;
  }

  // 2. Find overdue items (due date has passed, still issued)
  const overdue = await Transaction.find({
    status: "issued",
    dueDate: { $lt: now },
  })
    .populate({ path: "student", model: User, select: "name email" })
    .populate({ path: "equipment", model: Equipment, select: "name" })
    .populate({ path: "lab", model: Lab, select: "name code" })
    .populate({ path: "decidedBy", model: User, select: "name email" })
    .lean();

  let overduesSent = 0;
  for (const tx of overdue) {
    const student = tx.student as any;
    const equip = tx.equipment as any;
    const lab = tx.lab as any;
    const admin = tx.decidedBy as any;

    if (!student?.email) continue;

    const daysOverdue = Math.ceil((now.getTime() - new Date(tx.dueDate).getTime()) / 86400000);

    const email = overdueNoticeEmail({
      studentName: student.name,
      equipmentName: equip?.name || "Equipment",
      quantity: tx.quantity,
      dueDate: fmtDate(tx.dueDate),
      daysOverdue,
      labName: lab ? `${lab.name} (${lab.code.toUpperCase()})` : "Lab",
      adminName: admin?.name || "Lab Admin",
      adminEmail: admin?.email || "",
    });

    await sendEmail(student.email, email.subject, email.html);
    overduesSent++;
  }

  return NextResponse.json({
    success: true,
    remindersSent,
    overduesSent,
    timestamp: now.toISOString(),
  });
}

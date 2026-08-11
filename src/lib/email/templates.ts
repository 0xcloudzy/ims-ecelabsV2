// Shared email wrapper with lab-themed styling
function wrap(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <!-- Header -->
        <tr>
          <td style="background:#022742;padding:24px 32px;">
            <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">ECE Lab IMS</h1>
            <p style="margin:4px 0 0;color:#319f9a;font-size:12px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;">Inventory Management System</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
              This is an automated email from ECE Lab IMS. Please do not reply to this email.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Info Row Helper ───
function infoRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:8px 12px;color:#64748b;font-size:14px;font-weight:600;white-space:nowrap;vertical-align:top;">${label}</td>
      <td style="padding:8px 12px;color:#1e293b;font-size:14px;">${value}</td>
    </tr>`;
}

function infoTable(rows: string): string {
  return `<table cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin:16px 0;">${rows}</table>`;
}

// ═══════════════════════════════════════════════════════════════
// 1. PICKUP APPROVED
// ═══════════════════════════════════════════════════════════════
export function pickupApprovedEmail(data: {
  studentName: string;
  equipmentName: string;
  quantity: number;
  pickupTime: string;
  labName: string;
  adminName: string;
  adminEmail: string;
}): { subject: string; html: string } {
  return {
    subject: `✅ Pickup Approved — ${data.equipmentName}`,
    html: wrap(`
      <h2 style="margin:0 0 8px;color:#022742;font-size:22px;">Pickup Approved</h2>
      <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.6;">
        Hi <strong>${data.studentName}</strong>, your request has been approved! Please collect your equipment at the scheduled time.
      </p>
      ${infoTable(
        infoRow("Equipment", data.equipmentName) +
        infoRow("Quantity", String(data.quantity)) +
        infoRow("Pickup Date/Time", `<strong style="color:#022742;">${data.pickupTime}</strong>`) +
        infoRow("Lab", data.labName) +
        infoRow("Lab Admin", data.adminName) +
        infoRow("Admin Email", `<a href="mailto:${data.adminEmail}" style="color:#319f9a;text-decoration:none;">${data.adminEmail}</a>`)
      )}
      <p style="margin:20px 0 0;color:#475569;font-size:14px;line-height:1.6;">
        Please arrive on time. If you cannot make it, contact the lab admin to reschedule.
      </p>
    `),
  };
}

// ═══════════════════════════════════════════════════════════════
// 2. REQUEST DECLINED
// ═══════════════════════════════════════════════════════════════
export function requestDeclinedEmail(data: {
  studentName: string;
  equipmentName: string;
  quantity: number;
  reason?: string;
  adminName: string;
  adminEmail: string;
}): { subject: string; html: string } {
  return {
    subject: `❌ Request Declined — ${data.equipmentName}`,
    html: wrap(`
      <h2 style="margin:0 0 8px;color:#022742;font-size:22px;">Request Declined</h2>
      <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.6;">
        Hi <strong>${data.studentName}</strong>, unfortunately your request has been declined.
      </p>
      ${infoTable(
        infoRow("Equipment", data.equipmentName) +
        infoRow("Quantity", String(data.quantity)) +
        (data.reason ? infoRow("Reason", data.reason) : "") +
        infoRow("Admin Contact", `<a href="mailto:${data.adminEmail}" style="color:#319f9a;text-decoration:none;">${data.adminEmail}</a> (${data.adminName})`)
      )}
      <p style="margin:20px 0 0;color:#475569;font-size:14px;line-height:1.6;">
        If you have questions, please reach out to the lab admin.
      </p>
    `),
  };
}

// ═══════════════════════════════════════════════════════════════
// 3. EQUIPMENT ISSUED
// ═══════════════════════════════════════════════════════════════
export function equipmentIssuedEmail(data: {
  studentName: string;
  equipmentName: string;
  quantity: number;
  issuedAt: string;
  dueDate: string;
  labName: string;
  adminName: string;
  adminEmail: string;
}): { subject: string; html: string } {
  return {
    subject: `📦 Equipment Issued — ${data.equipmentName}`,
    html: wrap(`
      <h2 style="margin:0 0 8px;color:#022742;font-size:22px;">Equipment Issued</h2>
      <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.6;">
        Hi <strong>${data.studentName}</strong>, the following equipment has been issued to you.
      </p>
      ${infoTable(
        infoRow("Equipment", data.equipmentName) +
        infoRow("Quantity", String(data.quantity)) +
        infoRow("Issued On", data.issuedAt) +
        infoRow("Due Date", `<strong style="color:#dc2626;">${data.dueDate}</strong>`) +
        infoRow("Lab", data.labName) +
        infoRow("Admin Contact", `<a href="mailto:${data.adminEmail}" style="color:#319f9a;text-decoration:none;">${data.adminEmail}</a> (${data.adminName})`)
      )}
      <p style="margin:20px 0 0;color:#475569;font-size:14px;line-height:1.6;">
        Please return the equipment by the due date. Late returns may affect your clearance status.
      </p>
    `),
  };
}

// ═══════════════════════════════════════════════════════════════
// 4. DROPOFF APPROVED
// ═══════════════════════════════════════════════════════════════
export function dropoffApprovedEmail(data: {
  studentName: string;
  equipmentName: string;
  quantity: number;
  dropoffTime: string;
  labName: string;
  adminName: string;
  adminEmail: string;
}): { subject: string; html: string } {
  return {
    subject: `🔄 Return Scheduled — ${data.equipmentName}`,
    html: wrap(`
      <h2 style="margin:0 0 8px;color:#022742;font-size:22px;">Return Scheduled</h2>
      <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.6;">
        Hi <strong>${data.studentName}</strong>, your return request has been approved. Please drop off the equipment at the scheduled time.
      </p>
      ${infoTable(
        infoRow("Equipment", data.equipmentName) +
        infoRow("Quantity", String(data.quantity)) +
        infoRow("Dropoff Date/Time", `<strong style="color:#022742;">${data.dropoffTime}</strong>`) +
        infoRow("Lab", data.labName) +
        infoRow("Lab Admin", data.adminName) +
        infoRow("Admin Email", `<a href="mailto:${data.adminEmail}" style="color:#319f9a;text-decoration:none;">${data.adminEmail}</a>`)
      )}
      <p style="margin:20px 0 0;color:#475569;font-size:14px;line-height:1.6;">
        Please arrive on time with the equipment in good condition.
      </p>
    `),
  };
}

// ═══════════════════════════════════════════════════════════════
// 5. RETURN COMPLETED
// ═══════════════════════════════════════════════════════════════
export function returnCompletedEmail(data: {
  studentName: string;
  equipmentName: string;
  quantity: number;
  returnedAt: string;
  labName: string;
}): { subject: string; html: string } {
  return {
    subject: `✅ Return Confirmed — ${data.equipmentName}`,
    html: wrap(`
      <h2 style="margin:0 0 8px;color:#022742;font-size:22px;">Return Confirmed</h2>
      <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.6;">
        Hi <strong>${data.studentName}</strong>, your equipment has been successfully returned.
      </p>
      ${infoTable(
        infoRow("Equipment", data.equipmentName) +
        infoRow("Quantity", String(data.quantity)) +
        infoRow("Returned On", data.returnedAt) +
        infoRow("Lab", data.labName)
      )}
      <p style="margin:20px 0 0;color:#475569;font-size:14px;line-height:1.6;">
        Thank you for returning the equipment on time!
      </p>
    `),
  };
}

// ═══════════════════════════════════════════════════════════════
// 6. DUE DATE REMINDER (1 day before)
// ═══════════════════════════════════════════════════════════════
export function dueDateReminderEmail(data: {
  studentName: string;
  equipmentName: string;
  quantity: number;
  dueDate: string;
  labName: string;
  adminName: string;
  adminEmail: string;
}): { subject: string; html: string } {
  return {
    subject: `⏰ Due Tomorrow — ${data.equipmentName}`,
    html: wrap(`
      <h2 style="margin:0 0 8px;color:#f59e0b;font-size:22px;">⏰ Return Reminder</h2>
      <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.6;">
        Hi <strong>${data.studentName}</strong>, this is a reminder that your equipment is due for return <strong>tomorrow</strong>.
      </p>
      ${infoTable(
        infoRow("Equipment", data.equipmentName) +
        infoRow("Quantity", String(data.quantity)) +
        infoRow("Due Date", `<strong style="color:#dc2626;">${data.dueDate}</strong>`) +
        infoRow("Lab", data.labName) +
        infoRow("Admin Contact", `<a href="mailto:${data.adminEmail}" style="color:#319f9a;text-decoration:none;">${data.adminEmail}</a> (${data.adminName})`)
      )}
      <p style="margin:20px 0 0;color:#475569;font-size:14px;line-height:1.6;">
        Please initiate a return request from your dashboard and return the equipment on time.
      </p>
    `),
  };
}

// ═══════════════════════════════════════════════════════════════
// 7. OVERDUE NOTICE
// ═══════════════════════════════════════════════════════════════
export function overdueNoticeEmail(data: {
  studentName: string;
  equipmentName: string;
  quantity: number;
  dueDate: string;
  daysOverdue: number;
  labName: string;
  adminName: string;
  adminEmail: string;
}): { subject: string; html: string } {
  return {
    subject: `🚨 OVERDUE (${data.daysOverdue} day${data.daysOverdue > 1 ? "s" : ""}) — ${data.equipmentName}`,
    html: wrap(`
      <h2 style="margin:0 0 8px;color:#dc2626;font-size:22px;">🚨 Equipment Overdue</h2>
      <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.6;">
        Hi <strong>${data.studentName}</strong>, the following equipment is <strong style="color:#dc2626;">${data.daysOverdue} day${data.daysOverdue > 1 ? "s" : ""} overdue</strong>. Please return it immediately.
      </p>
      ${infoTable(
        infoRow("Equipment", data.equipmentName) +
        infoRow("Quantity", String(data.quantity)) +
        infoRow("Was Due On", `<strong style="color:#dc2626;">${data.dueDate}</strong>`) +
        infoRow("Days Overdue", `<strong style="color:#dc2626;">${data.daysOverdue}</strong>`) +
        infoRow("Lab", data.labName) +
        infoRow("Admin Contact", `<a href="mailto:${data.adminEmail}" style="color:#319f9a;text-decoration:none;">${data.adminEmail}</a> (${data.adminName})`)
      )}
      <div style="margin:20px 0;padding:16px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;">
        <p style="margin:0;color:#991b1b;font-size:14px;font-weight:600;">
          ⚠️ Late returns may affect your graduation clearance and future borrowing privileges.
        </p>
      </div>
    `),
  };
}

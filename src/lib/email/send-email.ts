import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
) {
  try {
    await transporter.sendMail({
      from: `"ECE Lab IMS" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
    });
    console.log(`[EMAIL] Sent to ${to}: ${subject}`);
  } catch (error) {
    console.error(`[EMAIL] Failed to send to ${to}:`, error);
    // Don't throw — email failures should not block the main action
  }
}

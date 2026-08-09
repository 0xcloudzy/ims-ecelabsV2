import { isAllowedInstituteEmail } from "@/lib/auth/email-domain";
import type { UserRole } from "@/lib/auth/roles";
import { connectToDatabase } from "@/db/connect";
import { User } from "@/db/models/user";

type StaffRole = Exclude<UserRole, "student">;

export type ClassifiedUser =
  | {
      status: "student";
      role: "student";
      email: string;
    }
  | {
      status: "staff";
      role: StaffRole;
      email: string;
    }
  | {
      status: "invalid_domain";
      email: string;
    };

/**
 * Classify a user by email. Checks the database for existing staff records
 * (lab_admin, faculty_owner). If no staff record exists and the domain is
 * valid, the user is treated as a student.
 */
export async function classifyUserEmail(email: string): Promise<ClassifiedUser> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!isAllowedInstituteEmail(normalizedEmail)) {
    return {
      status: "invalid_domain",
      email: normalizedEmail,
    };
  }

  await connectToDatabase();

  const existingUser = await User.findOne(
    { email: normalizedEmail },
    { role: 1 },
  ).lean<{ role: string } | null>();

  if (existingUser && (existingUser.role === "lab_admin" || existingUser.role === "faculty_owner")) {
    return {
      status: "staff",
      role: existingUser.role as StaffRole,
      email: normalizedEmail,
    };
  }

  return {
    status: "student",
    role: "student",
    email: normalizedEmail,
  };
}
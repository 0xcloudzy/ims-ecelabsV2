import { isAllowedInstituteEmail } from "@/lib/auth/email-domain";
import type { UserRole } from "@/lib/auth/roles";

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

const PRE_APPROVED_STAFF: Record<string, StaffRole> = {
  // Temporary allowlist until this moves into MongoDB.
  // Example:
  // "faculty.email@iiitd.ac.in": "faculty_owner",
  // "lab.incharge@iiitd.ac.in": "lab_admin",
};

export function classifyUserEmail(email: string): ClassifiedUser {
  const normalizedEmail = email.trim().toLowerCase();

  if (!isAllowedInstituteEmail(normalizedEmail)) {
    return {
      status: "invalid_domain",
      email: normalizedEmail,
    };
  }

  const staffRole = PRE_APPROVED_STAFF[normalizedEmail];

  if (staffRole) {
    return {
      status: "staff",
      role: staffRole,
      email: normalizedEmail,
    };
  }

  return {
    status: "student",
    role: "student",
    email: normalizedEmail,
  };
}
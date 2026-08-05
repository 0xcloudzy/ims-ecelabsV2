export const USER_ROLES = ["student", "lab_admin", "faculty_owner"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export function getDashboardPathForRole(role: UserRole) {
  switch (role) {
    case "student":
      return "/student";
    case "lab_admin":
      return "/admin";
    case "faculty_owner":
      return "/owner";
  }
}

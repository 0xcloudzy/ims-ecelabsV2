export const DEFAULT_ALLOWED_EMAIL_DOMAIN = "iiitd.ac.in";

export function getAllowedEmailDomain() {
  return process.env.ALLOWED_EMAIL_DOMAIN ?? DEFAULT_ALLOWED_EMAIL_DOMAIN;
}

export function isAllowedInstituteEmail(email: string | null | undefined) {
  if (!email) {
    return false;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const allowedDomain = getAllowedEmailDomain().trim().toLowerCase();

  return normalizedEmail.endsWith(`@${allowedDomain}`);
}

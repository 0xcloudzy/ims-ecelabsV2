export type StudentEmailInfo = {
  email: string;
  namePart: string;
  shortRollNumber: string;
  rollNumber: string;
  admissionYear: number;
};

const STUDENT_EMAIL_PATTERN = /^([a-z][a-z0-9._-]*?)(\d{5})@iiitd\.ac\.in$/i;

export function parseStudentEmail(email: string): StudentEmailInfo | null {
  const normalizedEmail = email.trim().toLowerCase();
  const match = normalizedEmail.match(STUDENT_EMAIL_PATTERN);

  if (!match) {
    return null;
  }

  const [, namePart, shortRollNumber] = match;
  const admissionYear = Number(`20${shortRollNumber.slice(0, 2)}`);
  const rollNumber = `20${shortRollNumber}`;

  return {
    email: normalizedEmail,
    namePart,
    shortRollNumber,
    rollNumber,
    admissionYear,
  };
}
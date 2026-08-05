import { z } from "zod";
import { DEPARTMENTS, PROGRAMMES } from "@/db/models/user";

export const onboardingSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(120),
  rollNumber: z.string().trim().min(2, "Roll number / ID is required").max(40),
  phoneNumber: z.string().trim().min(8, "Phone number is too short").max(20),
  department: z.enum(DEPARTMENTS),
  programme: z.enum(PROGRAMMES),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

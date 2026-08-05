"use server";

import { auth } from "@/auth";
import { connectToDatabase } from "@/db/connect";
import { User } from "@/db/models/user";
import { onboardingSchema } from "@/lib/validation/onboarding";
import { redirect } from "next/navigation";

type MongoErrorLike = {
  code?: number;
  name?: string;
  message?: string;
};

function getSaveErrorCode(error: unknown) {
  const mongoError = error as MongoErrorLike;

  if (mongoError?.code === 11000) {
    return "duplicate-profile";
  }

  console.error("[onboarding] profile save failed", {
    name: mongoError?.name,
    code: mongoError?.code,
    message: mongoError?.message,
  });

  return "save-failed";
}

export async function saveOnboardingProfile(formData: FormData) {
  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();

  if (!session?.user || !email) {
    redirect("/");
  }

  const parsed = onboardingSchema.safeParse({
    fullName: formData.get("fullName"),
    rollNumber: formData.get("rollNumber"),
    phoneNumber: formData.get("phoneNumber"),
    department: formData.get("department"),
    programme: formData.get("programme"),
  });

  if (!parsed.success) {
    redirect("/onboarding?error=invalid-profile");
  }

  try {
    await connectToDatabase();

    await User.findOneAndUpdate(
      { email },
      {
        $set: {
          email,
          name: parsed.data.fullName,
          image: session.user.image,
          role: "student",
          isActive: true,
          studentProfile: {
            rollNumber: parsed.data.rollNumber,
            department: parsed.data.department,
            programme: parsed.data.programme,
            phoneNumber: parsed.data.phoneNumber,
          },
        },
      },
      {
        returnDocument: "after",
        runValidators: true,
        upsert: true,
      },
    );
  } catch (error) {
    redirect(`/onboarding?error=${getSaveErrorCode(error)}`);
  }

  redirect("/student");
}
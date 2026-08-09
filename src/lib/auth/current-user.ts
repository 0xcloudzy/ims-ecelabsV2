import { auth } from "@/auth";
import { connectToDatabase } from "@/db/connect";
import { User } from "@/db/models/user";
import { Lab } from "@/db/models/lab"; // Required for populate("assignedLab")
import { redirect } from "next/navigation";

export type CurrentAppUser = {
  _id: string;
  email: string;
  name: string;
  image?: string;
  role: "student" | "lab_admin" | "faculty_owner";
  isActive: boolean;
  studentProfile?: {
    rollNumber: string;
    department: string;
    programme: string;
    phoneNumber: string;
  };
  assignedLab?: string;
};

export async function getCurrentAppUser() {
  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();

  if (!email) {
    return null;
  }

  await connectToDatabase();

  const user = await User.findOne({ email }).lean<CurrentAppUser | null>();

  return user;
}

export async function requireStudentUser() {
  const user = await getCurrentAppUser();

  if (!user) {
    redirect("/onboarding");
  }

  if (!user.isActive) {
    redirect("/unauthorized");
  }

  if (user.role !== "student") {
    redirect("/unauthorized");
  }

  return user;
}

export async function requireAdminUser() {
  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();

  if (!email) {
    redirect("/");
  }

  await connectToDatabase();

  const user = await User.findOne({ email })
    .populate({ path: "assignedLab", model: Lab, select: "name code slug" })
    .lean<
      CurrentAppUser & {
        assignedLab?: { _id: string; name: string; code: string; slug: string };
      }
    >();

  if (!user) {
    redirect("/");
  }

  if (!user.isActive) {
    redirect("/unauthorized");
  }

  if (user.role !== "lab_admin") {
    redirect("/unauthorized");
  }

  return user;
}
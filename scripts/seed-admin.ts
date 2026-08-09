/**
 * Seed admin users into the users collection.
 *
 * Usage:
 *   npx tsx -r tsconfig-paths/register scripts/seed-admin.ts
 *
 * Run seed-labs.ts first so lab records exist.
 * Requires MONGODB_URI in .env.local
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import mongoose from "mongoose";
import { Lab } from "@/db/models/lab";
import { User } from "@/db/models/user";

type AdminSeed = {
  email: string;
  name: string;
  labCode: string;
};

const ADMINS: AdminSeed[] = [
  {
    email: "rahul@iiitd.ac.in",
    name: "Rahul Gupta",
    labCode: "304",
  },
  {
    email: "abhishek@iiitd.ac.in",
    name: "Abhishek Kumar",
    labCode: "303",
  },
  {
    email: "siddharth25492@iiitd.ac.in",
    name: "Siddharth Sharma",
    labCode: "301",
  },
];

async function main() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("MONGODB_URI is not set in .env.local");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  const labs = await Lab.find({ isActive: true }).lean<
    { _id: mongoose.Types.ObjectId; code: string; name: string }[]
  >();

  if (labs.length === 0) {
    console.error("No labs found. Run seed-labs.ts first.");
    await mongoose.disconnect();
    process.exit(1);
  }

  const labByCode = new Map(labs.map((lab) => [lab.code, lab]));

  for (const admin of ADMINS) {
    const lab = labByCode.get(admin.labCode);

    if (!lab) {
      console.error(`  ❌ Lab with code "${admin.labCode}" not found — skipping ${admin.email}`);
      continue;
    }

    const existing = await User.findOne({ email: admin.email });

    if (existing) {
      // Update role and lab assignment if the user already exists
      await User.updateOne(
        { email: admin.email },
        {
          $set: {
            role: "lab_admin",
            assignedLab: lab._id,
            name: admin.name,
            isActive: true,
          },
          $unset: { studentProfile: 1 },
        },
      );
      console.log(`  🔄 Updated "${admin.email}" → lab_admin for ${lab.name}`);
    } else {
      await User.create({
        email: admin.email,
        name: admin.name,
        role: "lab_admin",
        isActive: true,
        assignedLab: lab._id,
      });
      console.log(`  ✅ Created "${admin.email}" → lab_admin for ${lab.name}`);
    }
  }

  console.log("\nDone. Admin users seeded.");
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});

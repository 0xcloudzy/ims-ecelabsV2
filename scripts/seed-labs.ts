/**
 * Seed the labs collection with the 4 ECE labs.
 *
 * Usage:
 *   npx tsx -r tsconfig-paths/register scripts/seed-labs.ts
 *
 * Requires MONGODB_URI in .env.local
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import mongoose from "mongoose";
import { Lab } from "@/db/models/lab";

const LABS = [
  {
    name: "301-Basic Electronics Lab",
    code: "301",
    slug: "301-basic-electronics-lab",
    description: "Basic Electronics Lab in Room 301",
  },
  {
    name: "302-Basic Electronics Lab",
    code: "302",
    slug: "302-basic-electronics-lab",
    description: "Basic Electronics Lab in Room 302",
  },
  {
    name: "303-Basic Electronics Lab",
    code: "303",
    slug: "303-basic-electronics-lab",
    description: "Basic Electronics Lab in Room 303",
  },
  {
    name: "304-RF Lab",
    code: "304",
    slug: "304-rf-lab",
    description: "RF (Radio Frequency) Lab in Room 304",
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

  for (const lab of LABS) {
    const existing = await Lab.findOne({ code: lab.code });

    if (existing) {
      console.log(`  ⏭ Lab "${lab.name}" (code: ${lab.code}) already exists — skipped`);
      continue;
    }

    await Lab.create(lab);
    console.log(`  ✅ Created lab "${lab.name}" (code: ${lab.code})`);
  }

  console.log("\nDone. Labs seeded.");
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});

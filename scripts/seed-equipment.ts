/**
 * Seed sample equipment into each lab.
 *
 * Usage:
 *   npx tsx -r tsconfig-paths/register scripts/seed-equipment.ts
 *
 * Run seed-labs.ts first so lab records exist.
 * Requires MONGODB_URI in .env.local
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import mongoose from "mongoose";
import { Lab } from "@/db/models/lab";
import { Equipment } from "@/db/models/equipment";

type EquipmentSeed = {
  name: string;
  description: string;
  quantityTotal: number;
  type: string;
  link?: string;
};

const EQUIPMENT_BY_LAB_CODE: Record<string, EquipmentSeed[]> = {
  "301": [
    {
      name: "Digital Storage Oscilloscope",
      description: "4-channel, 100 MHz bandwidth digital oscilloscope for waveform analysis",
      quantityTotal: 15,
      type: "Instrument",
    },
    {
      name: "Function Generator",
      description: "Dual-channel arbitrary waveform generator, 20 MHz",
      quantityTotal: 15,
      type: "Instrument",
    },
    {
      name: "Breadboard Kit",
      description: "Solderless breadboard with jumper wire set",
      quantityTotal: 40,
      type: "Component Kit",
    },
    {
      name: "Digital Multimeter",
      description: "Bench-top digital multimeter with auto-ranging",
      quantityTotal: 20,
      type: "Instrument",
    },
    {
      name: "DC Power Supply",
      description: "Dual output regulated DC power supply, 0-30V / 0-5A",
      quantityTotal: 15,
      type: "Instrument",
    },
  ],
  "302": [
    {
      name: "Logic Analyzer",
      description: "16-channel logic analyzer for digital circuit debugging",
      quantityTotal: 10,
      type: "Instrument",
    },
    {
      name: "Resistor Assortment Kit",
      description: "1/4W carbon film resistors, 10Ω to 1MΩ (500 pcs)",
      quantityTotal: 30,
      type: "Component Kit",
    },
    {
      name: "Capacitor Assortment Kit",
      description: "Electrolytic and ceramic capacitors, assorted values",
      quantityTotal: 25,
      type: "Component Kit",
    },
    {
      name: "LCR Meter",
      description: "Handheld LCR meter for inductance, capacitance, and resistance measurement",
      quantityTotal: 10,
      type: "Instrument",
    },
    {
      name: "Soldering Station",
      description: "Temperature-controlled soldering station with ESD-safe iron",
      quantityTotal: 12,
      type: "Tool",
    },
  ],
  "303": [
    {
      name: "Arduino Uno R3",
      description: "ATmega328P-based development board with USB interface",
      quantityTotal: 30,
      type: "Development Board",
    },
    {
      name: "Raspberry Pi 4 Model B",
      description: "4GB RAM single-board computer for embedded projects",
      quantityTotal: 15,
      type: "Development Board",
    },
    {
      name: "Sensor Kit",
      description: "37-in-1 sensor module kit (temperature, IR, ultrasonic, etc.)",
      quantityTotal: 20,
      type: "Component Kit",
    },
    {
      name: "FPGA Development Board",
      description: "Xilinx Spartan-7 FPGA board for digital design experiments",
      quantityTotal: 10,
      type: "Development Board",
    },
    {
      name: "IC Trainer Kit",
      description: "Trainer board with breadboard, IC sockets, and built-in power supply",
      quantityTotal: 15,
      type: "Trainer",
    },
    {
      name: "Oscilloscope Probe Set",
      description: "Passive probes, 1x/10x switchable, 200 MHz",
      quantityTotal: 20,
      type: "Accessory",
    },
  ],
  "304": [
    {
      name: "Spectrum Analyzer",
      description: "9 kHz to 3 GHz spectrum analyzer for RF signal analysis",
      quantityTotal: 5,
      type: "Instrument",
    },
    {
      name: "Vector Network Analyzer",
      description: "2-port VNA, 100 kHz to 6 GHz for S-parameter measurement",
      quantityTotal: 3,
      type: "Instrument",
    },
    {
      name: "RF Signal Generator",
      description: "Analog/digital modulation signal generator, 9 kHz to 3 GHz",
      quantityTotal: 5,
      type: "Instrument",
    },
    {
      name: "SMA Connector Kit",
      description: "SMA male/female connectors and adapters assortment",
      quantityTotal: 20,
      type: "Accessory",
    },
    {
      name: "Antenna Trainer Kit",
      description: "Dipole, Yagi, and patch antenna set for radiation pattern experiments",
      quantityTotal: 6,
      type: "Trainer",
    },
    {
      name: "Coaxial Cable Set",
      description: "RG-58 and RG-174 coaxial cables with BNC/SMA terminators",
      quantityTotal: 15,
      type: "Accessory",
    },
  ],
};

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

  let created = 0;
  let skipped = 0;

  for (const lab of labs) {
    const equipmentList = EQUIPMENT_BY_LAB_CODE[lab.code];

    if (!equipmentList) {
      console.log(`  ⏭ No seed equipment defined for lab "${lab.name}" (${lab.code})`);
      continue;
    }

    console.log(`\n  📦 Lab: ${lab.name} (${lab.code})`);

    for (const item of equipmentList) {
      const existing = await Equipment.findOne({
        name: item.name,
        lab: lab._id,
        isDeleted: false,
      });

      if (existing) {
        console.log(`    ⏭ "${item.name}" already exists — skipped`);
        skipped++;
        continue;
      }

      await Equipment.create({
        ...item,
        lab: lab._id,
        quantityAvailable: item.quantityTotal,
        isActive: true,
        isDeleted: false,
      });

      console.log(`    ✅ "${item.name}" (qty: ${item.quantityTotal})`);
      created++;
    }
  }

  console.log(`\nDone. Created ${created}, skipped ${skipped}.`);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});

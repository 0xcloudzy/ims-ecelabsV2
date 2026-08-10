import { model, models, Schema, Types } from "mongoose";
import { USER_ROLES } from "@/lib/auth/roles";

export const DEPARTMENTS = [
  "cse",
  "cb",
  "mathematics",
  "design",
  "ece",
  "ssh",
] as const;

export const PROGRAMMES = ["btech", "mtech", "phd", "organisation"] as const;

export type Department = (typeof DEPARTMENTS)[number];
export type Programme = (typeof PROGRAMMES)[number];

const studentProfileSchema = new Schema(
  {
    rollNumber: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      enum: DEPARTMENTS,
      required: true,
    },
    programme: {
      type: String,
      enum: PROGRAMMES,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    duesClearance: {
      isCleared: {
        type: Boolean,
        default: false,
      },
      clearedAt: Date,
      clearedBy: {
        type: Types.ObjectId,
        ref: "User",
      },
    },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
    },
    role: {
      type: String,
      enum: USER_ROLES,
      required: true,
      default: "student",
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    studentProfile: {
      type: studentProfileSchema,
      default: undefined,
    },
    assignedLab: {
      type: Types.ObjectId,
      ref: "Lab",
      default: undefined,
    },
  },
  {
    collection: "users",
    timestamps: true,
  },
);

userSchema.index({ "studentProfile.rollNumber": 1 }, { unique: true, sparse: true });
userSchema.index({ role: 1, isActive: 1 });

export const User = models.User || model("User", userSchema);

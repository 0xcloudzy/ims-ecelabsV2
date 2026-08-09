import { model, models, Schema } from "mongoose";

const labSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  {
    collection: "labs",
    timestamps: true,
  },
);

labSchema.index({ isActive: 1 });

export const Lab = models.Lab || model("Lab", labSchema);
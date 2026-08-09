import { model, models, Schema, Types } from "mongoose";

const equipmentSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    lab: {
      type: Types.ObjectId,
      ref: "Lab",
      required: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    quantityTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    quantityAvailable: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      required: true,
      trim: true,
    },
    link: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      required: true,
      default: false,
    },
    createdBy: {
      type: Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: Types.ObjectId,
      ref: "User",
    },
  },
  {
    collection: "equipment",
    timestamps: true,
  },
);

equipmentSchema.index({ lab: 1, isDeleted: 1 });
equipmentSchema.index({ type: 1 });
equipmentSchema.index({ name: "text", description: "text", type: "text" });

export const Equipment = models.Equipment || model("Equipment", equipmentSchema);
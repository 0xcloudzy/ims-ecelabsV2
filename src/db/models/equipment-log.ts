import { model, models, Schema, Types } from "mongoose";

const equipmentLogSchema = new Schema(
  {
    equipment: {
      type: Types.ObjectId,
      ref: "Equipment",
      required: true,
    },
    action: {
      type: String,
      enum: ["created", "updated", "deleted", "restored"],
      required: true,
    },
    changedBy: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    changes: {
      type: Schema.Types.Mixed,
      default: {},
    },
    note: {
      type: String,
      trim: true,
    },
  },
  {
    collection: "equipment_logs",
    timestamps: true,
  },
);

equipmentLogSchema.index({ equipment: 1, createdAt: -1 });
equipmentLogSchema.index({ changedBy: 1 });

export const EquipmentLog =
  models.EquipmentLog || model("EquipmentLog", equipmentLogSchema);

import { model, models, Schema, Types } from "mongoose";

export const TRANSACTION_STATUSES = [
  "requested",
  "approved_for_pickup",
  "issued",
  "return_requested",
  "approved_for_dropoff",
  "completed",
  "declined",
  "cancelled",
] as const;

export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

const transactionSchema = new Schema(
  {
    student: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    equipment: {
      type: Types.ObjectId,
      ref: "Equipment",
      required: true,
    },
    lab: {
      type: Types.ObjectId,
      ref: "Lab",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: TRANSACTION_STATUSES,
      required: true,
      default: "requested",
    },
    requestedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    requestedDays: {
      type: Number,
      required: true,
      min: 1,
    },
    dueDate: {
      type: Date,
      // No longer required on creation; calculated when 'issued'
    },
    pickupTime: Date,
    dropoffTime: Date,
    issuedAt: Date,
    decidedAt: Date,
    returnRequestedAt: Date,
    returnedAt: Date,
    cancelledAt: Date,
    studentComment: {
      type: String,
      trim: true,
    },
    adminComment: {
      type: String,
      trim: true,
    },
    decidedBy: {
      type: Types.ObjectId,
      ref: "User",
    },
  },
  {
    collection: "transactions",
    timestamps: true,
  },
);

transactionSchema.index({ student: 1, status: 1 });
transactionSchema.index({ lab: 1, status: 1, requestedAt: -1 });
transactionSchema.index({ equipment: 1, status: 1 });
transactionSchema.index({ dueDate: 1, status: 1 });

export const Transaction =
  models.Transaction || model("Transaction", transactionSchema);
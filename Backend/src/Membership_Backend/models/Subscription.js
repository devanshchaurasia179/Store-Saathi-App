import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Member",
    required: true,
  },

  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MembershipPlan",
    required: true,
  },

  startDate: {
    type: Date,
    default: Date.now,
  },

  expiryDate: {
    type: Date,
  },

  status: {
    type: String,
    enum: ["ACTIVE", "EXPIRED", "CANCELLED"],
    default: "ACTIVE",
  },

  paymentStatus: {
    type: String,
    enum: ["PAID", "PENDING"],
    default: "PAID",
  },

  amountPaid: {
    type: Number,
  },

}, { timestamps: true });

export default mongoose.model("Subscription", subscriptionSchema);
import mongoose from "mongoose";

const membershipPlanSchema = new mongoose.Schema({
  name: {
    type: String, // Free, Basic, Pro
    required: true,
  },

  price: {
    type: Number, // in ₹
    required: true,
  },
  duration:{
    type: Number,
    required:true,
  },
  billingCycle: {
    type: String,
    enum: ["DAYS","MONTH", "YEAR", "LIFETIME"],
    default: "MONTH",
  },

  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

export default mongoose.model("MembershipPlan", membershipPlanSchema);
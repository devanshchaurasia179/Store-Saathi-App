import mongoose from "mongoose";

const membershipEntrySchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },

    membershipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Membership",
      index: true,
    },

    name: {
      type: String,
      trim: true,
    },

    code: {
      type: String,
      trim: true,
      uppercase: true,
    },

    amount: {
      type: Number,
      default: 0,
    },

    startDate: {
      type: Date,
    },

    expiryDate: {
      type: Date,
    },

    action: {
      type: String,
      enum: ["created", "renewed", "cancelled", "expired"],
      required: true,
      index: true,
    },

    actionDate: {
      type: Date,
      default: Date.now,
      index: true,
    },

    note: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Useful indexes for reports
membershipEntrySchema.index({ shopId: 1, actionDate: -1 });
membershipEntrySchema.index({ customerId: 1, actionDate: -1 });

export default mongoose.model("MembershipEntry", membershipEntrySchema);

import mongoose from "mongoose";

const membershipSchema = new mongoose.Schema(
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
      unique: true, // one active membership per customer
      index: true,
    },

    name: {
      type: String,
      trim: true,
      required: true,
    },

    code: {
      type: String,
      trim: true,
      unique: true,
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      default: 0,
    },

    startDate: {
      type: Date,
      required: true,
    },

    expiryDate: {
      type: Date,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Membership", membershipSchema);

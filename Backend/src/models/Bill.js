import mongoose from "mongoose";

/* -----------------------------------
   BILL ITEM SCHEMA (VARIANT-AWARE)
----------------------------------- */
const billItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    // 🔥 NEW — REQUIRED FOR VARIANT ANALYTICS
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null, // null = no variant (base product)
    },

    name: {
      type: String,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
    },

    unit: {
      type: String,
      enum: ["unit", "kg", "g", "litre", "ml", "box", "pack", "dozen"],
      default: "unit", // ✅ SAFE FALLBACK
    },

    price: {
      type: Number,
      required: true,
    },

    total: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

/* -----------------------------------
   BILL SCHEMA
----------------------------------- */
const billSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },

    // ✅ DAILY BILL NUMBER (resets every day per shop)
    dailyBillNumber: {
      type: Number,
      required: true,
      index: true,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },

    items: {
      type: [billItemSchema],
      required: true,
    },

    subTotal: {
      type: Number,
      required: true,
    },

    discount: {
      type: Number,
      default: 0,
    },

    taxPercentage: {
      type: Number,
      default: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    paidAmount: {
      type: Number,
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ["PAID", "PARTIAL", "UNPAID"],
      required: true,
    },

    paymentMode: {
      type: String,
      enum: ["CASH", "UPI", "CARD", "NONE"],
      default: "NONE",
    },
  },
  { timestamps: true }
);

/* -----------------------------------
   INDEXES
----------------------------------- */

// 🔒 Prevent duplicate bill numbers per shop per day
billSchema.index(
  { shopId: 1, dailyBillNumber: 1, createdAt: 1 },
  { unique: false }
);

const Bill = mongoose.model("Bill", billSchema);
export default Bill;

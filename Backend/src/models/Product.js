import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    barcode: {
      type: String,
      index: true,
      required: true,
    },

    isBarcodeListed: {
      type: Boolean,
      default: false,
      index: true,
    },

    category: {
      type: String,
      default: "Other",
      trim: true,
    },

    size: {
      type: String,
      default: "",
      trim: true,
    },

    /** 🆕 UNIT FIELD */
    unit: {
      type: String,
      enum: ["pcs", "kg", "g", "litre", "ml", "box", "pack"],
      default: "pcs",
      index: true,
    },

    price: {
      sellingPrice: {
        type: Number,
        required: true,
        min: 0,
      },
    },

    quantity: {
      type: Number,
      default: 0,
      min: 0,
    },

    expiryDate: {
      type: Date,
      default: null,
    },

    isTrackable: {
      type: Boolean,
      default: true,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate barcode per shop
productSchema.index(
  { shopId: 1, barcode: 1 },
  {
    unique: true,
    partialFilterExpression: {
      barcode: { $type: "string" },
    },
  }
);

const Product = mongoose.model("Product", productSchema);
export default Product;

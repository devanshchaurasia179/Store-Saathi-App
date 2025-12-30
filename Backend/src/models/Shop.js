import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const shopSchema = new mongoose.Schema(
  {
    shopName: {
      type: String,
      required: true,
      trim: true,
    },

    ownerName: {
      type: String,
      required: true,
      trim: true,
    },

    mobileNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    gstNumber: {
      type: String,
      default: "",
      trim: true,
    },

    storeCategory: {
      type: String,
      default: "Kirana",
    },

    // ✅ NEW: UPI ID
    upiId: {
      type: String,
      default: "",
      trim: true,
    },

    // ✅ NEW: LOCATION (simple string)
    location: {
      type: String,
      default: "",
      trim: true,
    },

    // OTP AUTH
    otp: {
      type: String, // hashed OTP
      select: false,
    },

    otpExpiresAt: {
      type: Date,
      select: false,
    },

    isOnboarded: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Hash OTP before saving
shopSchema.pre("save", async function () {
  if (!this.isModified("otp") || !this.otp) return;

  const salt = await bcrypt.genSalt(10);
  this.otp = await bcrypt.hash(this.otp, salt);
});

// Verify OTP
shopSchema.methods.verifyOtp = async function (enteredOtp) {
  if (!this.otp || !this.otpExpiresAt) return false;
  if (this.otpExpiresAt < new Date()) return false;

  const isOtpCorrect = await bcrypt.compare(enteredOtp, this.otp);

  if (isOtpCorrect) {
    this.otp = undefined;
    this.otpExpiresAt = undefined;
    await this.save();
  }

  return isOtpCorrect;
};

const Shop = mongoose.model("Shop", shopSchema);
export default Shop;

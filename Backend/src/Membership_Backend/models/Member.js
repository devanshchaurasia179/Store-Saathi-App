import mongoose from "mongoose";

const memberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  phone: {
    type: String,
    required: true,
    unique: true, // important for identification
  },

  email: {
    type: String,
  },

  address: {
    type: String,
  },

  isActive: {
    type: Boolean,
    default: true,
  },

}, { timestamps: true });

export default mongoose.model("Member", memberSchema);
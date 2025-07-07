// models/User.js
import mongoose from "mongoose";

// ⬇️ Define the subscription structure
const subscriptionSchema = new mongoose.Schema({
  startDate: Date,
  endDate: Date,
  isActive: {
    type: Boolean,
    default: false,
  },
});

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true, // ✅ Prevent duplicate phone
      match: /^[6-9]\d{9}$/, // ✅ Valid 10-digit Indian mobile number starting from 6-9
    },
    email: {
      type: String,
      required: true,
      unique: true, // ✅ Prevent duplicate email
      lowercase: true,
      match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, // ✅ Basic email validation
    },
    password: {
      type: String,
      required: true,
    },
    subscription: {
      type: subscriptionSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true, // createdAt and updatedAt fields
  }
);

// ✅ Improve performance by indexing unique fields
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phone: 1 }, { unique: true });

export default mongoose.model("User", userSchema);
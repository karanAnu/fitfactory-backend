// authController.js
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { sendOTP } from "../utils/sendOTP.js";

// ✅ Temporary storage of logged-in users
export const loggedInUsers = [];

const otpStore = {};

// 📩 Signup
export const signup = async (req, res) => {
  const { name, phone, email, password } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000);
  otpStore[email] = { otp, name, phone, password };

  try {
    await sendOTP(email, otp);
    res.status(200).json({ message: "OTP sent to email", email });
  } catch (err) {
    res.status(500).json({ message: "Failed to send OTP", error: err.message });
  }
};

// ✅ Verify OTP
export const verifyOTP = async (req, res) => {
  const { name, phone, email, password, otp } = req.body;
  const stored = otpStore[email];

  if (!stored || parseInt(otp) !== stored.otp) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const newUser = new User({ name, phone, email, password });
    await newUser.save();
    delete otpStore[email];

    res.status(201).json({ message: "Signup successful" });
  } catch (err) {
    res.status(500).json({ message: "Signup failed", error: err.message });
  }
};

// 🔐 Login
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "Email & password required" });

  try {
    const user = await User.findOne({ email });

    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || "your_jwt_secret",
      { expiresIn: "1h" }
    );

    // ✅ Save to loggedInUsers if not already
    const already = loggedInUsers.some((u) => u.email === user.email);
    if (!already) {
      loggedInUsers.push({
        name: user.name,
        email: user.email,
        phone: user.phone,
      });
    }

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        name: user.name,
        email: user.email,
        _id: user._id,
        subscription: user.subscription,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
};
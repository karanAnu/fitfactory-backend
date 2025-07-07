// routes/auth.js
import express from "express";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/User.js";
import Otp from "../models/Otp.js";

dotenv.config();
const router = express.Router();

// 🔢 Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// 📧 Email Config (Gmail SMTP)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

/* -------------------------------------------------------------------------- */
/* 🟡 1. SIGNUP - Send OTP                                                    */
/* -------------------------------------------------------------------------- */
router.post("/signup", async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !phone || !password) {
    return res.status(400).json({ success: false, message: "All fields are required." });
  }

  try {
    const existingEmail = await User.findOne({ email });
    if (existingEmail)
      return res.status(409).json({ success: false, message: "Email already registered. Please login." });

    const existingPhone = await User.findOne({ phone });
    if (existingPhone)
      return res.status(409).json({ success: false, message: "Phone number already registered." });

    await Otp.deleteMany({ email });

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min validity

    await Otp.create({ email, otp, expiresAt });

    const mailOptions = {
      from: `"FitFactory 🔐" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Your FitFactory OTP Code",
      html: `
        <h2>Welcome to FitFactory 🏋️‍♂️</h2>
        <p>Hi <b>${name}</b>,</p>
        <p>Your OTP is: <b>${otp}</b></p>
        <p>This OTP will expire in 5 minutes.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ OTP sent to:", email, "OTP:", otp);

    res.status(200).json({ success: true, message: "OTP sent to your email ✅" });
  } catch (err) {
    console.error("❌ Signup error:", err.message);
    res.status(500).json({ success: false, message: "Error sending OTP." });
  }
});

/* -------------------------------------------------------------------------- */
/* 🟢 2. VERIFY OTP & REGISTER USER                                           */
/* -------------------------------------------------------------------------- */
router.post("/verify-otp", async (req, res) => {
  const { name, email, phone, password, otp } = req.body;

  try {
    const otpDoc = await Otp.findOne({ email });
    if (!otpDoc)
      return res.status(400).json({ success: false, message: "No OTP request found for this email." });

    if (otpDoc.expiresAt < new Date()) {
      await Otp.deleteOne({ email });
      return res.status(400).json({ success: false, message: "OTP has expired. Please try again." });
    }

    if (otpDoc.otp !== otp)
      return res.status(400).json({ success: false, message: "Invalid OTP. Please try again." });

    const existingEmail = await User.findOne({ email });
    if (existingEmail)
      return res.status(400).json({ success: false, message: "Email already registered." });

    const existingPhone = await User.findOne({ phone });
    if (existingPhone)
      return res.status(400).json({ success: false, message: "Phone number already registered." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name, email, phone, password: hashedPassword });

    await Otp.deleteOne({ email });
    console.log("✅ User created:", email);

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: "2h" });

    res.status(200).json({
      success: true,
      message: "Signup complete! 🎉",
      token,
      userId: newUser._id,
      name: newUser.name,
    });
  } catch (err) {
    console.error("❌ OTP Verification error:", err.message);
    res.status(500).json({ success: false, message: "Signup failed." });
  }
});

/* -------------------------------------------------------------------------- */
/* 🔐 3. LOGIN                                                                */
/* -------------------------------------------------------------------------- */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ success: false, message: "Invalid credentials." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: "Invalid credentials." });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "2h" });

    res.status(200).json({
      success: true,
      message: "Login successful ✅",
      token,
      userId: user._id,
      name: user.name,
    });
  } catch (err) {
    console.error("❌ Login error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* -------------------------------------------------------------------------- */
/* 🔁 4. FORGOT PASSWORD - Send OTP                                           */
/* -------------------------------------------------------------------------- */
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email)
    return res.status(400).json({ success: false, message: "Email is required" });

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await Otp.deleteMany({ email });
    await Otp.create({ email, otp, expiresAt });

    const mailOptions = {
      from: `"FitFactory Support" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Your Password Reset OTP",
      html: `
        <h3>🔑 Password Reset Request</h3>
        <p>Your OTP is: <b>${otp}</b></p>
        <p>This OTP expires in 5 minutes.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("🔁 Forgot password OTP sent to:", email);

    res.json({ success: true, message: "OTP sent to your email" });
  } catch (err) {
    console.error("❌ Forgot Password Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* -------------------------------------------------------------------------- */
/* 🔄 5. RESET PASSWORD - Verify OTP and update password                      */
/* -------------------------------------------------------------------------- */
router.post("/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ success: false, message: "All fields are required." });
  }

  try {
    const otpDoc = await Otp.findOne({ email });
    if (!otpDoc)
      return res.status(400).json({ success: false, message: "No OTP found for this email." });

    if (otpDoc.expiresAt < new Date()) {
      await Otp.deleteOne({ email });
      return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
    }

    if (otpDoc.otp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.updateOne({ email }, { password: hashedPassword });
    await Otp.deleteOne({ email });

    console.log("🔐 Password reset for:", email);
    res.json({ success: true, message: "Password has been reset successfully ✅" });
  } catch (err) {
    console.error("❌ Reset Password Error:", err.message);
    res.status(500).json({ success: false, message: "Password reset failed." });
  }
});

/* -------------------------------------------------------------------------- */
/* 🆕 6. ADMIN - GET USER BY EMAIL (used in Admin Panel)                      */
/* -------------------------------------------------------------------------- */
router.get("/user-by-email", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.json(user);
  } catch (err) {
    console.error("❌ Get user by email error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
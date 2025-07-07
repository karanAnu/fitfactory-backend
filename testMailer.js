import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  debug: true,
});

const mailOptions = {
  from: `FitFactory <${process.env.MAIL_USER}>`,
  to: "karanmahato7541@gmail.com", // ✅ Yahan apna email daalo
  subject: "Testing OTP from FitFactory",
  html: `<h3>This is a test email 📧</h3><p>If you receive this, your setup is correct.</p>`,
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.log("❌ Mail error:", error);
  } else {
    console.log("✅ Mail sent:", info.response);
  }
});
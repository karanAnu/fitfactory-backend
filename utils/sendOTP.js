import nodemailer from "nodemailer";

export const sendOTP = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `"FitFactory 👟" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: "Your FitFactory OTP Code",
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Hey Champ 💪</h2>
          <p>Your OTP for FitFactory is:</p>
          <h1 style="color: #1e40af;">${otp}</h1>
          <p>Valid for 10 minutes.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ OTP sent to:", email);
  } catch (error) {
    console.error("❌ OTP sending failed:", error);
    throw error;
  }
};
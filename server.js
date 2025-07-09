import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

// ✅ Load env variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ CORS setup (fixed for Vercel)
const corsOptions = {
  origin: [
    "https://fitfactory-frontend.vercel.app",  // ✅ Vercel - User Website
    "https://fitfactory-admin.vercel.app",     // ✅ Vercel - Admin Panel
    "http://localhost:5173",                   // ✅ Local dev
  ],
  credentials: true,
};
app.use(cors(corsOptions));

// ✅ Middleware
app.use(express.json()); // ✅ Parse JSON

// ✅ Route Imports
import contactRoutes from "./routes/contactRoute.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js"; // 🆕 User/subscription routes

// ✅ API Routes
app.use("/api/contact", contactRoutes);
app.use("/api/auth", authRoutes);       // 🔐 Auth (signup/login/otp)
app.use("/api/users", userRoutes);      // 👤 User routes (subscription, profile etc.)

// ✅ Test Route
app.get("/", (req, res) => {
  res.send("✅ FitFactory backend is live!");
});

// ✅ MongoDB + Start Server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected successfully");
    app.listen(PORT, () =>
      console.log(`🚀 Server running at http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1); // Exit process on failure
  });
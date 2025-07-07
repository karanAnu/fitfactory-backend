import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

// ✅ Load env variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Route Imports
import contactRoutes from "./routes/contactRoute.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js"; // 🆕 User/subscription routes

// ✅ Allowed frontend origins (localhost + vercel)
const allowedOrigins = [
  "http://localhost:5173",                       // React (Vite)
  "http://127.0.0.1:5500",                       // Live Server (HTML)
  "http://localhost:5500",
  "https://fitfactory-frontend.vercel.app",     // ✅ Vercel - User Website
  "https://fitfactory-admin.vercel.app",        // ✅ Vercel - Admin Panel
];

// ✅ CORS setup
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("❌ Not allowed by CORS: " + origin));
      }
    },
    credentials: true,
  })
);

// ✅ Middleware
app.use(express.json()); // ✅ Parse JSON

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
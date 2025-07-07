import express from "express";
import User from "../models/User.js";
import { loggedInUsers } from "../controllers/authController.js";

const router = express.Router();

// ✅ Admin: Get all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    console.error("❌ Get All Users Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
});

// ✅ Admin: Update subscription info
router.put("/update-subscription/:userId", async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const isActive = new Date(endDate) > new Date();

    const updatedUser = await User.findByIdAndUpdate(
      req.params.userId,
      {
        subscription: {
          startDate,
          endDate,
          isActive,
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("❌ Update Subscription Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to update subscription" });
  }
});

// ✅ Get single user info
router.get("/get-user/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error("❌ Get User Error:", error.message);
    res.status(500).json({ success: false, message: "Server error while fetching user" });
  }
});

// ✅ Admin: Get currently logged-in users
router.get("/admin/loggedin-users", (req, res) => {
  try {
    res.json(loggedInUsers);
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch logged-in users" });
  }
});

export default router;
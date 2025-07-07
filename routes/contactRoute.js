import express from "express";
import Contact from "../models/Contact.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    const newMessage = new Contact({ name, email, phone, message });
    await newMessage.save();
    res.status(200).json({ message: "Message received!" });
  } catch (err) {
    res.status(500).json({ error: "Error saving message" });
  }
});

export default router;
import express from "express";
import User from "../models/User.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

/* =============== GET PROFILE =============== */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "name email role profile"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

/* =============== UPDATE PROFILE =============== */
router.post("/", authMiddleware, async (req, res) => {
  const userId = req.user.id;

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { profile: req.body },
    { new: true }
  );

  res.json({
    message: "Profile updated successfully",
    profile: updatedUser.profile
  });
});

export default router;
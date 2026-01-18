import express from "express";
import User from "../models/User.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

/* =============== GET PROFILE =============== */
router.get("/", authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id).select("profile role");

  res.json(user);
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
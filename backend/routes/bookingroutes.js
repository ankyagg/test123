import express from "express";
import { bookSlot, getMyBookings } from "../controllers/bookingController.js";

const router = express.Router();

// Book a slot
router.post("/book", bookSlot);

// Get my bookings
router.get("/my/:userId", getMyBookings);

export default router;

import Booking from "../models/booking.js";
import User from "../models/User.js";
import { google } from "googleapis";
import fs from "fs";
import path from "path";
import { createEvent as oauthCreateEvent } from "../utils/googleCalendar.js";
import dotenv from "dotenv";
import { sendEmail } from "../utils/sendEmail.js"

dotenv.config();

// Note: service-account auth is created when needed inside createCalendarEvent

// 🔹 Helper to create calendar event
async function createCalendarEvent({ startTime, endTime, mentor, student }) {
  const event = {
    summary: `Mentorship: ${student.name} → ${mentor.name}`,
    description: `1-on-1 mentorship session\nMentor: ${mentor.name}\nStudent: ${student.name}`,
    start: { dateTime: new Date(startTime).toISOString() },
    end: { dateTime: new Date(endTime).toISOString() },
  };

  // Try service-account key if present
  try {
    const candidates = [
      path.resolve(process.cwd(), "config", "google-service.json"),
      path.resolve(process.cwd(), "backend", "config", "google-service.json"),
      path.resolve(process.cwd(), "backend", "google-service.json"),
    ];
    let keyPath = null;
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        keyPath = p;
        break;
      }
    }
    if (keyPath) {
      const auth = new google.auth.GoogleAuth({
        keyFile: keyPath,
        scopes: ["https://www.googleapis.com/auth/calendar"],
      });
      const svcCal = google.calendar({ version: "v3", auth });
      const res = await svcCal.events.insert({
        calendarId: process.env.GOOGLE_CALENDAR_ID || "primary",
        requestBody: event,
      });
      return { link: res.data.htmlLink || null, error: null };
    }
  } catch (err) {
    const msg = err?.response?.data || err.message || String(err);
    console.error("Service-account calendar error:", msg);
    // continue to try OAuth flow
  }

  // Fallback: try OAuth token flow (token.json + client creds)
  try {
    const result = await oauthCreateEvent({
      summary: event.summary,
      description: event.description,
      start: event.start.dateTime,
      end: event.end.dateTime,
    });
    const htmlLink = result?.htmlLink || result?.htmlLink || (result && result.data && result.data.htmlLink) || null;
    return { link: htmlLink, error: null };
  } catch (err) {
    const msg = err?.response?.data || err.message || String(err);
    console.error("OAuth calendar error:", msg);
    return { link: null, error: msg };
  }
}

// 🔹 Book a mentor slot
export const bookSlot = async (req, res) => {
  try {
    const { mentorId, studentId, startTime, endTime } = req.body;

    const mentor = await User.findOne({ _id: mentorId, role: "alumni" });
    if (!mentor) return res.status(404).json({ message: "Mentor not found" });

    const student = await User.findOne({ _id: studentId, role: "student" });
    if (!student) return res.status(404).json({ message: "Student not found" });

    const conflict = await Booking.findOne({
      mentor: mentorId,
      status: "booked",
      $or: [
        { startTime: { $lt: endTime, $gte: startTime } },
        { endTime: { $gt: startTime, $lte: endTime } },
      ],
    });

    if (conflict) {
      return res.status(409).json({ message: "Slot already booked" });
    }

    // 🔹 Create Google Calendar event FIRST
    const { link: calendarEventLink, error: calendarError } = await createCalendarEvent({
      startTime,
      endTime,
      mentor,
      student,
    });

    if (!calendarEventLink) {
      console.error("Calendar creation failed for booking:", calendarError);
      return res.status(500).json({ message: "Calendar event creation failed", error: calendarError });
    }

    // 🔹 Save booking only if calendar worked
    const booking = new Booking({
      mentor: mentorId,
      student: studentId,
      startTime,
      endTime,
      calendarEventLink,
    });

    await booking.save();
    
    await sendEmail(
      "zoya2432006@gmail.com", // fixed email
      "Mentorship Session Booked!",
      `Hello Shweta,
A mentorship session has been booked.
Mentor: ${mentor.name}
Student: ${student.name}
Start: ${new Date(startTime).toLocaleString()}
End: ${new Date(endTime).toLocaleString()}

View event: ${calendarEventLink}`
    );

    res.status(201).json({
      message: "Slot booked successfully",
      booking,
      calendarEventLink,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Booking failed", error: err.message });
  }
};


// 🔹 Get bookings for a user
export const getMyBookings = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const query = user.role === "student" ? { student: userId } : user.role === "alumni" ? { mentor: userId } : null;
    if (!query) return res.status(403).json({ message: "Access denied" });

    const bookings = await Booking.find(query)
      .populate("mentor", "name email")
      .populate("student", "name email")
      .sort({ startTime: 1 });

    res.json(bookings);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
};

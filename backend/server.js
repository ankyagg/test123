import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import mentorRoutes from "./routes/mentor.js";
import repositoryRoutes from "./routes/repository.routes.js";
import bookingRoutes from "./routes/bookingroutes.js";
import http from "http";
import { Server } from "socket.io";
import leaderboardRoutes from "./routes/mentor.js";
import careerPathRoutes from "./routes/careerPathRoutes.js";



dotenv.config();
// If the service account JSON is provided as an env var, write it to a secure file
if (process.env.GOOGLE_SERVICE_JSON) {
  try {
    const keyPath = path.resolve(process.cwd(), "backend", "config", "google-service.json");
    const dir = path.dirname(keyPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(keyPath, process.env.GOOGLE_SERVICE_JSON, { mode: 0o600 });
    // Ensure Google client libraries can pick it up if code references GOOGLE_APPLICATION_CREDENTIALS
    process.env.GOOGLE_APPLICATION_CREDENTIALS = keyPath;
    console.log("Wrote GOOGLE_SERVICE_JSON to", keyPath);
  } catch (err) {
    console.error("Failed to write GOOGLE_SERVICE_JSON to disk:", err?.message || err);
  }
}

dotenv.config();
const app = express();

// Connect to Database
connectDB();


app.use(
  cors({
    origin: "*",
    credentials: false
  })
);

app.use(express.json());

// Route Definitions
app.use("/auth", authRoutes);
app.use("/profile", profileRoutes);

app.use("/repository", repositoryRoutes);


app.use("/api/bookings", bookingRoutes);
app.use("/api/mentors", mentorRoutes);
app.use("/api/career-paths", careerPathRoutes);

app.get("/", (req, res) => {
  res.send("Backend running");
});
// --- Setup HTTP server + Socket.io ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" } // adjust if you have frontend URL
});

// Socket.io real-time logic
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join a room (e.g., mentor-student pair)
  socket.on("joinRoom", ({ room }) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room ${room}`);
  });

  // Handle sending messages
  socket.on("sendMessage", ({ room, message, sender }) => {
    const msgData = { message, sender, createdAt: new Date() };
    // Broadcast to room
    io.to(room).emit("receiveMessage", msgData);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});
app.use("/api/leaderboard", leaderboardRoutes);
// Start server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
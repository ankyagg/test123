import mongoose from "mongoose";
const bookingSchema = new mongoose.Schema({
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ["booked", "cancelled"],
    default: "booked"
  },
   calendarEventLink: { type: String } 

}, { timestamps: true });




export default mongoose.model("Booking", bookingSchema);
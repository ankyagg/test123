import { google } from "googleapis";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

const client_id = process.env.GOOGLE_CLIENT_ID;
const client_secret = process.env.GOOGLE_CLIENT_SECRET;
const redirect_uris = [process.env.GOOGLE_REDIRECT_URI];

const oAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0]
);

// Load token
if (fs.existsSync(process.env.GOOGLE_TOKEN_PATH)) {
  const token = JSON.parse(fs.readFileSync(process.env.GOOGLE_TOKEN_PATH));
  oAuth2Client.setCredentials(token);
}

const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

export const createEvent = async ({ summary, description, start, end }) => {
  try {
    const event = {
      summary,
      description,
      start: { dateTime: start },
      end: { dateTime: end },
    };
    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
    });
    return response.data;
  } catch (error) {
    console.error("Google Calendar Error:", error);
    return null;
  }
};

import { google } from "googleapis";
import readline from "readline";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const SCOPES = ["https://www.googleapis.com/auth/calendar"];
const TOKEN_PATH = process.env.GOOGLE_TOKEN_PATH || "./config/token.json";

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI   // must match Google Cloud URI
);


const authUrl = oAuth2Client.generateAuthUrl({
  access_type: "offline",
  scope: SCOPES,
});

console.log("Authorize this app by visiting this URL:\n", authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question("Enter the code from that page here: ", async (code) => {
  rl.close();
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // Ensure config folder exists
    const dir = TOKEN_PATH.substring(0, TOKEN_PATH.lastIndexOf("/"));
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
    console.log("Token stored to", TOKEN_PATH);
  } catch (err) {
    console.error("Error retrieving access token", err);
  }
});

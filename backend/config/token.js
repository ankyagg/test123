import { google } from "googleapis";
import fs from "fs";

const CREDENTIALS = JSON.parse(fs.readFileSync("config/google-credentials.json"));
const { client_id, client_secret, redirect_uris } = CREDENTIALS.installed || CREDENTIALS.web;

const oAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0]
);

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: "offline",
  scope: ["https://www.googleapis.com/auth/calendar"]
});

console.log("Authorize this app by visiting this url:", authUrl);

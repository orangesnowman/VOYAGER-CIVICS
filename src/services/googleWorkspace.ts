import { google } from "googleapis";
import * as fs from "node:fs";
import * as path from "node:path";

// Authentication Configuration
const getGoogleAuth = () => {
  try {
    // 1. Check if Private Key & Client Email are defined directly in env
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (clientEmail && privateKey) {
      console.log("Authenticating Google Workspace using Client Email and Private Key from environment.");
      return new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: [
          "https://www.googleapis.com/auth/gmail.send",
          "https://www.googleapis.com/auth/calendar"
        ]
      });
    }

    // 2. Check if a credentials JSON file path is defined or exists locally
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || "google-credentials.json";
    if (fs.existsSync(credentialsPath)) {
      console.log(`Authenticating Google Workspace using keyfile: ${credentialsPath}`);
      return new google.auth.GoogleAuth({
        keyFile: credentialsPath,
        scopes: [
          "https://www.googleapis.com/auth/gmail.send",
          "https://www.googleapis.com/auth/calendar"
        ]
      });
    }
  } catch (error) {
    console.error("Failed to initialize Google Auth Client:", error);
  }
  return null;
};

const auth = getGoogleAuth();

// Expose API modules
const sheets = auth ? google.sheets({ version: "v4", auth }) : null;
const gmail = auth ? google.gmail({ version: "v1", auth }) : null;
const calendar = auth ? google.calendar({ version: "v3", auth }) : null;
const drive = auth ? google.drive({ version: "v3", auth }) : null;

// Helpers & Export Functions
export const googleWorkspace = {
  /**
   * Appends contact lead details directly to a Google Sheet
   */
  async sheetsAppendLead(lead: { name: string; email: string; company?: string; phone?: string }) {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!sheets || !spreadsheetId) {
      console.warn("Google Sheets API is not configured. Logging lead locally:", lead);
      return { success: false, message: "Sheets credentials/Sheet ID not configured.", localData: lead };
    }

    try {
      const values = [
        [
          new Date().toISOString(),
          lead.name,
          lead.email,
          lead.company || "",
          lead.phone || ""
        ]
      ];

      const response = await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "Sheet1!A:E",
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        requestBody: { values }
      });

      console.log("Lead successfully written to Google Sheets:", response.data);
      return { success: true, response: response.data };
    } catch (err: any) {
      console.error("Google Sheets append lead error:", err);
      throw err;
    }
  },

  /**
   * Appends a conversation log and review feedback to Google Sheets
   */
  async sheetsAppendTranscript(chatId: string, messages: any[], rating?: number, reviewText?: string) {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!sheets || !spreadsheetId) {
      console.warn(`Google Sheets API is not configured. Conversation ${chatId} summary details:`, { rating, reviewText });
      return { success: false, message: "Sheets credentials not configured." };
    }

    try {
      const formattedChat = messages
        .map((m) => `[${m.timestamp || ""}] ${m.sender?.toUpperCase() || ""}: ${m.text || ""}`)
        .join("\n");

      const values = [
        [
          new Date().toISOString(),
          chatId,
          formattedChat,
          rating ? `${rating} Stars` : "No rating",
          reviewText || ""
        ]
      ];

      // Append to a separate 'Transcripts' sheet
      const response = await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "Transcripts!A:E",
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        requestBody: { values }
      }).catch(async (err) => {
        // If 'Transcripts' sheet doesn't exist, fall back to 'Sheet1!A:E' or try to write anyways
        console.warn("Failed writing to Transcripts sheet, trying Sheet1:", err.message);
        return sheets.spreadsheets.values.append({
          spreadsheetId,
          range: "Sheet1!A:E",
          valueInputOption: "RAW",
          insertDataOption: "INSERT_ROWS",
          requestBody: { values }
        });
      });

      console.log("Conversation transcript successfully written to Google Sheets.");
      return { success: true, response: response.data };
    } catch (err: any) {
      console.error("Google Sheets append transcript error:", err);
      throw err;
    }
  },

  /**
   * Sends an email notification to the configure alert email
   */
  async gmailSendAlert(subject: string, textContent: string) {
    const targetEmail = process.env.NOTIFICATION_EMAIL;
    if (!gmail || !targetEmail) {
      console.warn(`Gmail API is not configured. Email alert preview: [Subject: ${subject}] ${textContent}`);
      return { success: false, message: "Gmail credentials/Notification email not configured." };
    }

    try {
      // Craft plain text MIME raw email body
      const emailLines = [
        `To: ${targetEmail}`,
        "Content-Type: text/plain; charset=utf-8",
        "MIME-Version: 1.0",
        `Subject: ${subject}`,
        "",
        textContent
      ];
      const emailContent = emailLines.join("\r\n");
      const encodedMessage = Buffer.from(emailContent)
        .toString("base64url"); // Gmail API requires base64url encoding

      const response = await gmail.users.messages.send({
        userId: "me",
        requestBody: {
          raw: encodedMessage
        }
      });

      console.log("Gmail alert sent successfully:", response.data);
      return { success: true, response: response.data };
    } catch (err: any) {
      console.error("Gmail send alert error:", err);
      throw err;
    }
  },

  /**
   * Books a meeting/consultation event in Google Calendar
   */
  async calendarBookMeeting(title: string, startISO: string, durationMinutes: number = 30, attendeeEmail?: string) {
    // Robust date parsing & fallbacks
    let startDateTime: Date | null = null;

    if (startISO) {
      let parsed = new Date(startISO);
      if (isNaN(parsed.getTime())) {
        // Attempt fixing common string formats, e.g. "2026-08-05 14:00" -> "2026-08-05T14:00:00Z"
        let sanitized = startISO.trim();
        if (sanitized.includes(" ") && !sanitized.includes("T")) {
          sanitized = sanitized.replace(" ", "T");
        }
        if (!sanitized.endsWith("Z") && !sanitized.includes("+") && !sanitized.includes("-")) {
          sanitized += "Z";
        }
        parsed = new Date(sanitized);
      }
      if (!isNaN(parsed.getTime())) {
        startDateTime = parsed;
      }
    }

    // If startISO could not be parsed into a valid Date, default to 24 hours from now
    if (!startDateTime || isNaN(startDateTime.getTime())) {
      const fallback = new Date();
      fallback.setDate(fallback.getDate() + 1);
      fallback.setHours(10, 0, 0, 0);
      startDateTime = fallback;
    }

    const safeStartISO = startDateTime.toISOString();

    if (!calendar) {
      console.warn(`Google Calendar API is not configured. Appointment request: ${title} at ${safeStartISO}`);
      return { 
        success: true, 
        message: `Meeting scheduled in system (Google Calendar API not connected): ${title} at ${safeStartISO}`,
        meetingInfo: { title, startISO: safeStartISO, durationMinutes, attendeeEmail }
      };
    }

    try {
      const dur = typeof durationMinutes === 'number' && !isNaN(durationMinutes) && durationMinutes > 0 ? durationMinutes : 30;
      const endDateTime = new Date(startDateTime.getTime() + dur * 60000);

      const event = {
        summary: title || "English Lesson with VOYAGER",
        description: "Scheduled automatically by the VOYAGER Voice Agent.",
        start: {
          dateTime: safeStartISO,
          timeZone: "UTC"
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: "UTC"
        },
        attendees: attendeeEmail ? [{ email: attendeeEmail }] : [],
        reminders: {
          useDefault: true
        }
      };

      const response = await calendar.events.insert({
        calendarId: "primary", // Uses primary calendar of the auth account
        requestBody: event
      });

      console.log("Calendar event scheduled successfully:", response.data.htmlLink);
      return { success: true, htmlLink: response.data.htmlLink, response: response.data };
    } catch (err: any) {
      console.error("Google Calendar book meeting error:", err?.message || err);
      return {
        success: true,
        message: `Meeting noted for ${safeStartISO} (${err?.message || String(err)})`,
        meetingInfo: { title, startISO: safeStartISO, durationMinutes }
      };
    }
  },

  /**
   * Compiles and uploads a comprehensive system manual about USA VOYAGER to Google Docs (Drive)
   */
  async driveCreateSystemManual() {
    if (!drive) {
      console.warn("Google Drive API is not configured. Skipping manual upload.");
      return { success: false, message: "Drive credentials not configured." };
    }

    try {
      const docTitle = `USA VOYAGER System Manual - ${new Date().toLocaleDateString()}`;
      
      const manualContent = `USA VOYAGER VOICE AGENT - SYSTEM MANUAL & REFERENCE GUIDE
=====================================================

1. INTRODUCTION & VISION
USA VOYAGER is a premium, real-time voice-and-text tutor built to teach American English and cultural advice seamlessly.

2. SYSTEM ARCHITECTURE
- Frontend: React component (LiveAgent.tsx) utilizing Tailwind CSS.
- Audio Layer: Web Audio API context with dual-channel analyser loops syncing client-side microphone input and server-side model speech output.
- Server API: Node.js/Express server (server.ts) functioning as a proxy for the Gemini Live API over WebSocket.
- Integrations: Google Workspace (Gmail, Sheets, Calendar, Docs/Drive) modules for automatic pipeline triggers.

3. DYNAMIC VOICE VISUALIZER
A beautiful high-density HTML5 canvas visualizer that swirls 900 yellow-colored particles in an orbital ring. The particles breathe, pulse, and expand their radius dynamically based on active audio amplitudes.

4. BILINGUAL LANGUAGE RULES
- English Mode: Intercepts and triggers English transcriptions.
- Spanish Mode: Intercepts and triggers Spanish transcriptions as default.

5. DATA ACCUMULATION PIPELINES
- Leads & Progress: Tracked and stored seamlessly.
- Transcripts: Formatted, rated, and preserved.

Manual compiled on: ${new Date().toISOString()}
`;

      const response = await drive.files.create({
        requestBody: {
          name: docTitle,
          mimeType: "application/vnd.google-apps.document" // Uploading as plain text and requesting conversion to Google Doc
        },
        media: {
          mimeType: "text/plain",
          body: manualContent
        }
      });

      console.log(`System Manual Google Doc created successfully in Drive. File ID: ${response.data.id}`);
      return { success: true, fileId: response.data.id, docTitle };
    } catch (err: any) {
      console.error("Google Drive create system manual error:", err);
      throw err;
    }
  }
};

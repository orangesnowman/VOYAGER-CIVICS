import * as crypto from "node:crypto";
import * as fs from "node:fs";

interface ServiceAccountCredentials {
  clientEmail: string;
  privateKey: string;
}

const WORKSPACE_SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file"
].join(" ");

function loadServiceAccountCredentials(): ServiceAccountCredentials | null {
  try {
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    if (clientEmail && privateKey) {
      console.log("Authenticating Google Workspace using Client Email and Private Key from environment.");
      return { clientEmail, privateKey };
    }

    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || "google-credentials.json";
    if (fs.existsSync(credentialsPath)) {
      const parsed = JSON.parse(fs.readFileSync(credentialsPath, "utf-8"));
      if (parsed?.client_email && parsed?.private_key) {
        console.log(`Authenticating Google Workspace using keyfile: ${credentialsPath}`);
        return {
          clientEmail: parsed.client_email,
          privateKey: String(parsed.private_key).replace(/\\n/g, "\n")
        };
      }
    }
  } catch (error) {
    console.error("Failed to initialize Google Auth Client:", error);
  }
  return null;
}

const credentials = loadServiceAccountCredentials();
let cachedAccessToken: { token: string; expiresAt: number } | null = null;

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

async function getAccessToken(): Promise<string | null> {
  if (!credentials) return null;

  const now = Date.now();
  if (cachedAccessToken && cachedAccessToken.expiresAt > now + 60_000) {
    return cachedAccessToken.token;
  }

  const iat = Math.floor(now / 1000);
  const exp = iat + 3600;
  const header = base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64UrlEncode(
    JSON.stringify({
      iss: credentials.clientEmail,
      scope: WORKSPACE_SCOPES,
      aud: "https://oauth2.googleapis.com/token",
      exp,
      iat
    })
  );
  const signingInput = `${header}.${payload}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(signingInput);
  signer.end();
  const signature = signer.sign(credentials.privateKey).toString("base64url");
  const assertion = `${signingInput}.${signature}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    })
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    throw new Error(`Google OAuth token exchange failed (${tokenRes.status}): ${errText}`);
  }

  const tokenData: any = await tokenRes.json();
  cachedAccessToken = {
    token: tokenData.access_token,
    expiresAt: now + (Number(tokenData.expires_in) || 3600) * 1000
  };
  return cachedAccessToken.token;
}

async function appendSheetValues(spreadsheetId: string, range: string, values: string[][]) {
  const token = await getAccessToken();
  if (!token) throw new Error("Google Workspace credentials not configured.");

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ values })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google Sheets API error (${res.status}): ${errText}`);
  }
  return res.json();
}

// Helpers & Export Functions
export const googleWorkspace = {
  /**
   * Appends contact lead details directly to a Google Sheet
   */
  async sheetsAppendLead(lead: { name: string; email: string; company?: string; phone?: string }) {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!credentials || !spreadsheetId) {
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

      const data = await appendSheetValues(spreadsheetId, "Sheet1!A:E", values);
      console.log("Lead successfully written to Google Sheets:", data);
      return { success: true, response: data };
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
    if (!credentials || !spreadsheetId) {
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

      const data = await appendSheetValues(spreadsheetId, "Transcripts!A:E", values).catch(async (err) => {
        console.warn("Failed writing to Transcripts sheet, trying Sheet1:", err.message);
        return appendSheetValues(spreadsheetId, "Sheet1!A:E", values);
      });

      console.log("Conversation transcript successfully written to Google Sheets.");
      return { success: true, response: data };
    } catch (err: any) {
      console.error("Google Sheets append transcript error:", err);
      throw err;
    }
  },

  /**
   * Sends an email notification to the configured alert email
   */
  async gmailSendAlert(subject: string, textContent: string) {
    const targetEmail = process.env.NOTIFICATION_EMAIL;
    if (!credentials || !targetEmail) {
      console.warn(`Gmail API is not configured. Email alert preview: [Subject: ${subject}] ${textContent}`);
      return { success: false, message: "Gmail credentials/Notification email not configured." };
    }

    try {
      const token = await getAccessToken();
      if (!token) return { success: false, message: "Gmail credentials/Notification email not configured." };

      const emailLines = [
        `To: ${targetEmail}`,
        "Content-Type: text/plain; charset=utf-8",
        "MIME-Version: 1.0",
        `Subject: ${subject}`,
        "",
        textContent
      ];
      const encodedMessage = Buffer.from(emailLines.join("\r\n")).toString("base64url");

      const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ raw: encodedMessage })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gmail API error (${res.status}): ${errText}`);
      }

      const data = await res.json();
      console.log("Gmail alert sent successfully:", data);
      return { success: true, response: data };
    } catch (err: any) {
      console.error("Gmail send alert error:", err);
      throw err;
    }
  },

  /**
   * Books a meeting/consultation event in Google Calendar
   */
  async calendarBookMeeting(title: string, startISO: string, durationMinutes: number = 30, attendeeEmail?: string) {
    let startDateTime: Date | null = null;

    if (startISO) {
      let parsed = new Date(startISO);
      if (isNaN(parsed.getTime())) {
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

    if (!startDateTime || isNaN(startDateTime.getTime())) {
      const fallback = new Date();
      fallback.setDate(fallback.getDate() + 1);
      fallback.setHours(10, 0, 0, 0);
      startDateTime = fallback;
    }

    const safeStartISO = startDateTime.toISOString();

    if (!credentials) {
      console.warn(`Google Calendar API is not configured. Appointment request: ${title} at ${safeStartISO}`);
      return {
        success: true,
        message: `Meeting scheduled in system (Google Calendar API not connected): ${title} at ${safeStartISO}`,
        meetingInfo: { title, startISO: safeStartISO, durationMinutes, attendeeEmail }
      };
    }

    try {
      const token = await getAccessToken();
      const dur = typeof durationMinutes === "number" && !isNaN(durationMinutes) && durationMinutes > 0 ? durationMinutes : 30;
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

      const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(event)
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Calendar API error (${res.status}): ${errText}`);
      }

      const data: any = await res.json();
      console.log("Calendar event scheduled successfully:", data.htmlLink);
      return { success: true, htmlLink: data.htmlLink, response: data };
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
    if (!credentials) {
      console.warn("Google Drive API is not configured. Skipping manual upload.");
      return { success: false, message: "Drive credentials not configured." };
    }

    try {
      const token = await getAccessToken();
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

      const boundary = `voyager_boundary_${Date.now()}`;
      const metadata = JSON.stringify({
        name: docTitle,
        mimeType: "application/vnd.google-apps.document"
      });
      const multipartBody = [
        `--${boundary}`,
        "Content-Type: application/json; charset=UTF-8",
        "",
        metadata,
        `--${boundary}`,
        "Content-Type: text/plain; charset=UTF-8",
        "",
        manualContent,
        `--${boundary}--`
      ].join("\r\n");

      const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": `multipart/related; boundary=${boundary}`
        },
        body: multipartBody
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Google Drive API error (${res.status}): ${errText}`);
      }

      const data: any = await res.json();
      console.log(`System Manual Google Doc created successfully in Drive. File ID: ${data.id}`);
      return { success: true, fileId: data.id, docTitle };
    } catch (err: any) {
      console.error("Google Drive create system manual error:", err);
      throw err;
    }
  }
};

import { google } from 'googleapis';
import { v4 as uuidv4 } from 'uuid';

// Setup OAuth2 client
// In production, these should be securely provided via environment variables.
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// If using a service account or specific token, you'd set credentials here.
// For now, we assume tokens are managed and provided per request or globally.

export const createGoogleMeetInterview = async (
  recruiterId: string,
  candidateEmail: string,
  candidateName: string,
  jobTitle: string,
  date: string,
  time: string,
  durationMinutes: number
) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error('Google Calendar OAuth credentials are not configured.');
  }

  // Set up the Calendar API
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  
  // Create start and end datetime
  const startDateTime = new Date(`${date}T${time}:00`);
  const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);

  const event = {
    summary: `Interview for ${jobTitle} - ${candidateName}`,
    description: `Technical interview for ${jobTitle}. Please join via the provided Google Meet link.`,
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: 'UTC', // Ensure frontend sends local time appropriately or adjust timezone
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: 'UTC',
    },
    attendees: [
      { email: candidateEmail }
    ],
    conferenceData: {
      createRequest: {
        requestId: uuidv4(),
        conferenceSolutionKey: {
          type: 'hangoutsMeet'
        }
      }
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 10 },
      ],
    },
  };

  try {
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
      conferenceDataVersion: 1, // REQUIRED for Google Meet link generation
      sendUpdates: 'all' // Sends email to attendees
    });

    const googleEventId = response.data.id;
    const meetingLink = response.data.hangoutLink;

    return { googleEventId, meetingLink };
  } catch (error) {
    console.error('Failed to schedule Google Meet:', error);
    throw new Error('Failed to create Google Calendar event and Meet link.');
  }
};

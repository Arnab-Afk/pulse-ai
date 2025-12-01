import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start: string;
  end: string;
  attendees: { email: string; name?: string; responseStatus: string }[];
  location?: string;
  meetingLink?: string;
  organizer: string;
  isAllDay: boolean;
  status: 'confirmed' | 'tentative' | 'cancelled';
  recurrence?: string[];
}

export interface CalendarList {
  id: string;
  name: string;
  primary: boolean;
  accessRole: string;
}

/**
 * Create OAuth2 client for Calendar API
 */
export function createCalendarClient(credentials: {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  accessToken?: string;
  refreshToken?: string;
}): OAuth2Client {
  const oauth2Client = new google.auth.OAuth2(
    credentials.clientId,
    credentials.clientSecret,
    credentials.redirectUri
  );

  if (credentials.accessToken) {
    oauth2Client.setCredentials({
      access_token: credentials.accessToken,
      refresh_token: credentials.refreshToken,
    });
  }

  return oauth2Client;
}

/**
 * Generate OAuth URL for Calendar authorization
 */
export function getCalendarAuthUrl(oauth2Client: OAuth2Client): string {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events.readonly',
    ],
    prompt: 'consent',
  });
}

/**
 * Parse Calendar event to our format
 */
function parseCalendarEvent(event: calendar_v3.Schema$Event): CalendarEvent {
  const isAllDay = !event.start?.dateTime;

  return {
    id: event.id || '',
    title: event.summary || 'Untitled Event',
    description: event.description || '',
    start: event.start?.dateTime || event.start?.date || '',
    end: event.end?.dateTime || event.end?.date || '',
    attendees: (event.attendees || []).map((a) => ({
      email: a.email || '',
      name: a.displayName || undefined,
      responseStatus: a.responseStatus || 'needsAction',
    })),
    location: event.location || undefined,
    meetingLink: event.hangoutLink || event.conferenceData?.entryPoints?.[0]?.uri || undefined,
    organizer: event.organizer?.email || '',
    isAllDay,
    status: (event.status as 'confirmed' | 'tentative' | 'cancelled') || 'confirmed',
    recurrence: event.recurrence || undefined,
  };
}

/**
 * Fetch upcoming events from Google Calendar
 */
export async function fetchUpcomingEvents(
  oauth2Client: OAuth2Client,
  options: {
    calendarId?: string;
    maxResults?: number;
    timeMin?: Date;
    timeMax?: Date;
  } = {}
): Promise<CalendarEvent[]> {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const { calendarId = 'primary', maxResults = 50, timeMin, timeMax } = options;

  const response = await calendar.events.list({
    calendarId,
    maxResults,
    timeMin: (timeMin || new Date()).toISOString(),
    timeMax: timeMax?.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  return (response.data.items || []).map(parseCalendarEvent);
}

/**
 * Fetch past events (for meeting history)
 */
export async function fetchPastEvents(
  oauth2Client: OAuth2Client,
  options: {
    calendarId?: string;
    maxResults?: number;
    daysBack?: number;
  } = {}
): Promise<CalendarEvent[]> {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const { calendarId = 'primary', maxResults = 50, daysBack = 30 } = options;

  const timeMin = new Date();
  timeMin.setDate(timeMin.getDate() - daysBack);

  const response = await calendar.events.list({
    calendarId,
    maxResults,
    timeMin: timeMin.toISOString(),
    timeMax: new Date().toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  return (response.data.items || []).map(parseCalendarEvent);
}

/**
 * Get a specific event by ID
 */
export async function getCalendarEvent(
  oauth2Client: OAuth2Client,
  eventId: string,
  calendarId = 'primary'
): Promise<CalendarEvent | null> {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  try {
    const response = await calendar.events.get({
      calendarId,
      eventId,
    });

    return parseCalendarEvent(response.data);
  } catch (error) {
    console.error('Error fetching calendar event:', error);
    return null;
  }
}

/**
 * Search for events by query
 */
export async function searchCalendarEvents(
  oauth2Client: OAuth2Client,
  query: string,
  options: {
    calendarId?: string;
    maxResults?: number;
    timeMin?: Date;
    timeMax?: Date;
  } = {}
): Promise<CalendarEvent[]> {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const { calendarId = 'primary', maxResults = 20, timeMin, timeMax } = options;

  // Search in past and future
  const defaultTimeMin = new Date();
  defaultTimeMin.setMonth(defaultTimeMin.getMonth() - 3);

  const defaultTimeMax = new Date();
  defaultTimeMax.setMonth(defaultTimeMax.getMonth() + 3);

  const response = await calendar.events.list({
    calendarId,
    maxResults,
    q: query,
    timeMin: (timeMin || defaultTimeMin).toISOString(),
    timeMax: (timeMax || defaultTimeMax).toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  return (response.data.items || []).map(parseCalendarEvent);
}

/**
 * Get list of user's calendars
 */
export async function getCalendarList(oauth2Client: OAuth2Client): Promise<CalendarList[]> {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const response = await calendar.calendarList.list();

  return (response.data.items || []).map((cal) => ({
    id: cal.id || '',
    name: cal.summary || '',
    primary: cal.primary || false,
    accessRole: cal.accessRole || 'reader',
  }));
}

/**
 * Get events for a specific date range (for weekly/monthly views)
 */
export async function getEventsInRange(
  oauth2Client: OAuth2Client,
  startDate: Date,
  endDate: Date,
  calendarId = 'primary'
): Promise<CalendarEvent[]> {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const response = await calendar.events.list({
    calendarId,
    timeMin: startDate.toISOString(),
    timeMax: endDate.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 250,
  });

  return (response.data.items || []).map(parseCalendarEvent);
}

/**
 * Find free/busy times for scheduling
 */
export async function getFreeBusy(
  oauth2Client: OAuth2Client,
  emails: string[],
  startTime: Date,
  endTime: Date
): Promise<Map<string, { start: string; end: string }[]>> {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin: startTime.toISOString(),
      timeMax: endTime.toISOString(),
      items: emails.map((email) => ({ id: email })),
    },
  });

  const busyTimes = new Map<string, { start: string; end: string }[]>();

  for (const [email, data] of Object.entries(response.data.calendars || {})) {
    busyTimes.set(
      email,
      (data.busy || []).map((b) => ({
        start: b.start || '',
        end: b.end || '',
      }))
    );
  }

  return busyTimes;
}

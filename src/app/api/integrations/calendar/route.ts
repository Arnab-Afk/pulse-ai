import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  createCalendarClient,
  getCalendarAuthUrl,
  fetchUpcomingEvents,
  fetchPastEvents,
  getCalendarEvent,
  searchCalendarEvents,
  getCalendarList,
  getEventsInRange,
} from '@/lib/integrations/calendar';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const CALENDAR_REDIRECT_URI = process.env.CALENDAR_REDIRECT_URI || 'http://localhost:3000/api/integrations/calendar/callback';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  const oauth2Client = createCalendarClient({
    clientId: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    redirectUri: CALENDAR_REDIRECT_URI,
  });

  try {
    switch (action) {
      case 'auth-url': {
        const authUrl = getCalendarAuthUrl(oauth2Client);
        return NextResponse.json({ authUrl });
      }

      case 'status': {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('calendar_access_token')?.value;
        
        if (!accessToken) {
          return NextResponse.json({ connected: false });
        }

        oauth2Client.setCredentials({ access_token: accessToken });
        
        try {
          const calendars = await getCalendarList(oauth2Client);
          const primaryCalendar = calendars.find((c) => c.primary);
          return NextResponse.json({ connected: true, primaryCalendar });
        } catch {
          return NextResponse.json({ connected: false });
        }
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Calendar API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('calendar_access_token')?.value;
  const refreshToken = cookieStore.get('calendar_refresh_token')?.value;

  if (!accessToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const oauth2Client = createCalendarClient({
    clientId: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    redirectUri: CALENDAR_REDIRECT_URI,
    accessToken,
    refreshToken,
  });

  try {
    const { action, data } = await request.json();

    switch (action) {
      case 'upcoming': {
        const { maxResults, timeMin, timeMax, calendarId } = data || {};
        const events = await fetchUpcomingEvents(oauth2Client, {
          maxResults,
          timeMin: timeMin ? new Date(timeMin) : undefined,
          timeMax: timeMax ? new Date(timeMax) : undefined,
          calendarId,
        });
        return NextResponse.json({ events });
      }

      case 'past': {
        const { maxResults, daysBack, calendarId } = data || {};
        const events = await fetchPastEvents(oauth2Client, {
          maxResults,
          daysBack,
          calendarId,
        });
        return NextResponse.json({ events });
      }

      case 'get-event': {
        const { eventId, calendarId } = data;
        if (!eventId) {
          return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
        }
        const event = await getCalendarEvent(oauth2Client, eventId, calendarId);
        return NextResponse.json({ event });
      }

      case 'search': {
        const { query, maxResults, timeMin, timeMax, calendarId } = data;
        if (!query) {
          return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }
        const events = await searchCalendarEvents(oauth2Client, query, {
          maxResults,
          timeMin: timeMin ? new Date(timeMin) : undefined,
          timeMax: timeMax ? new Date(timeMax) : undefined,
          calendarId,
        });
        return NextResponse.json({ events });
      }

      case 'range': {
        const { startDate, endDate, calendarId } = data;
        if (!startDate || !endDate) {
          return NextResponse.json({ error: 'Start and end dates are required' }, { status: 400 });
        }
        const events = await getEventsInRange(
          oauth2Client,
          new Date(startDate),
          new Date(endDate),
          calendarId
        );
        return NextResponse.json({ events });
      }

      case 'calendars': {
        const calendars = await getCalendarList(oauth2Client);
        return NextResponse.json({ calendars });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Calendar API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

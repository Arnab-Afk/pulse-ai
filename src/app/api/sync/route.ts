import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { syncAllSources } from '@/lib/services/sync-service';
import { createGmailClient, fetchRecentEmails } from '@/lib/integrations/gmail';
import { createCalendarClient, fetchUpcomingEvents, fetchPastEvents } from '@/lib/integrations/calendar';
import { createSlackClient, fetchChannelMessages, getSlackChannels } from '@/lib/integrations/slack';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

export async function POST(request: Request) {
  const cookieStore = await cookies();
  
  try {
    const { sources = ['gmail', 'calendar', 'slack'], lookbackDays = 7, processWithAI = true } = await request.json();

    const fetchFunctions: Parameters<typeof syncAllSources>[0] = {};

    // Setup Gmail fetching if connected
    const gmailAccessToken = cookieStore.get('gmail_access_token')?.value;
    const gmailRefreshToken = cookieStore.get('gmail_refresh_token')?.value;
    
    if (gmailAccessToken && sources.includes('gmail')) {
      const gmailClient = createGmailClient({
        clientId: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI || '',
        accessToken: gmailAccessToken,
        refreshToken: gmailRefreshToken,
      });

      const afterDate = new Date();
      afterDate.setDate(afterDate.getDate() - lookbackDays);

      fetchFunctions.fetchEmails = () => fetchRecentEmails(gmailClient, {
        maxResults: 50,
        after: afterDate,
      });
    }

    // Setup Calendar fetching if connected
    const calendarAccessToken = cookieStore.get('calendar_access_token')?.value;
    const calendarRefreshToken = cookieStore.get('calendar_refresh_token')?.value;

    if (calendarAccessToken && sources.includes('calendar')) {
      const calendarClient = createCalendarClient({
        clientId: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.CALENDAR_REDIRECT_URI || '',
        accessToken: calendarAccessToken,
        refreshToken: calendarRefreshToken,
      });

      fetchFunctions.fetchEvents = async () => {
        const [upcoming, past] = await Promise.all([
          fetchUpcomingEvents(calendarClient, { maxResults: 30 }),
          fetchPastEvents(calendarClient, { maxResults: 30, daysBack: lookbackDays }),
        ]);
        return [...past, ...upcoming];
      };
    }

    // Setup Slack fetching if connected
    const slackAccessToken = cookieStore.get('slack_access_token')?.value;

    if (slackAccessToken && sources.includes('slack')) {
      const slackClient = createSlackClient(slackAccessToken);

      fetchFunctions.fetchSlackMessages = async () => {
        const channels = await getSlackChannels(slackClient);
        const memberChannels = channels.filter(c => c.isMember).slice(0, 5); // Limit to 5 channels
        
        const allMessages = await Promise.all(
          memberChannels.map(channel => 
            fetchChannelMessages(slackClient, channel.id, { limit: 50 })
          )
        );

        return allMessages.flat();
      };
    }

    // Run sync
    const result = await syncAllSources(fetchFunctions, {
      sources,
      lookbackDays,
      processWithAI,
    });

    return NextResponse.json({
      success: true,
      ...result,
      summary: {
        newThreads: result.newThreads.length,
        newItems: result.newItems.length,
        errors: result.errors.length,
      },
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: 'Sync failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return sync status
  const cookieStore = await cookies();
  
  const connectedSources = {
    gmail: !!cookieStore.get('gmail_access_token')?.value,
    calendar: !!cookieStore.get('calendar_access_token')?.value,
    slack: !!cookieStore.get('slack_access_token')?.value,
  };

  return NextResponse.json({
    connectedSources,
    availableSources: Object.entries(connectedSources)
      .filter(([, connected]) => connected)
      .map(([source]) => source),
  });
}

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  createGmailClient,
  getGmailAuthUrl,
  fetchRecentEmails,
  fetchGmailThread,
  searchEmails,
  getGmailUserEmail,
} from '@/lib/integrations/gmail';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/integrations/gmail/callback';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  const oauth2Client = createGmailClient({
    clientId: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    redirectUri: GOOGLE_REDIRECT_URI,
  });

  try {
    switch (action) {
      case 'auth-url': {
        const authUrl = getGmailAuthUrl(oauth2Client);
        return NextResponse.json({ authUrl });
      }

      case 'status': {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('gmail_access_token')?.value;
        
        if (!accessToken) {
          return NextResponse.json({ connected: false });
        }

        oauth2Client.setCredentials({ access_token: accessToken });
        
        try {
          const email = await getGmailUserEmail(oauth2Client);
          return NextResponse.json({ connected: true, email });
        } catch {
          return NextResponse.json({ connected: false });
        }
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Gmail API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('gmail_access_token')?.value;
  const refreshToken = cookieStore.get('gmail_refresh_token')?.value;

  if (!accessToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const oauth2Client = createGmailClient({
    clientId: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    redirectUri: GOOGLE_REDIRECT_URI,
    accessToken,
    refreshToken,
  });

  try {
    const { action, data } = await request.json();

    switch (action) {
      case 'fetch-recent': {
        const { maxResults, query, after, labelIds } = data || {};
        const emails = await fetchRecentEmails(oauth2Client, {
          maxResults,
          query,
          after: after ? new Date(after) : undefined,
          labelIds,
        });
        return NextResponse.json({ emails });
      }

      case 'fetch-thread': {
        const { threadId } = data;
        if (!threadId) {
          return NextResponse.json({ error: 'Thread ID is required' }, { status: 400 });
        }
        const thread = await fetchGmailThread(oauth2Client, threadId);
        return NextResponse.json({ thread });
      }

      case 'search': {
        const { query, maxResults } = data;
        if (!query) {
          return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }
        const emails = await searchEmails(oauth2Client, query, maxResults);
        return NextResponse.json({ emails });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Gmail API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

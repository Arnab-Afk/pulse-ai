import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  createSlackClient,
  getSlackChannels,
  getSlackUser,
  fetchChannelMessages,
  fetchSlackThread,
  searchSlackMessages,
  getMentions,
  getChannelInfo,
  getBotUserId,
} from '@/lib/integrations/slack';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'auth-url': {
        // Slack uses OAuth 2.0 - return the authorization URL
        const clientId = process.env.SLACK_CLIENT_ID;
        const redirectUri = process.env.SLACK_REDIRECT_URI || 'http://localhost:3000/api/integrations/slack/callback';
        const scopes = [
          'channels:history',
          'channels:read',
          'groups:history',
          'groups:read',
          'im:history',
          'im:read',
          'mpim:history',
          'mpim:read',
          'search:read',
          'users:read',
          'users:read.email',
        ].join(',');

        const authUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}`;
        return NextResponse.json({ authUrl });
      }

      case 'status': {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('slack_access_token')?.value;
        
        if (!accessToken) {
          return NextResponse.json({ connected: false });
        }

        try {
          const client = createSlackClient(accessToken);
          const botUserId = await getBotUserId(client);
          const user = await getSlackUser(client, botUserId);
          return NextResponse.json({ connected: true, user });
        } catch {
          return NextResponse.json({ connected: false });
        }
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Slack API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('slack_access_token')?.value;

  if (!accessToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const client = createSlackClient(accessToken);

  try {
    const { action, data } = await request.json();

    switch (action) {
      case 'channels': {
        const channels = await getSlackChannels(client);
        return NextResponse.json({ channels });
      }

      case 'channel-messages': {
        const { channelId, limit, oldest, latest } = data;
        if (!channelId) {
          return NextResponse.json({ error: 'Channel ID is required' }, { status: 400 });
        }
        const messages = await fetchChannelMessages(client, channelId, { limit, oldest, latest });
        return NextResponse.json({ messages });
      }

      case 'thread': {
        const { channelId, threadTs } = data;
        if (!channelId || !threadTs) {
          return NextResponse.json({ error: 'Channel ID and thread timestamp are required' }, { status: 400 });
        }
        const thread = await fetchSlackThread(client, channelId, threadTs);
        return NextResponse.json({ thread });
      }

      case 'search': {
        const { query, count, sort, sortDir } = data;
        if (!query) {
          return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }
        const messages = await searchSlackMessages(client, query, { count, sort, sortDir });
        return NextResponse.json({ messages });
      }

      case 'mentions': {
        const { userId, limit } = data;
        if (!userId) {
          return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }
        const messages = await getMentions(client, userId, limit);
        return NextResponse.json({ messages });
      }

      case 'channel-info': {
        const { channelId } = data;
        if (!channelId) {
          return NextResponse.json({ error: 'Channel ID is required' }, { status: 400 });
        }
        const channel = await getChannelInfo(client, channelId);
        return NextResponse.json({ channel });
      }

      case 'user': {
        const { userId } = data;
        if (!userId) {
          return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }
        const user = await getSlackUser(client, userId);
        return NextResponse.json({ user });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Slack API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

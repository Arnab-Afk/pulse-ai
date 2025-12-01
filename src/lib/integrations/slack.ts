import { WebClient } from '@slack/web-api';

export interface SlackMessage {
  id: string;
  channelId: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
  threadTs?: string;
  reactions: { name: string; count: number }[];
  files: { name: string; url: string; type: string }[];
  isThreadParent: boolean;
  replyCount: number;
}

export interface SlackChannel {
  id: string;
  name: string;
  isPrivate: boolean;
  isMember: boolean;
  topic: string;
  purpose: string;
  memberCount: number;
}

export interface SlackUser {
  id: string;
  name: string;
  realName: string;
  email?: string;
  avatar: string;
  isBot: boolean;
}

export interface SlackThread {
  parentMessage: SlackMessage;
  replies: SlackMessage[];
  participants: SlackUser[];
}

/**
 * Create Slack client with bot token
 */
export function createSlackClient(token: string): WebClient {
  return new WebClient(token);
}

/**
 * Get list of channels the bot has access to
 */
export async function getSlackChannels(client: WebClient): Promise<SlackChannel[]> {
  const result = await client.conversations.list({
    types: 'public_channel,private_channel',
    exclude_archived: true,
  });

  return (result.channels || []).map((channel) => ({
    id: channel.id || '',
    name: channel.name || '',
    isPrivate: channel.is_private || false,
    isMember: channel.is_member || false,
    topic: (channel as { topic?: { value?: string } }).topic?.value || '',
    purpose: (channel as { purpose?: { value?: string } }).purpose?.value || '',
    memberCount: channel.num_members || 0,
  }));
}

/**
 * Get user information
 */
export async function getSlackUser(client: WebClient, userId: string): Promise<SlackUser | null> {
  try {
    const result = await client.users.info({ user: userId });

    if (!result.user) return null;

    return {
      id: result.user.id || '',
      name: result.user.name || '',
      realName: result.user.real_name || '',
      email: result.user.profile?.email,
      avatar: result.user.profile?.image_72 || '',
      isBot: result.user.is_bot || false,
    };
  } catch {
    return null;
  }
}

/**
 * Cache for user lookups
 */
const userCache = new Map<string, SlackUser>();

/**
 * Get user with caching
 */
async function getCachedUser(client: WebClient, userId: string): Promise<SlackUser | null> {
  if (userCache.has(userId)) {
    return userCache.get(userId)!;
  }

  const user = await getSlackUser(client, userId);
  if (user) {
    userCache.set(userId, user);
  }
  return user;
}

/**
 * Parse Slack message to our format
 */
async function parseSlackMessage(
  client: WebClient,
  message: Record<string, unknown>,
  channelId: string
): Promise<SlackMessage> {
  const userId = message.user as string || '';
  const user = await getCachedUser(client, userId);

  const files = (message.files as Array<{ name?: string; url_private?: string; filetype?: string }> || []).map((f) => ({
    name: f.name || '',
    url: f.url_private || '',
    type: f.filetype || '',
  }));

  const reactions = (message.reactions as Array<{ name?: string; count?: number }> || []).map((r) => ({
    name: r.name || '',
    count: r.count || 0,
  }));

  return {
    id: message.ts as string || '',
    channelId,
    userId,
    userName: user?.realName || user?.name || 'Unknown',
    text: message.text as string || '',
    timestamp: new Date(parseFloat(message.ts as string || '0') * 1000).toISOString(),
    threadTs: message.thread_ts as string | undefined,
    reactions,
    files,
    isThreadParent: !!(message.reply_count && (message.reply_count as number) > 0),
    replyCount: (message.reply_count as number) || 0,
  };
}

/**
 * Fetch recent messages from a channel
 */
export async function fetchChannelMessages(
  client: WebClient,
  channelId: string,
  options: {
    limit?: number;
    oldest?: string;
    latest?: string;
  } = {}
): Promise<SlackMessage[]> {
  const { limit = 100, oldest, latest } = options;

  const result = await client.conversations.history({
    channel: channelId,
    limit,
    oldest,
    latest,
  });

  const messages: SlackMessage[] = [];
  for (const msg of result.messages || []) {
    messages.push(await parseSlackMessage(client, msg as Record<string, unknown>, channelId));
  }

  return messages;
}

/**
 * Fetch a thread with all replies
 */
export async function fetchSlackThread(
  client: WebClient,
  channelId: string,
  threadTs: string
): Promise<SlackThread | null> {
  try {
    const result = await client.conversations.replies({
      channel: channelId,
      ts: threadTs,
    });

    if (!result.messages || result.messages.length === 0) {
      return null;
    }

    const messages: SlackMessage[] = [];
    for (const msg of result.messages) {
      messages.push(await parseSlackMessage(client, msg as Record<string, unknown>, channelId));
    }

    const [parent, ...replies] = messages;

    // Get unique participants
    const participantIds = new Set<string>();
    messages.forEach((m) => participantIds.add(m.userId));

    const participants: SlackUser[] = [];
    for (const id of participantIds) {
      const user = await getCachedUser(client, id);
      if (user) participants.push(user);
    }

    return {
      parentMessage: parent,
      replies,
      participants,
    };
  } catch {
    return null;
  }
}

/**
 * Search messages across channels
 */
export async function searchSlackMessages(
  client: WebClient,
  query: string,
  options: {
    count?: number;
    sort?: 'score' | 'timestamp';
    sortDir?: 'asc' | 'desc';
  } = {}
): Promise<SlackMessage[]> {
  const { count = 20, sort = 'timestamp', sortDir = 'desc' } = options;

  const result = await client.search.messages({
    query,
    count,
    sort,
    sort_dir: sortDir,
  });

  const matches = (result.messages as { matches?: Array<{ channel?: { id?: string } }> })?.matches || [];
  const messages: SlackMessage[] = [];

  for (const match of matches) {
    const channelId = match.channel?.id || '';
    messages.push(await parseSlackMessage(client, match as Record<string, unknown>, channelId));
  }

  return messages;
}

/**
 * Get messages mentioning a user
 */
export async function getMentions(
  client: WebClient,
  userId: string,
  limit = 50
): Promise<SlackMessage[]> {
  return searchSlackMessages(client, `<@${userId}>`, { count: limit });
}

/**
 * Get direct messages with a user
 */
export async function getDirectMessages(
  client: WebClient,
  userId: string,
  limit = 50
): Promise<SlackMessage[]> {
  // Open or get existing DM channel
  const result = await client.conversations.open({ users: userId });
  const channelId = result.channel?.id;

  if (!channelId) return [];

  return fetchChannelMessages(client, channelId, { limit });
}

/**
 * Get channel info
 */
export async function getChannelInfo(
  client: WebClient,
  channelId: string
): Promise<SlackChannel | null> {
  try {
    const result = await client.conversations.info({ channel: channelId });

    if (!result.channel) return null;

    const channel = result.channel as {
      id?: string;
      name?: string;
      is_private?: boolean;
      is_member?: boolean;
      topic?: { value?: string };
      purpose?: { value?: string };
      num_members?: number;
    };

    return {
      id: channel.id || '',
      name: channel.name || '',
      isPrivate: channel.is_private || false,
      isMember: channel.is_member || false,
      topic: channel.topic?.value || '',
      purpose: channel.purpose?.value || '',
      memberCount: channel.num_members || 0,
    };
  } catch {
    return null;
  }
}

/**
 * Get bot's own user ID
 */
export async function getBotUserId(client: WebClient): Promise<string> {
  const result = await client.auth.test();
  return result.user_id || '';
}

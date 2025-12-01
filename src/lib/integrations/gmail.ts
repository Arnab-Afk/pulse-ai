import { google, gmail_v1 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export interface GmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string[];
  cc: string[];
  date: string;
  body: string;
  snippet: string;
  labels: string[];
  isUnread: boolean;
}

export interface GmailThread {
  id: string;
  subject: string;
  messages: GmailMessage[];
  participants: string[];
  lastMessageDate: string;
}

/**
 * Create OAuth2 client for Gmail API
 */
export function createGmailClient(credentials: {
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
 * Generate OAuth URL for Gmail authorization
 */
export function getGmailAuthUrl(oauth2Client: OAuth2Client): string {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.labels',
    ],
    prompt: 'consent',
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function getGmailTokens(
  oauth2Client: OAuth2Client,
  code: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  return {
    accessToken: tokens.access_token || '',
    refreshToken: tokens.refresh_token || '',
  };
}

/**
 * Parse email address from Gmail format
 */
function parseEmailAddress(header: string): string {
  const match = header.match(/<(.+)>/);
  return match ? match[1] : header;
}

/**
 * Get email body from message parts
 */
function getEmailBody(payload: gmail_v1.Schema$MessagePart): string {
  if (payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf-8');
  }

  if (payload.parts) {
    // Look for text/plain first, then text/html
    const textPart = payload.parts.find((p) => p.mimeType === 'text/plain');
    if (textPart?.body?.data) {
      return Buffer.from(textPart.body.data, 'base64').toString('utf-8');
    }

    const htmlPart = payload.parts.find((p) => p.mimeType === 'text/html');
    if (htmlPart?.body?.data) {
      // Strip HTML tags for plain text
      const html = Buffer.from(htmlPart.body.data, 'base64').toString('utf-8');
      return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    // Recursively check nested parts
    for (const part of payload.parts) {
      if (part.parts) {
        const body = getEmailBody(part);
        if (body) return body;
      }
    }
  }

  return '';
}

/**
 * Parse Gmail message to our format
 */
function parseGmailMessage(message: gmail_v1.Schema$Message): GmailMessage {
  const headers = message.payload?.headers || [];
  const getHeader = (name: string) =>
    headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

  const toAddresses = getHeader('to')
    .split(',')
    .map((a) => parseEmailAddress(a.trim()))
    .filter(Boolean);
  const ccAddresses = getHeader('cc')
    .split(',')
    .map((a) => parseEmailAddress(a.trim()))
    .filter(Boolean);

  return {
    id: message.id || '',
    threadId: message.threadId || '',
    subject: getHeader('subject'),
    from: parseEmailAddress(getHeader('from')),
    to: toAddresses,
    cc: ccAddresses,
    date: new Date(parseInt(message.internalDate || '0')).toISOString(),
    body: getEmailBody(message.payload || {}),
    snippet: message.snippet || '',
    labels: message.labelIds || [],
    isUnread: message.labelIds?.includes('UNREAD') || false,
  };
}

/**
 * Fetch recent emails from Gmail
 */
export async function fetchRecentEmails(
  oauth2Client: OAuth2Client,
  options: {
    maxResults?: number;
    query?: string;
    after?: Date;
    labelIds?: string[];
  } = {}
): Promise<GmailMessage[]> {
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  const { maxResults = 50, query, after, labelIds } = options;

  let q = query || '';
  if (after) {
    const afterTimestamp = Math.floor(after.getTime() / 1000);
    q += ` after:${afterTimestamp}`;
  }

  const listResponse = await gmail.users.messages.list({
    userId: 'me',
    maxResults,
    q: q.trim() || undefined,
    labelIds,
  });

  const messages = listResponse.data.messages || [];
  const fullMessages: GmailMessage[] = [];

  // Fetch full message details (batch in chunks)
  const chunkSize = 10;
  for (let i = 0; i < messages.length; i += chunkSize) {
    const chunk = messages.slice(i, i + chunkSize);
    const details = await Promise.all(
      chunk.map((msg) =>
        gmail.users.messages.get({
          userId: 'me',
          id: msg.id!,
          format: 'full',
        })
      )
    );

    fullMessages.push(...details.map((d) => parseGmailMessage(d.data)));
  }

  return fullMessages;
}

/**
 * Fetch a Gmail thread with all messages
 */
export async function fetchGmailThread(
  oauth2Client: OAuth2Client,
  threadId: string
): Promise<GmailThread | null> {
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  try {
    const response = await gmail.users.threads.get({
      userId: 'me',
      id: threadId,
      format: 'full',
    });

    const messages = (response.data.messages || []).map(parseGmailMessage);
    const participants = new Set<string>();

    messages.forEach((msg) => {
      participants.add(msg.from);
      msg.to.forEach((t) => participants.add(t));
      msg.cc.forEach((c) => participants.add(c));
    });

    return {
      id: threadId,
      subject: messages[0]?.subject || 'No Subject',
      messages,
      participants: Array.from(participants),
      lastMessageDate: messages[messages.length - 1]?.date || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching Gmail thread:', error);
    return null;
  }
}

/**
 * Search emails by query
 */
export async function searchEmails(
  oauth2Client: OAuth2Client,
  query: string,
  maxResults = 20
): Promise<GmailMessage[]> {
  return fetchRecentEmails(oauth2Client, { query, maxResults });
}

/**
 * Get user's email address
 */
export async function getGmailUserEmail(oauth2Client: OAuth2Client): Promise<string> {
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  const profile = await gmail.users.getProfile({ userId: 'me' });
  return profile.data.emailAddress || '';
}

/**
 * Get Gmail labels
 */
export async function getGmailLabels(
  oauth2Client: OAuth2Client
): Promise<{ id: string; name: string }[]> {
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  const response = await gmail.users.labels.list({ userId: 'me' });

  return (response.data.labels || []).map((label) => ({
    id: label.id || '',
    name: label.name || '',
  }));
}

import { v4 as uuidv4 } from 'uuid';
import { Thread, TimelineItem } from '@/types';
import { GmailMessage } from '@/lib/integrations/gmail';
import { CalendarEvent } from '@/lib/integrations/calendar';
import { SlackMessage } from '@/lib/integrations/slack';
import {
  gmailToTimelineItem,
  calendarEventToTimelineItem,
  slackMessageToTimelineItem,
  calculatePriority,
  determineThreadStatus,
} from './thread-processor';
import { extractActionItems, summarizeThread } from '@/lib/ai/openai';

export interface SyncResult {
  newThreads: Thread[];
  updatedThreads: Thread[];
  newItems: TimelineItem[];
  errors: { source: string; error: string }[];
}

export interface SyncOptions {
  sources: ('gmail' | 'calendar' | 'slack')[];
  lookbackDays?: number;
  autoCreateThreads?: boolean;
  processWithAI?: boolean;
}

/**
 * Group Gmail messages into threads based on subject and participants
 */
function groupEmailsByThread(emails: GmailMessage[]): Map<string, GmailMessage[]> {
  const threads = new Map<string, GmailMessage[]>();

  for (const email of emails) {
    // Use Gmail's threadId if available, otherwise group by subject
    const threadKey = email.threadId || normalizeSubject(email.subject);

    if (!threads.has(threadKey)) {
      threads.set(threadKey, []);
    }
    threads.get(threadKey)!.push(email);
  }

  return threads;
}

/**
 * Normalize email subject for grouping
 */
function normalizeSubject(subject: string): string {
  return subject
    .toLowerCase()
    .replace(/^(re:|fwd:|fw:)\s*/gi, '')
    .trim();
}

/**
 * Group Slack messages into threads
 */
function groupSlackByThread(messages: SlackMessage[]): Map<string, SlackMessage[]> {
  const threads = new Map<string, SlackMessage[]>();

  for (const message of messages) {
    const threadKey = message.threadTs || message.id;

    if (!threads.has(threadKey)) {
      threads.set(threadKey, []);
    }
    threads.get(threadKey)!.push(message);
  }

  return threads;
}

/**
 * Group calendar events by project/meeting series
 */
function groupEventsByMeetingSeries(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const series = new Map<string, CalendarEvent[]>();

  for (const event of events) {
    // Group recurring events together, or standalone events by their ID
    const seriesKey = event.recurrence ? normalizeSubject(event.title) : event.id;

    if (!series.has(seriesKey)) {
      series.set(seriesKey, []);
    }
    series.get(seriesKey)!.push(event);
  }

  return series;
}

/**
 * Create a thread from a group of emails
 */
async function createThreadFromEmails(
  emails: GmailMessage[],
  processWithAI: boolean
): Promise<{ thread: Thread; items: TimelineItem[] }> {
  const items = emails.map(gmailToTimelineItem);

  // Sort by date
  items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  emails.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const participants = new Map<string, { email: string; name: string }>();
  emails.forEach((email) => {
    [email.from, ...email.to, ...email.cc].forEach((addr) => {
      if (!participants.has(addr)) {
        participants.set(addr, { email: addr, name: addr.split('@')[0] });
      }
    });
  });

  let summary = '';
  let actionItems: Thread['actionItems'] = [];

  if (processWithAI) {
    const contentForAI = emails.map((e) => ({
      type: 'email',
      content: e.body,
      date: e.date,
      author: e.from,
    }));

    const [summaryResult, extractedActions] = await Promise.all([
      summarizeThread(contentForAI),
      extractActionItems(emails.map((e) => e.body).join('\n\n')),
    ]);

    summary = summaryResult.summary;
    actionItems = extractedActions.map((ai) => ({
      id: uuidv4(),
      text: ai.text,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
      assignee: ai.assignee
        ? { id: ai.assignee, name: ai.assignee, email: ai.assignee, role: 'assignee' as const }
        : undefined,
      dueDate: ai.dueDate,
    }));
  }

  const lastEmail = emails[emails.length - 1];
  const thread: Thread = {
    id: uuidv4(),
    title: emails[0].subject || 'Email Thread',
    summary,
    status: determineThreadStatus(
      lastEmail.date,
      actionItems.filter((a) => a.status === 'pending').length,
      false
    ),
    priority: calculatePriority(items, actionItems),
    lastActivity: lastEmail.date,
    participants: Array.from(participants.values()).map((p) => ({
      id: p.email,
      name: p.name,
      email: p.email,
      role: 'participant',
    })),
    itemCount: items.length,
    unresolvedCount: actionItems.filter((a) => a.status === 'pending').length,
    tags: [],
    actionItems,
  };

  return { thread, items };
}

/**
 * Create a thread from Slack messages
 */
async function createThreadFromSlack(
  messages: SlackMessage[],
  processWithAI: boolean
): Promise<{ thread: Thread; items: TimelineItem[] }> {
  const items = messages.map(slackMessageToTimelineItem);

  // Sort by timestamp
  items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const participants = new Map<string, { id: string; name: string }>();
  messages.forEach((msg) => {
    if (!participants.has(msg.userId)) {
      participants.set(msg.userId, { id: msg.userId, name: msg.userName });
    }
  });

  let summary = '';
  let actionItems: Thread['actionItems'] = [];

  if (processWithAI) {
    const contentForAI = messages.map((m) => ({
      type: 'slack',
      content: m.text,
      date: m.timestamp,
      author: m.userName,
    }));

    const [summaryResult, extractedActions] = await Promise.all([
      summarizeThread(contentForAI),
      extractActionItems(messages.map((m) => m.text).join('\n\n')),
    ]);

    summary = summaryResult.summary;
    actionItems = extractedActions.map((ai) => ({
      id: uuidv4(),
      text: ai.text,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
    }));
  }

  const firstMessage = messages[0];
  const lastMessage = messages[messages.length - 1];
  const title =
    firstMessage.text.length > 60
      ? firstMessage.text.slice(0, 60) + '...'
      : firstMessage.text || 'Slack Thread';

  const thread: Thread = {
    id: uuidv4(),
    title,
    summary,
    status: determineThreadStatus(
      lastMessage.timestamp,
      actionItems.filter((a) => a.status === 'pending').length,
      false
    ),
    priority: calculatePriority(items, actionItems),
    lastActivity: lastMessage.timestamp,
    participants: Array.from(participants.values()).map((p) => ({
      id: p.id,
      name: p.name,
      role: 'participant',
    })),
    itemCount: items.length,
    unresolvedCount: actionItems.filter((a) => a.status === 'pending').length,
    tags: [],
    actionItems,
  };

  return { thread, items };
}

/**
 * Create a thread from calendar events (meeting series)
 */
async function createThreadFromEvents(
  events: CalendarEvent[],
  processWithAI: boolean
): Promise<{ thread: Thread; items: TimelineItem[] }> {
  const items = events.map(calendarEventToTimelineItem);

  // Sort by start time
  items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  const participants = new Map<string, { email: string; name: string }>();
  events.forEach((event) => {
    event.attendees.forEach((attendee) => {
      if (!participants.has(attendee.email)) {
        participants.set(attendee.email, {
          email: attendee.email,
          name: attendee.name || attendee.email.split('@')[0],
        });
      }
    });
  });

  let summary = '';
  let actionItems: Thread['actionItems'] = [];

  if (processWithAI && events.some((e) => e.description)) {
    const contentForAI = events
      .filter((e) => e.description)
      .map((e) => ({
        type: 'meeting',
        content: e.description,
        date: e.start,
      }));

    if (contentForAI.length > 0) {
      const [summaryResult, extractedActions] = await Promise.all([
        summarizeThread(contentForAI),
        extractActionItems(events.map((e) => e.description || '').join('\n\n')),
      ]);

      summary = summaryResult.summary;
      actionItems = extractedActions.map((ai) => ({
        id: uuidv4(),
        text: ai.text,
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
      }));
    }
  }

  const lastEvent = events[events.length - 1];
  const thread: Thread = {
    id: uuidv4(),
    title: events[0].title,
    summary,
    status: determineThreadStatus(
      lastEvent.end,
      actionItems.filter((a) => a.status === 'pending').length,
      false
    ),
    priority: 'medium',
    lastActivity: lastEvent.end,
    participants: Array.from(participants.values()).map((p) => ({
      id: p.email,
      name: p.name,
      email: p.email,
      role: 'participant',
    })),
    itemCount: items.length,
    unresolvedCount: actionItems.filter((a) => a.status === 'pending').length,
    tags: ['meeting'],
    actionItems,
  };

  return { thread, items };
}

/**
 * Main sync function - fetches data from all sources and processes into threads
 */
export async function syncAllSources(
  fetchFunctions: {
    fetchEmails?: () => Promise<GmailMessage[]>;
    fetchEvents?: () => Promise<CalendarEvent[]>;
    fetchSlackMessages?: () => Promise<SlackMessage[]>;
  },
  options: SyncOptions
): Promise<SyncResult> {
  const result: SyncResult = {
    newThreads: [],
    updatedThreads: [],
    newItems: [],
    errors: [],
  };

  const { processWithAI = true } = options;

  // Fetch Gmail
  if (options.sources.includes('gmail') && fetchFunctions.fetchEmails) {
    try {
      const emails = await fetchFunctions.fetchEmails();
      const emailGroups = groupEmailsByThread(emails);

      for (const [, groupEmails] of emailGroups) {
        if (groupEmails.length > 0) {
          const { thread, items } = await createThreadFromEmails(groupEmails, processWithAI);
          result.newThreads.push(thread);
          result.newItems.push(...items);
        }
      }
    } catch (error) {
      result.errors.push({
        source: 'gmail',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Fetch Calendar
  if (options.sources.includes('calendar') && fetchFunctions.fetchEvents) {
    try {
      const events = await fetchFunctions.fetchEvents();
      const eventGroups = groupEventsByMeetingSeries(events);

      for (const [, groupEvents] of eventGroups) {
        if (groupEvents.length > 0) {
          const { thread, items } = await createThreadFromEvents(groupEvents, processWithAI);
          result.newThreads.push(thread);
          result.newItems.push(...items);
        }
      }
    } catch (error) {
      result.errors.push({
        source: 'calendar',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Fetch Slack
  if (options.sources.includes('slack') && fetchFunctions.fetchSlackMessages) {
    try {
      const messages = await fetchFunctions.fetchSlackMessages();
      const slackGroups = groupSlackByThread(messages);

      for (const [, groupMessages] of slackGroups) {
        if (groupMessages.length > 0) {
          const { thread, items } = await createThreadFromSlack(groupMessages, processWithAI);
          result.newThreads.push(thread);
          result.newItems.push(...items);
        }
      }
    } catch (error) {
      result.errors.push({
        source: 'slack',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return result;
}

export default syncAllSources;

import { v4 as uuidv4 } from 'uuid';
import { Thread, TimelineItem, ActionItem, Participant, ItemType } from '@/types';
import { GmailMessage, GmailThread } from '@/lib/integrations/gmail';
import { CalendarEvent } from '@/lib/integrations/calendar';
import { SlackMessage, SlackThread } from '@/lib/integrations/slack';
import {
  extractActionItems,
  summarizeThread,
  generateSmartSuggestions,
  classifyAndExtract,
} from '@/lib/ai/openai';

export interface ProcessedData {
  threads: Thread[];
  items: TimelineItem[];
  actionItems: ActionItem[];
}

/**
 * Convert Gmail message to TimelineItem
 */
export function gmailToTimelineItem(message: GmailMessage): TimelineItem {
  return {
    id: uuidv4(),
    type: 'email' as ItemType,
    title: message.subject,
    content: message.body,
    timestamp: message.date,
    participants: [message.from, ...message.to].map((email) => ({
      id: email,
      name: email.split('@')[0],
      email,
      role: email === message.from ? 'author' : 'recipient',
    })),
    source: 'gmail',
    sourceId: message.id,
    metadata: {
      labels: message.labels,
      isUnread: message.isUnread,
      cc: message.cc,
    },
  };
}

/**
 * Convert Gmail thread to Thread with items
 */
export async function processGmailThread(gmailThread: GmailThread): Promise<{
  thread: Partial<Thread>;
  items: TimelineItem[];
}> {
  const items = gmailThread.messages.map(gmailToTimelineItem);

  // Get AI summary and action items
  const contentForAI = gmailThread.messages.map((m) => ({
    type: 'email',
    content: m.body,
    date: m.date,
    author: m.from,
  }));

  const [summary, actionItemsRaw] = await Promise.all([
    summarizeThread(contentForAI),
    extractActionItems(gmailThread.messages.map((m) => m.body).join('\n\n')),
  ]);

  const participants: Participant[] = gmailThread.participants.map((email) => ({
    id: email,
    name: email.split('@')[0],
    email,
    role: 'participant',
  }));

  const actionItems: ActionItem[] = actionItemsRaw.map((ai) => ({
    id: uuidv4(),
    text: ai.text,
    assignee: ai.assignee
      ? {
          id: ai.assignee,
          name: ai.assignee,
          email: ai.assignee,
          role: 'assignee',
        }
      : undefined,
    dueDate: ai.dueDate,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }));

  return {
    thread: {
      id: uuidv4(),
      title: gmailThread.subject,
      summary: summary.summary,
      status: 'active',
      priority: 'medium',
      lastActivity: gmailThread.lastMessageDate,
      participants,
      itemCount: items.length,
      unresolvedCount: actionItems.filter((a) => a.status === 'pending').length,
      tags: summary.keyPoints.slice(0, 3),
      actionItems,
    },
    items,
  };
}

/**
 * Convert Calendar event to TimelineItem
 */
export function calendarEventToTimelineItem(event: CalendarEvent): TimelineItem {
  const participants: Participant[] = event.attendees.map((a) => ({
    id: a.email,
    name: a.name || a.email.split('@')[0],
    email: a.email,
    role: a.responseStatus === 'accepted' ? 'attendee' : 'invited',
  }));

  return {
    id: uuidv4(),
    type: 'meeting' as ItemType,
    title: event.title,
    content: event.description,
    timestamp: event.start,
    participants,
    source: 'google_calendar',
    sourceId: event.id,
    metadata: {
      endTime: event.end,
      location: event.location,
      meetingLink: event.meetingLink,
      status: event.status,
      isAllDay: event.isAllDay,
    },
  };
}

/**
 * Process meeting and extract action items from description/notes
 */
export async function processMeetingWithNotes(
  event: CalendarEvent,
  meetingNotes?: string
): Promise<{
  item: TimelineItem;
  actionItems: ActionItem[];
}> {
  const item = calendarEventToTimelineItem(event);

  const contentToProcess = meetingNotes || event.description || '';
  let actionItems: ActionItem[] = [];

  if (contentToProcess) {
    const extracted = await extractActionItems(contentToProcess);
    actionItems = extracted.map((ai) => ({
      id: uuidv4(),
      text: ai.text,
      assignee: ai.assignee
        ? {
            id: ai.assignee,
            name: ai.assignee,
            email: ai.assignee,
            role: 'assignee',
          }
        : undefined,
      dueDate: ai.dueDate,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }));
  }

  return { item, actionItems };
}

/**
 * Convert Slack message to TimelineItem
 */
export function slackMessageToTimelineItem(message: SlackMessage): TimelineItem {
  return {
    id: uuidv4(),
    type: 'slack' as ItemType,
    title: message.text.slice(0, 100) + (message.text.length > 100 ? '...' : ''),
    content: message.text,
    timestamp: message.timestamp,
    participants: [
      {
        id: message.userId,
        name: message.userName,
        role: 'author',
      },
    ],
    source: 'slack',
    sourceId: message.id,
    metadata: {
      channelId: message.channelId,
      threadTs: message.threadTs,
      reactions: message.reactions,
      files: message.files,
      replyCount: message.replyCount,
    },
  };
}

/**
 * Process Slack thread into a Thread
 */
export async function processSlackThread(slackThread: SlackThread): Promise<{
  thread: Partial<Thread>;
  items: TimelineItem[];
}> {
  const allMessages = [slackThread.parentMessage, ...slackThread.replies];
  const items = allMessages.map(slackMessageToTimelineItem);

  // Get AI summary
  const contentForAI = allMessages.map((m) => ({
    type: 'slack',
    content: m.text,
    date: m.timestamp,
    author: m.userName,
  }));

  const [summary, actionItemsRaw] = await Promise.all([
    summarizeThread(contentForAI),
    extractActionItems(allMessages.map((m) => m.text).join('\n\n')),
  ]);

  const participants: Participant[] = slackThread.participants.map((u) => ({
    id: u.id,
    name: u.realName || u.name,
    email: u.email,
    avatar: u.avatar,
    role: u.id === slackThread.parentMessage.userId ? 'author' : 'participant',
  }));

  const actionItems: ActionItem[] = actionItemsRaw.map((ai) => ({
    id: uuidv4(),
    text: ai.text,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }));

  // Generate title from parent message
  const parentText = slackThread.parentMessage.text;
  const title =
    parentText.length > 60 ? parentText.slice(0, 60) + '...' : parentText || 'Slack Thread';

  return {
    thread: {
      id: uuidv4(),
      title,
      summary: summary.summary,
      status: 'active',
      priority: 'medium',
      lastActivity: allMessages[allMessages.length - 1]?.timestamp,
      participants,
      itemCount: items.length,
      unresolvedCount: actionItems.filter((a) => a.status === 'pending').length,
      tags: summary.keyPoints.slice(0, 3),
      actionItems,
    },
    items,
  };
}

/**
 * Group items into threads based on similarity
 */
export async function autoGroupIntoThreads(
  items: TimelineItem[]
): Promise<Map<string, TimelineItem[]>> {
  const threads = new Map<string, TimelineItem[]>();

  // Group by source first
  const bySource = new Map<string, TimelineItem[]>();
  for (const item of items) {
    const sourceKey = `${item.source}-${item.sourceId?.split('-')[0] || 'unknown'}`;
    if (!bySource.has(sourceKey)) {
      bySource.set(sourceKey, []);
    }
    bySource.get(sourceKey)!.push(item);
  }

  // Use AI to suggest groupings for ungrouped items
  const ungrouped = items.filter((item) => !item.source);

  for (const item of ungrouped) {
    const classification = await classifyAndExtract(item.content || '');
    const threadKey = classification.topics[0] || 'general';

    if (!threads.has(threadKey)) {
      threads.set(threadKey, []);
    }
    threads.get(threadKey)!.push(item);
  }

  // Add source-grouped items
  for (const [key, groupItems] of bySource) {
    threads.set(key, groupItems);
  }

  return threads;
}

/**
 * Determine thread status based on activity and content
 */
export function determineThreadStatus(
  lastActivity: string,
  unresolvedCount: number,
  hasBlockers: boolean
): 'active' | 'stale' | 'blocked' | 'completed' {
  if (hasBlockers) return 'blocked';
  if (unresolvedCount === 0) return 'completed';

  const daysSinceActivity = Math.floor(
    (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceActivity > 7) return 'stale';
  return 'active';
}

/**
 * Generate smart suggestions for a thread
 */
export async function getThreadSuggestions(thread: Thread, items: TimelineItem[]) {
  const daysSinceActivity = Math.floor(
    (Date.now() - new Date(thread.lastActivity).getTime()) / (1000 * 60 * 60 * 24)
  );

  const suggestions = await generateSmartSuggestions(
    thread.title,
    items.map((i) => ({
      type: i.type,
      content: i.content || '',
      date: i.timestamp,
    })),
    thread.status,
    thread.unresolvedCount,
    thread.participants.length,
    daysSinceActivity
  );

  return suggestions;
}

/**
 * Merge new items into existing thread
 */
export function mergeItemsIntoThread(
  existingItems: TimelineItem[],
  newItems: TimelineItem[]
): TimelineItem[] {
  const existingIds = new Set(existingItems.map((i) => i.sourceId).filter(Boolean));

  const uniqueNewItems = newItems.filter(
    (item) => !item.sourceId || !existingIds.has(item.sourceId)
  );

  return [...existingItems, ...uniqueNewItems].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

/**
 * Calculate thread priority based on content
 */
export function calculatePriority(
  items: TimelineItem[],
  actionItems: ActionItem[]
): 'high' | 'medium' | 'low' {
  // High priority indicators
  const highPriorityKeywords = ['urgent', 'asap', 'critical', 'blocker', 'deadline', 'today'];
  const hasHighPriorityContent = items.some((item) =>
    highPriorityKeywords.some((kw) => item.content?.toLowerCase().includes(kw))
  );

  const hasOverdueItems = actionItems.some(
    (ai) => ai.dueDate && new Date(ai.dueDate) < new Date() && ai.status === 'pending'
  );

  if (hasHighPriorityContent || hasOverdueItems) return 'high';

  // Low priority: no pending items or very old
  if (actionItems.filter((a) => a.status === 'pending').length === 0) return 'low';

  return 'medium';
}

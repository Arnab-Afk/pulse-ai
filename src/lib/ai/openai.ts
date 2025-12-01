import OpenAI from 'openai';

// Lazy-load the OpenAI client to avoid initialization errors during build
let _openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!_openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    _openai = new OpenAI({ apiKey });
  }
  return _openai;
}

export interface ExtractedActionItem {
  text: string;
  assignee?: string;
  dueDate?: string;
  priority?: 'high' | 'medium' | 'low';
}

export interface ThreadSummary {
  summary: string;
  keyPoints: string[];
  decisions: string[];
  openQuestions: string[];
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
}

export interface SmartSuggestion {
  type: 'follow_up' | 'schedule_meeting' | 'add_participant' | 'resolve_blocker' | 'archive';
  title: string;
  description: string;
  priority: number;
  actionLabel: string;
}

/**
 * Extract action items from text content using AI
 */
export async function extractActionItems(content: string): Promise<ExtractedActionItem[]> {
  const openai = getOpenAIClient();
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are an AI assistant that extracts action items from conversations, emails, and meeting notes. 
Extract clear, actionable tasks with the following information:
- The task description (clear and concise)
- Who it's assigned to (if mentioned)
- Due date (if mentioned, in ISO format)
- Priority (high/medium/low based on urgency indicators)

Return JSON array of action items. If no action items found, return empty array.`,
      },
      {
        role: 'user',
        content: `Extract action items from the following content:\n\n${content}`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  try {
    const result = JSON.parse(response.choices[0].message.content || '{"actionItems": []}');
    return result.actionItems || [];
  } catch {
    return [];
  }
}

/**
 * Generate a summary of a thread's content
 */
export async function summarizeThread(
  items: { type: string; content: string; date: string; author?: string }[]
): Promise<ThreadSummary> {
  const formattedContent = items
    .map((item) => `[${item.type.toUpperCase()}] ${item.date}${item.author ? ` - ${item.author}` : ''}\n${item.content}`)
    .join('\n\n---\n\n');

  const openai = getOpenAIClient();
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are an AI assistant that summarizes conversation threads. Analyze the thread and provide:
1. A concise summary (2-3 sentences)
2. Key points discussed (bullet points)
3. Decisions made (if any)
4. Open questions that need resolution
5. Overall sentiment (positive/neutral/negative/mixed)

Return as JSON with fields: summary, keyPoints (array), decisions (array), openQuestions (array), sentiment.`,
      },
      {
        role: 'user',
        content: `Summarize this thread:\n\n${formattedContent}`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  try {
    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      summary: result.summary || 'Unable to generate summary.',
      keyPoints: result.keyPoints || [],
      decisions: result.decisions || [],
      openQuestions: result.openQuestions || [],
      sentiment: result.sentiment || 'neutral',
    };
  } catch {
    return {
      summary: 'Unable to generate summary.',
      keyPoints: [],
      decisions: [],
      openQuestions: [],
      sentiment: 'neutral',
    };
  }
}

/**
 * Generate smart suggestions for a thread based on its content and status
 */
export async function generateSmartSuggestions(
  threadTitle: string,
  items: { type: string; content: string; date: string }[],
  status: string,
  unresolvedCount: number,
  participantCount: number,
  lastActivityDays: number
): Promise<SmartSuggestion[]> {
  const recentItems = items.slice(0, 10);
  const formattedContent = recentItems
    .map((item) => `[${item.type}] ${item.content.slice(0, 200)}`)
    .join('\n');

  const openai = getOpenAIClient();
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are an AI assistant that provides actionable suggestions for managing conversation threads.
Based on the thread context, suggest 1-3 relevant actions. Consider:
- Unresolved items that need attention
- Stale threads that need follow-up
- Threads that might benefit from a meeting
- Missing stakeholders
- Threads ready to be archived

Return JSON with "suggestions" array containing objects with: type (follow_up|schedule_meeting|add_participant|resolve_blocker|archive), title, description, priority (1-5, 1 being highest), actionLabel.`,
      },
      {
        role: 'user',
        content: `Thread: "${threadTitle}"
Status: ${status}
Unresolved items: ${unresolvedCount}
Participants: ${participantCount}
Days since last activity: ${lastActivityDays}

Recent content:
${formattedContent}

Provide smart suggestions for this thread.`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.5,
  });

  try {
    const result = JSON.parse(response.choices[0].message.content || '{"suggestions": []}');
    return result.suggestions || [];
  } catch {
    return [];
  }
}

/**
 * Classify content type and extract metadata
 */
export async function classifyAndExtract(content: string): Promise<{
  suggestedType: string;
  title: string;
  participants: string[];
  topics: string[];
}> {
  const openai = getOpenAIClient();
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Analyze the content and extract:
1. Content type (email, meeting_notes, slack_message, document, task)
2. A short title (max 10 words)
3. Mentioned participants/people
4. Main topics/tags

Return JSON with: suggestedType, title, participants (array), topics (array).`,
      },
      {
        role: 'user',
        content,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  try {
    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      suggestedType: result.suggestedType || 'note',
      title: result.title || 'Untitled',
      participants: result.participants || [],
      topics: result.topics || [],
    };
  } catch {
    return {
      suggestedType: 'note',
      title: 'Untitled',
      participants: [],
      topics: [],
    };
  }
}

/**
 * Find related threads based on content similarity
 */
export async function findRelatedContent(
  content: string,
  existingThreads: { id: string; title: string; tags: string[] }[]
): Promise<{ threadId: string; relevanceScore: number; reason: string }[]> {
  if (existingThreads.length === 0) return [];

  const threadList = existingThreads
    .map((t) => `- ID: ${t.id}, Title: "${t.title}", Tags: [${t.tags.join(', ')}]`)
    .join('\n');

  const openai = getOpenAIClient();
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Given new content and a list of existing threads, identify which threads are most related.
Return JSON with "relatedThreads" array containing objects with: threadId, relevanceScore (0-1), reason.
Only include threads with relevanceScore > 0.5. Max 3 threads.`,
      },
      {
        role: 'user',
        content: `New content:\n${content}\n\nExisting threads:\n${threadList}`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  try {
    const result = JSON.parse(response.choices[0].message.content || '{"relatedThreads": []}');
    return result.relatedThreads || [];
  } catch {
    return [];
  }
}

/**
 * Generate embeddings for semantic search
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const openai = getOpenAIClient();
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });

  return response.data[0].embedding;
}

// Export the lazy client getter for direct access if needed
export { getOpenAIClient };

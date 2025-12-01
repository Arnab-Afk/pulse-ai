import { GoogleGenerativeAI } from '@google/generative-ai';

// Lazy-load the Gemini client
let _gemini: GoogleGenerativeAI | null = null;

export function getGeminiClient(): GoogleGenerativeAI {
  if (!_gemini) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    _gemini = new GoogleGenerativeAI(apiKey);
  }
  return _gemini;
}

export function isGeminiAvailable(): boolean {
  return !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here';
}

/**
 * Parse JSON from Gemini response, handling markdown code blocks
 */
function parseGeminiJSON(text: string): unknown {
  // Remove markdown code blocks if present
  let cleanText = text.trim();
  if (cleanText.startsWith('```json')) {
    cleanText = cleanText.slice(7);
  } else if (cleanText.startsWith('```')) {
    cleanText = cleanText.slice(3);
  }
  if (cleanText.endsWith('```')) {
    cleanText = cleanText.slice(0, -3);
  }
  return JSON.parse(cleanText.trim());
}

export interface GeminiExtractedActionItem {
  text: string;
  assignee?: string;
  dueDate?: string;
  priority?: 'high' | 'medium' | 'low';
}

export interface GeminiThreadSummary {
  summary: string;
  keyPoints: string[];
  decisions: string[];
  openQuestions: string[];
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
}

export interface GeminiSmartSuggestion {
  type: 'follow_up' | 'schedule_meeting' | 'add_participant' | 'resolve_blocker' | 'archive';
  title: string;
  description: string;
  priority: number;
  actionLabel: string;
}

/**
 * Extract action items using Gemini
 */
export async function extractActionItemsWithGemini(content: string): Promise<GeminiExtractedActionItem[]> {
  const gemini = getGeminiClient();
  const model = gemini.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

  const prompt = `You are an AI assistant that extracts action items from text.

Analyze this content and extract ALL action items (tasks, to-dos, requests, things someone needs to do):

---
${content}
---

For each action item, provide:
- text: The task description
- assignee: Who should do it (if mentioned)
- dueDate: When it's due (if mentioned, use ISO format like "2024-12-06")
- priority: "high", "medium", or "low" based on urgency

IMPORTANT: You MUST respond with ONLY valid JSON in this exact format:
{"actionItems": [{"text": "task description", "assignee": "person name", "priority": "medium"}]}

If there are no action items, respond with: {"actionItems": []}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log('Gemini raw response:', text);
    const parsed = parseGeminiJSON(text) as { actionItems?: GeminiExtractedActionItem[] };
    console.log('Gemini parsed:', parsed);
    return parsed.actionItems || [];
  } catch (error) {
    console.error('Gemini extraction error:', error);
    return [];
  }
}

/**
 * Generate thread summary using Gemini
 */
export async function summarizeThreadWithGemini(
  items: { type: string; content: string; date: string; author?: string }[]
): Promise<GeminiThreadSummary> {
  const gemini = getGeminiClient();
  const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const formattedContent = items
    .map((item) => `[${item.type.toUpperCase()}] ${item.date}${item.author ? ` - ${item.author}` : ''}\n${item.content}`)
    .join('\n\n---\n\n');

  const prompt = `You are an AI assistant that summarizes conversation threads. Analyze the thread and provide:
1. A concise summary (2-3 sentences)
2. Key points discussed (bullet points)
3. Decisions made (if any)
4. Open questions that need resolution
5. Overall sentiment (positive/neutral/negative/mixed)

Return ONLY a JSON object with fields: summary, keyPoints (array), decisions (array), openQuestions (array), sentiment.

Thread content:
${formattedContent}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const parsed = parseGeminiJSON(text) as Partial<GeminiThreadSummary>;
    return {
      summary: parsed.summary || 'Unable to generate summary.',
      keyPoints: parsed.keyPoints || [],
      decisions: parsed.decisions || [],
      openQuestions: parsed.openQuestions || [],
      sentiment: parsed.sentiment || 'neutral',
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
 * Generate smart suggestions using Gemini
 */
export async function generateSmartSuggestionsWithGemini(
  threadTitle: string,
  items: { type: string; content: string; date: string }[],
  status: string,
  unresolvedCount: number,
  participantCount: number,
  lastActivityDays: number
): Promise<GeminiSmartSuggestion[]> {
  const gemini = getGeminiClient();
  const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const recentItems = items.slice(0, 10);
  const formattedContent = recentItems
    .map((item) => `[${item.type}] ${item.content.slice(0, 200)}`)
    .join('\n');

  const prompt = `You are an AI assistant that provides actionable suggestions for managing conversation threads.
Based on the thread context, suggest 1-3 relevant actions. Consider:
- Unresolved items that need attention
- Stale threads that need follow-up
- Threads that might benefit from a meeting
- Missing stakeholders
- Threads ready to be archived

Return ONLY a JSON object with "suggestions" array containing objects with: type (follow_up|schedule_meeting|add_participant|resolve_blocker|archive), title, description, priority (1-5, 1 being highest), actionLabel.

Thread: "${threadTitle}"
Status: ${status}
Unresolved items: ${unresolvedCount}
Participants: ${participantCount}
Days since last activity: ${lastActivityDays}

Recent content:
${formattedContent}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const parsed = parseGeminiJSON(text) as { suggestions?: GeminiSmartSuggestion[] };
    return parsed.suggestions || [];
  } catch {
    return [];
  }
}

/**
 * Classify and extract metadata using Gemini
 */
export async function classifyAndExtractWithGemini(content: string): Promise<{
  suggestedType: string;
  title: string;
  participants: string[];
  topics: string[];
}> {
  const gemini = getGeminiClient();
  const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `Analyze the content and extract:
1. Content type (email, meeting_notes, slack_message, document, task)
2. A short title (max 10 words)
3. Mentioned participants/people
4. Main topics/tags

Return ONLY a JSON object with: suggestedType, title, participants (array), topics (array).

Content:
${content}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const parsed = parseGeminiJSON(text) as Partial<{
      suggestedType: string;
      title: string;
      participants: string[];
      topics: string[];
    }>;
    return {
      suggestedType: parsed.suggestedType || 'note',
      title: parsed.title || 'Untitled',
      participants: parsed.participants || [],
      topics: parsed.topics || [],
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
 * Find related threads using Gemini
 */
export async function findRelatedContentWithGemini(
  content: string,
  existingThreads: { id: string; title: string; tags: string[] }[]
): Promise<{ threadId: string; relevanceScore: number; reason: string }[]> {
  if (existingThreads.length === 0) return [];

  const gemini = getGeminiClient();
  const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const threadList = existingThreads
    .map((t) => `- ID: ${t.id}, Title: "${t.title}", Tags: [${t.tags.join(', ')}]`)
    .join('\n');

  const prompt = `Given new content and a list of existing threads, identify which threads are most related.
Return ONLY a JSON object with "relatedThreads" array containing objects with: threadId, relevanceScore (0-1), reason.
Only include threads with relevanceScore > 0.5. Max 3 threads.

New content:
${content}

Existing threads:
${threadList}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const parsed = parseGeminiJSON(text) as { relatedThreads?: { threadId: string; relevanceScore: number; reason: string }[] };
    return parsed.relatedThreads || [];
  } catch {
    return [];
  }
}

/**
 * Generate embeddings using Gemini
 */
export async function generateEmbeddingWithGemini(text: string): Promise<number[]> {
  const gemini = getGeminiClient();
  const model = gemini.getGenerativeModel({ model: 'text-embedding-004' });

  const result = await model.embedContent(text);
  return result.embedding.values;
}

export { getGeminiClient as default };

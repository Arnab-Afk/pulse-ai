import { NextResponse } from 'next/server';
import { 
  extractActionItems, 
  summarizeThread, 
  generateSmartSuggestions, 
  classifyAndExtract, 
  findRelatedContent, 
  generateEmbedding,
  getAIStatus
} from '@/lib/ai';

export async function GET() {
  // Return AI provider status
  const status = getAIStatus();
  return NextResponse.json(status);
}

export async function POST(request: Request) {
  try {
    const { action, data } = await request.json();

    switch (action) {
      case 'extract-action-items': {
        const { content } = data;
        if (!content) {
          return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }
        const actionItems = await extractActionItems(content);
        return NextResponse.json({ actionItems });
      }

      case 'summarize': {
        const { items } = data;
        if (!items || !Array.isArray(items)) {
          return NextResponse.json({ error: 'Items array is required' }, { status: 400 });
        }
        const summary = await summarizeThread(items);
        return NextResponse.json({ summary });
      }

      case 'suggestions': {
        const { threadTitle, items, status, unresolvedCount, participantCount, lastActivityDays } = data;
        const suggestions = await generateSmartSuggestions(
          threadTitle,
          items,
          status,
          unresolvedCount,
          participantCount,
          lastActivityDays
        );
        return NextResponse.json({ suggestions });
      }

      case 'classify': {
        const { content } = data;
        if (!content) {
          return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }
        const classification = await classifyAndExtract(content);
        return NextResponse.json({ classification });
      }

      case 'find-related': {
        const { content, existingThreads } = data;
        if (!content || !existingThreads) {
          return NextResponse.json({ error: 'Content and existingThreads are required' }, { status: 400 });
        }
        const related = await findRelatedContent(content, existingThreads);
        return NextResponse.json({ related });
      }

      case 'embed': {
        const { text } = data;
        if (!text) {
          return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }
        const embedding = await generateEmbedding(text);
        return NextResponse.json({ embedding });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('AI API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

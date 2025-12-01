/**
 * Unified AI Provider with automatic fallback support
 * 
 * This module provides a unified interface for AI operations,
 * automatically falling back from OpenAI to Gemini if OpenAI fails or is unavailable.
 */

import * as openai from './openai';
import * as gemini from './gemini';

export type AIProvider = 'openai' | 'gemini' | 'auto';

// Re-export types
export type { ExtractedActionItem, ThreadSummary, SmartSuggestion } from './openai';

/**
 * Check which AI providers are available
 */
export function getAvailableProviders(): { openai: boolean; gemini: boolean } {
  const openaiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  
  return {
    openai: !!openaiKey && openaiKey !== 'your_openai_api_key_here',
    gemini: !!geminiKey && geminiKey !== 'your_gemini_api_key_here',
  };
}

/**
 * Get the preferred provider based on environment config
 */
export function getPreferredProvider(): AIProvider {
  const configured = process.env.AI_PROVIDER?.toLowerCase();
  if (configured === 'gemini') return 'gemini';
  if (configured === 'openai') return 'openai';
  return 'auto';
}

/**
 * Determine which provider to use
 */
function resolveProvider(): 'openai' | 'gemini' {
  const available = getAvailableProviders();
  const preferred = getPreferredProvider();
  
  if (preferred === 'openai' && available.openai) return 'openai';
  if (preferred === 'gemini' && available.gemini) return 'gemini';
  
  // Auto mode: prefer OpenAI, fallback to Gemini
  if (available.openai) return 'openai';
  if (available.gemini) return 'gemini';
  
  throw new Error('No AI provider available. Please set OPENAI_API_KEY or GEMINI_API_KEY.');
}

/**
 * Execute with fallback - tries primary provider, falls back to secondary
 */
async function withFallback<T>(
  openaiFunc: () => Promise<T>,
  geminiFunc: () => Promise<T>
): Promise<T> {
  const available = getAvailableProviders();
  const primary = resolveProvider();
  
  try {
    if (primary === 'openai') {
      return await openaiFunc();
    } else {
      return await geminiFunc();
    }
  } catch (error) {
    // Try fallback if available
    const fallback = primary === 'openai' ? 'gemini' : 'openai';
    const fallbackAvailable = fallback === 'openai' ? available.openai : available.gemini;
    
    if (fallbackAvailable) {
      console.warn(`Primary AI provider (${primary}) failed, falling back to ${fallback}:`, error);
      if (fallback === 'openai') {
        return await openaiFunc();
      } else {
        return await geminiFunc();
      }
    }
    
    throw error;
  }
}

/**
 * Extract action items from text content using AI
 */
export async function extractActionItems(content: string) {
  return withFallback(
    () => openai.extractActionItems(content),
    () => gemini.extractActionItemsWithGemini(content)
  );
}

/**
 * Generate a summary of a thread's content
 */
export async function summarizeThread(
  items: { type: string; content: string; date: string; author?: string }[]
) {
  return withFallback(
    () => openai.summarizeThread(items),
    () => gemini.summarizeThreadWithGemini(items)
  );
}

/**
 * Generate smart suggestions for a thread
 */
export async function generateSmartSuggestions(
  threadTitle: string,
  items: { type: string; content: string; date: string }[],
  status: string,
  unresolvedCount: number,
  participantCount: number,
  lastActivityDays: number
) {
  return withFallback(
    () => openai.generateSmartSuggestions(threadTitle, items, status, unresolvedCount, participantCount, lastActivityDays),
    () => gemini.generateSmartSuggestionsWithGemini(threadTitle, items, status, unresolvedCount, participantCount, lastActivityDays)
  );
}

/**
 * Classify content type and extract metadata
 */
export async function classifyAndExtract(content: string) {
  return withFallback(
    () => openai.classifyAndExtract(content),
    () => gemini.classifyAndExtractWithGemini(content)
  );
}

/**
 * Find related threads based on content similarity
 */
export async function findRelatedContent(
  content: string,
  existingThreads: { id: string; title: string; tags: string[] }[]
) {
  return withFallback(
    () => openai.findRelatedContent(content, existingThreads),
    () => gemini.findRelatedContentWithGemini(content, existingThreads)
  );
}

/**
 * Generate embeddings for semantic search
 */
export async function generateEmbedding(text: string) {
  return withFallback(
    () => openai.generateEmbedding(text),
    () => gemini.generateEmbeddingWithGemini(text)
  );
}

/**
 * Get current AI provider status
 */
export function getAIStatus() {
  const available = getAvailableProviders();
  const preferred = getPreferredProvider();
  const active = available.openai || available.gemini ? resolveProvider() : null;
  
  return {
    available,
    preferred,
    active,
    ready: !!active,
  };
}

'use client';

import { useState, useCallback, useEffect } from 'react';
import type { ExtractedActionItem, ThreadSummary, SmartSuggestion } from '@/lib/ai';

interface AIStatus {
  available: { openai: boolean; gemini: boolean };
  preferred: 'openai' | 'gemini' | 'auto';
  active: 'openai' | 'gemini' | null;
  ready: boolean;
}

interface AIHook {
  isLoading: boolean;
  error: string | null;
  status: AIStatus | null;
  extractActionItems: (content: string) => Promise<ExtractedActionItem[]>;
  summarizeThread: (items: { type: string; content: string; date: string; author?: string }[]) => Promise<ThreadSummary>;
  getSuggestions: (params: {
    threadTitle: string;
    items: { type: string; content: string; date: string }[];
    status: string;
    unresolvedCount: number;
    participantCount: number;
    lastActivityDays: number;
  }) => Promise<SmartSuggestion[]>;
  classifyContent: (content: string) => Promise<{
    suggestedType: string;
    title: string;
    participants: string[];
    topics: string[];
  }>;
  findRelated: (content: string, existingThreads: { id: string; title: string; tags: string[] }[]) => Promise<{
    threadId: string;
    relevanceScore: number;
    reason: string;
  }[]>;
  refreshStatus: () => Promise<void>;
}

export function useAI(): AIHook {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<AIStatus | null>(null);

  const refreshStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/ai');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch {
      // Status check failed, AI may not be configured
      setStatus({ available: { openai: false, gemini: false }, preferred: 'auto', active: null, ready: false });
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const apiCall = useCallback(async (action: string, data: Record<string, unknown>) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, data }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API request failed');
      }

      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const extractActionItems = useCallback(async (content: string) => {
    const result = await apiCall('extract-action-items', { content });
    return result.actionItems;
  }, [apiCall]);

  const summarizeThread = useCallback(async (items: { type: string; content: string; date: string; author?: string }[]) => {
    const result = await apiCall('summarize', { items });
    return result.summary;
  }, [apiCall]);

  const getSuggestions = useCallback(async (params: {
    threadTitle: string;
    items: { type: string; content: string; date: string }[];
    status: string;
    unresolvedCount: number;
    participantCount: number;
    lastActivityDays: number;
  }) => {
    const result = await apiCall('suggestions', params);
    return result.suggestions;
  }, [apiCall]);

  const classifyContent = useCallback(async (content: string) => {
    const result = await apiCall('classify', { content });
    return result.classification;
  }, [apiCall]);

  const findRelated = useCallback(async (content: string, existingThreads: { id: string; title: string; tags: string[] }[]) => {
    const result = await apiCall('find-related', { content, existingThreads });
    return result.related;
  }, [apiCall]);

  return {
    isLoading,
    error,
    status,
    extractActionItems,
    summarizeThread,
    getSuggestions,
    classifyContent,
    findRelated,
    refreshStatus,
  };
}

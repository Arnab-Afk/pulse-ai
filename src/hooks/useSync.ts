'use client';

import { useState, useCallback } from 'react';
import type { Thread, TimelineItem } from '@/types';

interface SyncStatus {
  isRunning: boolean;
  lastSync: string | null;
  error: string | null;
}

interface SyncResult {
  newThreads: Thread[];
  updatedThreads: Thread[];
  newItems: TimelineItem[];
  errors: { source: string; error: string }[];
  summary: {
    newThreads: number;
    newItems: number;
    errors: number;
  };
}

interface UseSyncReturn {
  status: SyncStatus;
  connectedSources: string[];
  sync: (options?: { sources?: string[]; lookbackDays?: number; processWithAI?: boolean }) => Promise<SyncResult | null>;
  checkConnections: () => Promise<void>;
}

export function useSync(): UseSyncReturn {
  const [status, setStatus] = useState<SyncStatus>({
    isRunning: false,
    lastSync: null,
    error: null,
  });
  const [connectedSources, setConnectedSources] = useState<string[]>([]);

  const checkConnections = useCallback(async () => {
    try {
      const response = await fetch('/api/sync');
      const data = await response.json();
      setConnectedSources(data.availableSources || []);
    } catch (error) {
      console.error('Failed to check connections:', error);
    }
  }, []);

  const sync = useCallback(async (options?: { sources?: string[]; lookbackDays?: number; processWithAI?: boolean }): Promise<SyncResult | null> => {
    setStatus((prev) => ({ ...prev, isRunning: true, error: null }));

    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sources: options?.sources || connectedSources,
          lookbackDays: options?.lookbackDays || 7,
          processWithAI: options?.processWithAI ?? true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Sync failed');
      }

      const result = await response.json();
      
      setStatus({
        isRunning: false,
        lastSync: new Date().toISOString(),
        error: result.errors?.length > 0 ? `${result.errors.length} source(s) had errors` : null,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setStatus((prev) => ({
        ...prev,
        isRunning: false,
        error: errorMessage,
      }));
      return null;
    }
  }, [connectedSources]);

  return {
    status,
    connectedSources,
    sync,
    checkConnections,
  };
}

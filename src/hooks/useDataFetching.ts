'use client';

import { useState, useCallback } from 'react';
import type { GmailMessage } from '@/lib/integrations/gmail';
import type { CalendarEvent } from '@/lib/integrations/calendar';
import type { SlackMessage, SlackChannel } from '@/lib/integrations/slack';

interface DataFetchingHook {
  isLoading: boolean;
  error: string | null;
  // Gmail
  fetchEmails: (options?: { maxResults?: number; query?: string; after?: string }) => Promise<GmailMessage[]>;
  searchEmails: (query: string, maxResults?: number) => Promise<GmailMessage[]>;
  // Calendar
  fetchUpcomingEvents: (options?: { maxResults?: number; timeMin?: string; timeMax?: string }) => Promise<CalendarEvent[]>;
  fetchPastEvents: (options?: { maxResults?: number; daysBack?: number }) => Promise<CalendarEvent[]>;
  searchEvents: (query: string, maxResults?: number) => Promise<CalendarEvent[]>;
  // Slack
  fetchSlackChannels: () => Promise<SlackChannel[]>;
  fetchChannelMessages: (channelId: string, limit?: number) => Promise<SlackMessage[]>;
  searchSlackMessages: (query: string, count?: number) => Promise<SlackMessage[]>;
}

export function useDataFetching(): DataFetchingHook {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiCall = useCallback(async (endpoint: string, action: string, data?: Record<string, unknown>) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/integrations/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, data: data || {} }),
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

  // Gmail methods
  const fetchEmails = useCallback(async (options?: { maxResults?: number; query?: string; after?: string }) => {
    const result = await apiCall('gmail', 'fetch-recent', options);
    return result.emails;
  }, [apiCall]);

  const searchEmails = useCallback(async (query: string, maxResults = 20) => {
    const result = await apiCall('gmail', 'search', { query, maxResults });
    return result.emails;
  }, [apiCall]);

  // Calendar methods
  const fetchUpcomingEvents = useCallback(async (options?: { maxResults?: number; timeMin?: string; timeMax?: string }) => {
    const result = await apiCall('calendar', 'upcoming', options);
    return result.events;
  }, [apiCall]);

  const fetchPastEvents = useCallback(async (options?: { maxResults?: number; daysBack?: number }) => {
    const result = await apiCall('calendar', 'past', options);
    return result.events;
  }, [apiCall]);

  const searchEvents = useCallback(async (query: string, maxResults = 20) => {
    const result = await apiCall('calendar', 'search', { query, maxResults });
    return result.events;
  }, [apiCall]);

  // Slack methods
  const fetchSlackChannels = useCallback(async () => {
    const result = await apiCall('slack', 'channels', {});
    return result.channels;
  }, [apiCall]);

  const fetchChannelMessages = useCallback(async (channelId: string, limit = 50) => {
    const result = await apiCall('slack', 'channel-messages', { channelId, limit });
    return result.messages;
  }, [apiCall]);

  const searchSlackMessages = useCallback(async (query: string, count = 20) => {
    const result = await apiCall('slack', 'search', { query, count });
    return result.messages;
  }, [apiCall]);

  return {
    isLoading,
    error,
    fetchEmails,
    searchEmails,
    fetchUpcomingEvents,
    fetchPastEvents,
    searchEvents,
    fetchSlackChannels,
    fetchChannelMessages,
    searchSlackMessages,
  };
}

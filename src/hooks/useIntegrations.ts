'use client';

import { useState, useEffect, useCallback } from 'react';

interface IntegrationStatus {
  gmail: { connected: boolean; email?: string };
  calendar: { connected: boolean; primaryCalendar?: { id: string; name: string } };
  slack: { connected: boolean; user?: { name: string; email?: string } };
}

interface UseIntegrationsReturn {
  status: IntegrationStatus;
  isLoading: boolean;
  error: string | null;
  connectGmail: () => Promise<void>;
  connectCalendar: () => Promise<void>;
  connectSlack: () => Promise<void>;
  disconnectGmail: () => Promise<void>;
  disconnectCalendar: () => Promise<void>;
  disconnectSlack: () => Promise<void>;
  refreshStatus: () => Promise<void>;
}

const defaultStatus: IntegrationStatus = {
  gmail: { connected: false },
  calendar: { connected: false },
  slack: { connected: false },
};

export function useIntegrations(): UseIntegrationsReturn {
  const [status, setStatus] = useState<IntegrationStatus>(defaultStatus);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [gmailRes, calendarRes, slackRes] = await Promise.all([
        fetch('/api/integrations/gmail?action=status'),
        fetch('/api/integrations/calendar?action=status'),
        fetch('/api/integrations/slack?action=status'),
      ]);

      const [gmail, calendar, slack] = await Promise.all([
        gmailRes.json(),
        calendarRes.json(),
        slackRes.json(),
      ]);

      setStatus({ gmail, calendar, slack });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check integration status');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const connectGmail = useCallback(async () => {
    try {
      const response = await fetch('/api/integrations/gmail?action=auth-url');
      const { authUrl } = await response.json();
      window.location.href = authUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect Gmail');
    }
  }, []);

  const connectCalendar = useCallback(async () => {
    try {
      const response = await fetch('/api/integrations/calendar?action=auth-url');
      const { authUrl } = await response.json();
      window.location.href = authUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect Calendar');
    }
  }, []);

  const connectSlack = useCallback(async () => {
    try {
      const response = await fetch('/api/integrations/slack?action=auth-url');
      const { authUrl } = await response.json();
      window.location.href = authUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect Slack');
    }
  }, []);

  const disconnectGmail = useCallback(async () => {
    try {
      await fetch('/api/integrations/gmail', {
        method: 'DELETE',
      });
      setStatus((prev) => ({ ...prev, gmail: { connected: false } }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect Gmail');
    }
  }, []);

  const disconnectCalendar = useCallback(async () => {
    try {
      await fetch('/api/integrations/calendar', {
        method: 'DELETE',
      });
      setStatus((prev) => ({ ...prev, calendar: { connected: false } }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect Calendar');
    }
  }, []);

  const disconnectSlack = useCallback(async () => {
    try {
      await fetch('/api/integrations/slack', {
        method: 'DELETE',
      });
      setStatus((prev) => ({ ...prev, slack: { connected: false } }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect Slack');
    }
  }, []);

  return {
    status,
    isLoading,
    error,
    connectGmail,
    connectCalendar,
    connectSlack,
    disconnectGmail,
    disconnectCalendar,
    disconnectSlack,
    refreshStatus,
  };
}

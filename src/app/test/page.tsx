'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, Calendar, Sparkles, RefreshCw } from 'lucide-react';

interface EmailItem {
  id: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
}

interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  attendees?: { email: string }[];
}

export default function TestPage() {
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [aiResult, setAiResult] = useState<string>('');
  const [loading, setLoading] = useState<{ emails: boolean; calendar: boolean; ai: boolean }>({
    emails: false,
    calendar: false,
    ai: false,
  });
  const [errors, setErrors] = useState<{ emails?: string; calendar?: string; ai?: string }>({});

  const fetchEmails = async () => {
    setLoading((l) => ({ ...l, emails: true }));
    setErrors((e) => ({ ...e, emails: undefined }));
    try {
      const res = await fetch('/api/integrations/gmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fetch-recent', data: { maxResults: 5 } }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setEmails(data.emails || []);
    } catch (err) {
      setErrors((e) => ({ ...e, emails: err instanceof Error ? err.message : 'Failed to fetch emails' }));
    } finally {
      setLoading((l) => ({ ...l, emails: false }));
    }
  };

  const fetchCalendar = async () => {
    setLoading((l) => ({ ...l, calendar: true }));
    setErrors((e) => ({ ...e, calendar: undefined }));
    try {
      const res = await fetch('/api/integrations/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'upcoming', data: { maxResults: 5 } }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setEvents(data.events || []);
    } catch (err) {
      setErrors((e) => ({ ...e, calendar: err instanceof Error ? err.message : 'Failed to fetch events' }));
    } finally {
      setLoading((l) => ({ ...l, calendar: false }));
    }
  };

  const testAI = async () => {
    setLoading((l) => ({ ...l, ai: true }));
    setErrors((e) => ({ ...e, ai: undefined }));
    try {
      const testContent = `Hi team,

Just a reminder about our upcoming deadlines:

1. Sarah - Please send me the Q4 budget projections by Friday
2. Mike - Schedule a meeting with the finance team for Thursday at 2pm
3. Everyone - Submit your timesheets by end of day today
4. John - Review the marketing proposal and provide feedback by Monday

Also, we need to finalize the product roadmap before the board meeting next week.

Thanks,
Alex`;

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'extract-action-items', data: { content: testContent } }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.details || data.error);
      setAiResult(JSON.stringify(data.actionItems, null, 2));
    } catch (err) {
      setErrors((e) => ({ ...e, ai: err instanceof Error ? err.message : 'AI test failed' }));
    } finally {
      setLoading((l) => ({ ...l, ai: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
          🧪 Integration Test Page
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gmail Test */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-red-500" />
                Gmail Emails
              </CardTitle>
              <Button onClick={fetchEmails} disabled={loading.emails} size="sm">
                {loading.emails ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                <span className="ml-2">Fetch</span>
              </Button>
            </CardHeader>
            <CardContent>
              {errors.emails && (
                <p className="text-red-500 text-sm mb-4">{errors.emails}</p>
              )}
              {emails.length === 0 ? (
                <p className="text-gray-500 text-sm">Click "Fetch" to load your recent emails</p>
              ) : (
                <ul className="space-y-3">
                  {emails.map((email) => (
                    <li key={email.id} className="border-b pb-3">
                      <p className="font-medium text-sm">{email.subject || '(No Subject)'}</p>
                      <p className="text-xs text-gray-500">{email.from}</p>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">{email.snippet}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Calendar Test */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                Calendar Events
              </CardTitle>
              <Button onClick={fetchCalendar} disabled={loading.calendar} size="sm">
                {loading.calendar ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                <span className="ml-2">Fetch</span>
              </Button>
            </CardHeader>
            <CardContent>
              {errors.calendar && (
                <p className="text-red-500 text-sm mb-4">{errors.calendar}</p>
              )}
              {events.length === 0 ? (
                <p className="text-gray-500 text-sm">Click "Fetch" to load your upcoming events</p>
              ) : (
                <ul className="space-y-3">
                  {events.map((event) => (
                    <li key={event.id} className="border-b pb-3">
                      <p className="font-medium text-sm">{event.summary || '(No Title)'}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(event.start.dateTime || event.start.date || '').toLocaleString()}
                      </p>
                      {event.attendees && (
                        <p className="text-xs text-gray-400 mt-1">
                          {event.attendees.length} attendee(s)
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* AI Test */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                AI Action Item Extraction
              </CardTitle>
              <Button onClick={testAI} disabled={loading.ai} size="sm">
                {loading.ai ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                <span className="ml-2">Test AI</span>
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Tests extracting action items from a sample email using Gemini AI.
              </p>
              {errors.ai && (
                <p className="text-red-500 text-sm mb-4">{errors.ai}</p>
              )}
              {aiResult ? (
                <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm overflow-auto max-h-64">
                  {aiResult}
                </pre>
              ) : (
                <p className="text-gray-500 text-sm">Click "Test AI" to extract action items from a sample email</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h2 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">How it works:</h2>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• <strong>Gmail:</strong> Fetches your 5 most recent emails using the Gmail API</li>
            <li>• <strong>Calendar:</strong> Fetches your next 5 upcoming events using the Calendar API</li>
            <li>• <strong>AI:</strong> Sends a sample email to Gemini to extract action items</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

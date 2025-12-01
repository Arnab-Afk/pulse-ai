'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useIntegrations } from '@/hooks/useIntegrations';
import { Mail, Calendar, MessageSquare, Check, X, Loader2, ExternalLink, Settings2, Zap, Shield } from 'lucide-react';

function getNotificationFromParams(success: string | null, error: string | null): { type: 'success' | 'error'; message: string } | null {
  if (success) {
    const messages: Record<string, string> = {
      gmail_connected: 'Gmail connected successfully!',
      calendar_connected: 'Google Calendar connected successfully!',
      slack_connected: 'Slack connected successfully!',
    };
    return { type: 'success', message: messages[success] || 'Connected successfully!' };
  } else if (error) {
    const messages: Record<string, string> = {
      gmail_auth_denied: 'Gmail authorization was denied.',
      gmail_auth_failed: 'Failed to connect Gmail. Please try again.',
      calendar_auth_denied: 'Calendar authorization was denied.',
      calendar_auth_failed: 'Failed to connect Calendar. Please try again.',
      slack_auth_denied: 'Slack authorization was denied.',
      slack_auth_failed: 'Failed to connect Slack. Please try again.',
    };
    return { type: 'error', message: messages[error] || 'Connection failed.' };
  }
  return null;
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const { status, isLoading, connectGmail, connectCalendar, connectSlack, disconnectGmail, disconnectCalendar, disconnectSlack, refreshStatus } = useIntegrations();
  
  // Get initial notification from URL params
  const success = searchParams.get('success');
  const error = searchParams.get('error');
  const initialNotification = getNotificationFromParams(success, error);
  
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(initialNotification);
  const hasRefreshed = useRef(false);

  // Refresh status once when there's a success notification
  useEffect(() => {
    if (success && !hasRefreshed.current) {
      hasRefreshed.current = true;
      refreshStatus();
    }
  }, [success, refreshStatus]);

  // Clear notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const integrations = [
    {
      id: 'gmail',
      name: 'Gmail',
      description: 'Import emails and automatically extract action items from conversations.',
      icon: Mail,
      color: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      connected: status.gmail.connected,
      details: status.gmail.email ? `Connected as ${status.gmail.email}` : undefined,
      onConnect: connectGmail,
      onDisconnect: disconnectGmail,
    },
    {
      id: 'calendar',
      name: 'Google Calendar',
      description: 'Sync meetings and automatically link them to related threads.',
      icon: Calendar,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      connected: status.calendar.connected,
      details: status.calendar.primaryCalendar ? `Primary: ${status.calendar.primaryCalendar.name}` : undefined,
      onConnect: connectCalendar,
      onDisconnect: disconnectCalendar,
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Import messages and threads from your Slack workspace.',
      icon: MessageSquare,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      connected: status.slack.connected,
      details: status.slack.user ? `Connected as ${status.slack.user.name}` : undefined,
      onConnect: connectSlack,
      onDisconnect: disconnectSlack,
    },
  ];

  return (
    <>
      {/* Notification */}
      {notification && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            notification.type === 'success'
              ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-200'
              : 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-200'
          }`}
        >
          {notification.type === 'success' ? (
            <Check className="h-5 w-5 flex-shrink-0" />
          ) : (
            <X className="h-5 w-5 flex-shrink-0" />
          )}
          {notification.message}
        </div>
      )}

      {/* Integrations Section */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          Integrations
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Connect your accounts to automatically import and process your communications.
        </p>

        <div className="space-y-4">
          {integrations.map((integration) => {
            const Icon = integration.icon;
            return (
              <div
                key={integration.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${integration.bgColor}`}>
                      <Icon className={`h-6 w-6 ${integration.color}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {integration.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {integration.description}
                      </p>
                      {integration.connected && integration.details && (
                        <p className="text-sm text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
                          <Check className="h-4 w-4" />
                          {integration.details}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                    ) : integration.connected ? (
                      <button
                        onClick={integration.onDisconnect}
                        className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        Disconnect
                      </button>
                    ) : (
                      <button
                        onClick={integration.onConnect}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-2 transition-colors"
                      >
                        Connect
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* AI Processing Section */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-indigo-500" />
          AI Processing
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Auto-extract Action Items</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Automatically identify tasks and action items from your communications.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Generate Thread Summaries</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Create AI-powered summaries of conversation threads.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Smart Suggestions</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Receive AI-powered suggestions for follow-ups and next steps.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Section */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-500" />
          Privacy & Security
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Your data is encrypted in transit and at rest.</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>We only access the data you explicitly authorize.</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>AI processing happens securely and your data is not used to train models.</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>You can disconnect integrations and delete your data at any time.</span>
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Settings2 className="h-8 w-8 text-indigo-500" />
            Settings
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your integrations and configure how Pulse AI collects and processes your data.
          </p>
        </div>

        <Suspense fallback={
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        }>
          <SettingsContent />
        </Suspense>
      </div>
    </div>
  );
}

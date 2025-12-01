"use client"

import * as React from 'react';
import { Thread } from '@/types';
import { Button } from './ui/button';
import { 
    AlertTriangle, 
    Calendar, 
    UserPlus, 
    Lightbulb, 
    CheckCircle2,
    ArrowRight,
    Sparkles,
    Clock,
    TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SmartSuggestionsProps {
    thread: Thread;
}

interface Suggestion {
    id: string;
    type: 'warning' | 'info' | 'success' | 'insight';
    title: string;
    message: string;
    action: string;
    icon: React.ElementType;
    priority: number;
}

export function SmartSuggestions({ thread }: SmartSuggestionsProps) {
    const [dismissedSuggestions, setDismissedSuggestions] = React.useState<string[]>([]);

    const suggestions: Suggestion[] = React.useMemo(() => {
        const items: Suggestion[] = [];

        if (thread.unresolvedCount > 0) {
            items.push({
                id: 'unresolved',
                type: 'warning',
                title: 'Unresolved Items',
                message: `You have ${thread.unresolvedCount} item${thread.unresolvedCount > 1 ? 's' : ''} requiring attention in this thread.`,
                action: 'Review Items',
                icon: AlertTriangle,
                priority: 1,
            });
        }

        if (thread.itemCount > 5) {
            items.push({
                id: 'schedule',
                type: 'info',
                title: 'Schedule a Sync',
                message: 'There\'s been a lot of async activity. Consider scheduling a quick sync meeting.',
                action: 'Schedule Meeting',
                icon: Calendar,
                priority: 2,
            });
        }

        if (thread.participants.length < 3) {
            items.push({
                id: 'invite',
                type: 'info',
                title: 'Missing Stakeholders?',
                message: 'Consider adding more stakeholders for better visibility and faster decisions.',
                action: 'Add People',
                icon: UserPlus,
                priority: 3,
            });
        }

        // AI insights
        if (thread.itemCount > 8) {
            items.push({
                id: 'summary',
                type: 'insight',
                title: 'Thread Summary Available',
                message: 'AI can generate a summary of this long thread to help catch up quickly.',
                action: 'Generate Summary',
                icon: Sparkles,
                priority: 2,
            });
        }

        if (thread.status === 'stale') {
            items.push({
                id: 'stale',
                type: 'warning',
                title: 'Thread Going Stale',
                message: 'No activity in the past 7 days. Consider following up or archiving.',
                action: 'Follow Up',
                icon: Clock,
                priority: 1,
            });
        }

        // Success suggestion if things are going well
        if (thread.unresolvedCount === 0 && thread.status === 'active') {
            items.push({
                id: 'complete',
                type: 'success',
                title: 'All Caught Up!',
                message: 'No pending items. Consider marking progress or updating status.',
                action: 'Update Status',
                icon: CheckCircle2,
                priority: 4,
            });
        }

        return items
            .filter(s => !dismissedSuggestions.includes(s.id))
            .sort((a, b) => a.priority - b.priority);
    }, [thread, dismissedSuggestions]);

    const handleDismiss = (id: string) => {
        setDismissedSuggestions(prev => [...prev, id]);
    };

    const getStyles = (type: Suggestion['type']) => {
        switch (type) {
            case 'warning':
                return {
                    bg: 'bg-amber-50 dark:bg-amber-900/20',
                    border: 'border-amber-200 dark:border-amber-800',
                    icon: 'text-amber-600 dark:text-amber-400',
                    title: 'text-amber-800 dark:text-amber-300',
                    text: 'text-amber-700 dark:text-amber-300/80',
                    button: 'text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40',
                };
            case 'info':
                return {
                    bg: 'bg-blue-50 dark:bg-blue-900/20',
                    border: 'border-blue-200 dark:border-blue-800',
                    icon: 'text-blue-600 dark:text-blue-400',
                    title: 'text-blue-800 dark:text-blue-300',
                    text: 'text-blue-700 dark:text-blue-300/80',
                    button: 'text-blue-900 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900/40',
                };
            case 'success':
                return {
                    bg: 'bg-green-50 dark:bg-green-900/20',
                    border: 'border-green-200 dark:border-green-800',
                    icon: 'text-green-600 dark:text-green-400',
                    title: 'text-green-800 dark:text-green-300',
                    text: 'text-green-700 dark:text-green-300/80',
                    button: 'text-green-900 dark:text-green-200 hover:bg-green-100 dark:hover:bg-green-900/40',
                };
            case 'insight':
                return {
                    bg: 'bg-violet-50 dark:bg-violet-900/20',
                    border: 'border-violet-200 dark:border-violet-800',
                    icon: 'text-violet-600 dark:text-violet-400',
                    title: 'text-violet-800 dark:text-violet-300',
                    text: 'text-violet-700 dark:text-violet-300/80',
                    button: 'text-violet-900 dark:text-violet-200 hover:bg-violet-100 dark:hover:bg-violet-900/40',
                };
        }
    };

    if (suggestions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3 mb-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-sm font-medium">All caught up!</p>
                <p className="text-xs text-muted-foreground mt-1">
                    No suggestions at this time.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {suggestions.map((suggestion) => {
                const styles = getStyles(suggestion.type);
                const Icon = suggestion.icon;

                return (
                    <div
                        key={suggestion.id}
                        className={cn(
                            "rounded-lg p-3 border transition-all hover:shadow-sm",
                            styles.bg,
                            styles.border
                        )}
                    >
                        <div className="flex items-start gap-3">
                            <div className={cn("mt-0.5", styles.icon)}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={cn("font-medium text-sm", styles.title)}>
                                    {suggestion.title}
                                </p>
                                <p className={cn("text-sm mt-0.5", styles.text)}>
                                    {suggestion.message}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                    <button
                                        className={cn(
                                            "inline-flex items-center text-xs font-semibold px-2 py-1 rounded transition-colors",
                                            styles.button
                                        )}
                                    >
                                        {suggestion.action}
                                        <ArrowRight className="w-3 h-3 ml-1" />
                                    </button>
                                    <button
                                        onClick={() => handleDismiss(suggestion.id)}
                                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

"use client"

import * as React from 'react';
import { TimelineItem } from '@/types';
import { format, formatDistanceToNow } from 'date-fns';
import { Mail, Calendar, FileText, CheckSquare, MessageSquare, MoreHorizontal, ExternalLink, Copy, Reply } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar } from './ui/avatar';
import { Button } from './ui/button';
import {
    Dropdown,
    DropdownTrigger,
    DropdownContent,
    DropdownItem,
} from './ui/dropdown';

interface TimelineViewProps {
    items: TimelineItem[];
    participants?: { id: string; name: string; avatar?: string }[];
}

const TypeIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'email': return <Mail className="w-4 h-4" />;
        case 'meeting': return <Calendar className="w-4 h-4" />;
        case 'note': return <FileText className="w-4 h-4" />;
        case 'todo': return <CheckSquare className="w-4 h-4" />;
        case 'slack': return <MessageSquare className="w-4 h-4" />;
        default: return <MessageSquare className="w-4 h-4" />;
    }
};

const TypeStyles = (type: string) => {
    switch (type) {
        case 'email': 
            return { 
                bg: 'bg-blue-100 dark:bg-blue-900/40', 
                text: 'text-blue-600 dark:text-blue-400',
                label: 'Email'
            };
        case 'meeting': 
            return { 
                bg: 'bg-purple-100 dark:bg-purple-900/40', 
                text: 'text-purple-600 dark:text-purple-400',
                label: 'Meeting'
            };
        case 'note': 
            return { 
                bg: 'bg-yellow-100 dark:bg-yellow-900/40', 
                text: 'text-yellow-600 dark:text-yellow-400',
                label: 'Note'
            };
        case 'todo': 
            return { 
                bg: 'bg-green-100 dark:bg-green-900/40', 
                text: 'text-green-600 dark:text-green-400',
                label: 'To-do'
            };
        case 'slack': 
            return { 
                bg: 'bg-pink-100 dark:bg-pink-900/40', 
                text: 'text-pink-600 dark:text-pink-400',
                label: 'Slack'
            };
        default: 
            return { 
                bg: 'bg-gray-100 dark:bg-gray-800', 
                text: 'text-gray-600 dark:text-gray-400',
                label: 'Message'
            };
    }
};

export function TimelineView({ items, participants }: TimelineViewProps) {
    const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set());

    const toggleExpand = (id: string) => {
        setExpandedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    // Group items by date
    const groupedItems = React.useMemo(() => {
        const groups: { date: string; items: TimelineItem[] }[] = [];
        let currentDate = '';
        
        items.forEach(item => {
            const itemDate = format(new Date(item.timestamp), 'MMMM d, yyyy');
            if (itemDate !== currentDate) {
                currentDate = itemDate;
                groups.push({ date: itemDate, items: [item] });
            } else {
                groups[groups.length - 1].items.push(item);
            }
        });
        
        return groups;
    }, [items]);

    return (
        <div className="space-y-8">
            {groupedItems.map((group, groupIndex) => (
                <div key={group.date}>
                    {/* Date header */}
                    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="h-px flex-1 bg-border" />
                            <span className="text-sm font-medium text-muted-foreground px-3 py-1 bg-muted rounded-full">
                                {group.date}
                            </span>
                            <div className="h-px flex-1 bg-border" />
                        </div>
                    </div>

                    {/* Items */}
                    <div className="relative pl-8 border-l-2 border-border space-y-6">
                        {group.items.map((item, index) => {
                            const styles = TypeStyles(item.type);
                            const isExpanded = expandedItems.has(item.id);
                            const hasLongContent = (item.content?.length || 0) > 200;

                            return (
                                <div key={item.id} className="relative group">
                                    {/* Timeline dot */}
                                    <div className={cn(
                                        "absolute -left-[41px] top-3 w-10 h-10 rounded-full flex items-center justify-center border-4 border-background shadow-sm transition-transform group-hover:scale-110",
                                        styles.bg, styles.text
                                    )}>
                                        <TypeIcon type={item.type} />
                                    </div>

                                    {/* Content card */}
                                    <div className="bg-card border rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                                        {/* Header */}
                                        <div className="flex items-start justify-between gap-4 mb-3">
                                            <div className="flex items-center gap-3">
                                                <Avatar
                                                    src={item.participants?.[0]?.avatar || `https://i.pravatar.cc/150?u=${item.participants?.[0]?.id || 'default'}`}
                                                    alt={item.participants?.[0]?.name || 'Author'}
                                                    size="sm"
                                                />
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={cn(
                                                            "text-xs font-medium px-2 py-0.5 rounded-full",
                                                            styles.bg, styles.text
                                                        )}>
                                                            {styles.label}
                                                        </span>
                                                        {item.title && (
                                                            <span className="font-medium text-sm">
                                                                {item.title}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">
                                                        {format(new Date(item.timestamp), 'h:mm a')} · {formatDistanceToNow(new Date(item.timestamp))} ago
                                                    </span>
                                                </div>
                                            </div>

                                            <Dropdown>
                                                <DropdownTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownTrigger>
                                                <DropdownContent align="end">
                                                    <DropdownItem>
                                                        <Reply className="w-4 h-4 mr-2" />
                                                        Reply
                                                    </DropdownItem>
                                                    <DropdownItem>
                                                        <Copy className="w-4 h-4 mr-2" />
                                                        Copy
                                                    </DropdownItem>
                                                    <DropdownItem>
                                                        <ExternalLink className="w-4 h-4 mr-2" />
                                                        Open Original
                                                    </DropdownItem>
                                                </DropdownContent>
                                            </Dropdown>
                                        </div>

                                        {/* Content */}
                                        <div className="text-sm text-foreground/90 leading-relaxed">
                                            {hasLongContent && !isExpanded ? (
                                                <>
                                                    {item.content?.slice(0, 200)}...
                                                    <button
                                                        onClick={() => toggleExpand(item.id)}
                                                        className="text-violet-600 dark:text-violet-400 font-medium ml-1 hover:underline"
                                                    >
                                                        Read more
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    {item.content}
                                                    {hasLongContent && (
                                                        <button
                                                            onClick={() => toggleExpand(item.id)}
                                                            className="text-violet-600 dark:text-violet-400 font-medium ml-1 hover:underline block mt-1"
                                                        >
                                                            Show less
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>


                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}

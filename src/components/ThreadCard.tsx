import Link from 'next/link';
import { Thread } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarGroup } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, Clock, ArrowRight, Tag, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import {
    Dropdown,
    DropdownTrigger,
    DropdownContent,
    DropdownItem,
    DropdownSeparator,
} from './ui/dropdown';

interface ThreadCardProps {
    thread: Thread;
    viewMode?: 'grid' | 'list';
}

export function ThreadCard({ thread, viewMode = 'grid' }: ThreadCardProps) {
    if (viewMode === 'list') {
        return (
            <Link href={`/threads/${thread.id}`} className="block">
                <div className="border rounded-lg p-4 hover:bg-muted/50 transition-all hover:shadow-md bg-card text-card-foreground group">
                    <div className="flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                                <h3 className="font-semibold text-base truncate group-hover:text-violet-600 transition-colors">
                                    {thread.title}
                                </h3>
                                <Badge variant={thread.status as any} className="shrink-0">
                                    {thread.status}
                                </Badge>
                                {thread.priority === 'high' && (
                                    <Badge variant="destructive" className="text-xs shrink-0">
                                        High Priority
                                    </Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    {formatDistanceToNow(new Date(thread.lastActivity))} ago
                                </span>
                                {thread.tags.length > 0 && (
                                    <span className="flex items-center gap-1">
                                        <Tag className="w-3.5 h-3.5" />
                                        {thread.tags.slice(0, 2).join(', ')}
                                        {thread.tags.length > 2 && ` +${thread.tags.length - 2}`}
                                    </span>
                                )}
                            </div>
                        </div>
                        <AvatarGroup max={3} size="sm">
                            {thread.participants.map((p) => (
                                <Avatar
                                    key={p.id}
                                    src={p.avatar}
                                    alt={p.name}
                                    size="sm"
                                />
                            ))}
                        </AvatarGroup>
                        {thread.unresolvedCount > 0 && (
                            <div className="flex items-center text-amber-600 text-sm font-medium shrink-0">
                                <AlertCircle className="w-4 h-4 mr-1" />
                                {thread.unresolvedCount}
                            </div>
                        )}
                        <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                </div>
            </Link>
        );
    }

    return (
        <Link href={`/threads/${thread.id}`} className="block group">
            <div className="border rounded-xl p-5 hover:bg-muted/30 transition-all hover:shadow-lg hover:border-violet-200 dark:hover:border-violet-800 bg-card text-card-foreground h-full">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate group-hover:text-violet-600 transition-colors">
                            {thread.title}
                        </h3>
                        <div className="flex items-center text-sm text-muted-foreground mt-1.5">
                            <Clock className="w-4 h-4 mr-1.5" />
                            <span>Active {formatDistanceToNow(new Date(thread.lastActivity))} ago</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 ml-3">
                        <Badge variant={thread.status as any}>{thread.status}</Badge>
                        {thread.priority === 'high' && (
                            <Badge variant="destructive" className="text-xs">High</Badge>
                        )}
                    </div>
                </div>

                {/* Tags */}
                {thread.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                        {thread.tags.slice(0, 3).map((tag) => (
                            <span
                                key={tag}
                                className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                            >
                                {tag}
                            </span>
                        ))}
                        {thread.tags.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                                +{thread.tags.length - 3} more
                            </span>
                        )}
                    </div>
                )}

                <div className="flex justify-between items-end mt-auto pt-2">
                    <AvatarGroup max={4} size="md">
                        {thread.participants.map((p) => (
                            <Avatar
                                key={p.id}
                                src={p.avatar}
                                alt={p.name}
                                size="md"
                            />
                        ))}
                    </AvatarGroup>

                    {thread.unresolvedCount > 0 && (
                        <div className="flex items-center text-amber-600 dark:text-amber-400 text-sm font-medium bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-full">
                            <AlertCircle className="w-4 h-4 mr-1.5" />
                            {thread.unresolvedCount} open
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}

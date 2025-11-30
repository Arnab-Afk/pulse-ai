import Link from 'next/link';
import { Thread } from '@/types';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Users, AlertCircle, Clock } from 'lucide-react';

interface ThreadCardProps {
    thread: Thread;
}

export function ThreadCard({ thread }: ThreadCardProps) {
    return (
        <Link href={`/threads/${thread.id}`} className="block">
            <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors bg-card text-card-foreground shadow-sm">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="font-semibold text-lg">{thread.title}</h3>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <Clock className="w-4 h-4 mr-1" />
                            <span>Last active {formatDistanceToNow(new Date(thread.lastActivity))} ago</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <Badge variant={thread.status as any}>{thread.status}</Badge>
                        {thread.priority === 'high' && (
                            <Badge variant="destructive" className="text-xs">High Priority</Badge>
                        )}
                    </div>
                </div>

                <div className="flex justify-between items-end mt-4">
                    <div className="flex -space-x-2">
                        {thread.participants.slice(0, 3).map((p) => (
                            <img
                                key={p.id}
                                src={p.avatar || `https://ui-avatars.com/api/?name=${p.name}`}
                                alt={p.name}
                                className="w-8 h-8 rounded-full border-2 border-background"
                                title={p.name}
                            />
                        ))}
                        {thread.participants.length > 3 && (
                            <div className="w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium">
                                +{thread.participants.length - 3}
                            </div>
                        )}
                    </div>

                    {thread.unresolvedCount > 0 && (
                        <div className="flex items-center text-amber-600 text-sm font-medium">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {thread.unresolvedCount} unresolved
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}

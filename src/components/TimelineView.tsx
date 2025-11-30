import { TimelineItem } from '@/types';
import { format } from 'date-fns';
import { Mail, Calendar, FileText, CheckSquare, MessageSquare, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelineViewProps {
    items: TimelineItem[];
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

const TypeColor = (type: string) => {
    switch (type) {
        case 'email': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
        case 'meeting': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
        case 'note': return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400';
        case 'todo': return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
        case 'slack': return 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400';
        default: return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    }
};

export function TimelineView({ items }: TimelineViewProps) {
    return (
        <div className="relative pl-6 border-l border-border space-y-8">
            {items.map((item, index) => (
                <div key={item.id} className="relative">
                    {/* Dot on the timeline */}
                    <div className={cn(
                        "absolute -left-[33px] top-1 w-8 h-8 rounded-full flex items-center justify-center border-4 border-background",
                        TypeColor(item.type)
                    )}>
                        <TypeIcon type={item.type} />
                    </div>

                    <div className="bg-card border rounded-lg p-4 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold capitalize">{item.type}</span>
                                {item.title && <span className="text-muted-foreground">• {item.title}</span>}
                            </div>
                            <span className="text-xs text-muted-foreground">
                                {format(new Date(item.date), 'MMM d, h:mm a')}
                            </span>
                        </div>

                        <p className="text-sm text-foreground/90 whitespace-pre-wrap mb-3">
                            {item.content}
                        </p>

                        {item.actionItems && item.actionItems.length > 0 && (
                            <div className="mt-3 bg-muted/50 rounded p-3 text-sm">
                                <p className="font-medium mb-2 text-xs uppercase tracking-wider text-muted-foreground">Action Items</p>
                                <ul className="space-y-1">
                                    {item.actionItems.map(ai => (
                                        <li key={ai.id} className="flex items-center gap-2">
                                            <div className={cn(
                                                "w-4 h-4 rounded border flex items-center justify-center",
                                                ai.isCompleted ? "bg-green-500 border-green-500 text-white" : "border-muted-foreground"
                                            )}>
                                                {ai.isCompleted && <CheckSquare className="w-3 h-3" />}
                                            </div>
                                            <span className={ai.isCompleted ? "line-through text-muted-foreground" : ""}>
                                                {ai.text}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

"use client"

import * as React from 'react';
import { TimelineItem } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Mail, Calendar, FileText, CheckSquare, MessageSquare, GitBranch, ArrowRight } from 'lucide-react';

interface GraphViewProps {
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
        case 'email': return { bg: 'bg-blue-100 dark:bg-blue-900/40', border: 'border-blue-300 dark:border-blue-700', text: 'text-blue-600 dark:text-blue-400' };
        case 'meeting': return { bg: 'bg-purple-100 dark:bg-purple-900/40', border: 'border-purple-300 dark:border-purple-700', text: 'text-purple-600 dark:text-purple-400' };
        case 'note': return { bg: 'bg-yellow-100 dark:bg-yellow-900/40', border: 'border-yellow-300 dark:border-yellow-700', text: 'text-yellow-600 dark:text-yellow-400' };
        case 'todo': return { bg: 'bg-green-100 dark:bg-green-900/40', border: 'border-green-300 dark:border-green-700', text: 'text-green-600 dark:text-green-400' };
        case 'slack': return { bg: 'bg-pink-100 dark:bg-pink-900/40', border: 'border-pink-300 dark:border-pink-700', text: 'text-pink-600 dark:text-pink-400' };
        default: return { bg: 'bg-gray-100 dark:bg-gray-800', border: 'border-gray-300 dark:border-gray-700', text: 'text-gray-600 dark:text-gray-400' };
    }
};

export function GraphView({ items }: GraphViewProps) {
    const [selectedNode, setSelectedNode] = React.useState<string | null>(null);

    // Group items by date for better visualization
    const groupedByType = React.useMemo(() => {
        const groups: Record<string, TimelineItem[]> = {};
        items.forEach(item => {
            if (!groups[item.type]) groups[item.type] = [];
            groups[item.type].push(item);
        });
        return groups;
    }, [items]);

    const types = Object.keys(groupedByType);

    return (
        <div className="min-h-[500px] bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl border p-6 overflow-auto">
            <div className="flex items-center gap-2 mb-6">
                <GitBranch className="w-5 h-5 text-violet-500" />
                <h3 className="font-semibold">Context Graph</h3>
                <span className="text-sm text-muted-foreground ml-auto">
                    {items.length} items across {types.length} types
                </span>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mb-8">
                {types.map(type => {
                    const colors = TypeColor(type);
                    return (
                        <div key={type} className="flex items-center gap-2">
                            <div className={cn("w-3 h-3 rounded-full", colors.bg, colors.border, "border")} />
                            <span className="text-sm capitalize">{type}</span>
                            <span className="text-xs text-muted-foreground">({groupedByType[type].length})</span>
                        </div>
                    );
                })}
            </div>

            {/* Graph visualization */}
            <div className="relative">
                {/* Central node */}
                <div className="flex justify-center mb-12">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/25 animate-pulse-ring">
                        <span className="text-white font-bold text-lg">Thread</span>
                    </div>
                </div>

                {/* Type branches */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
                    {types.map((type, typeIndex) => {
                        const colors = TypeColor(type);
                        const typeItems = groupedByType[type];
                        
                        return (
                            <div key={type} className="space-y-4">
                                {/* Type header */}
                                <div className={cn(
                                    "flex items-center gap-2 p-3 rounded-lg border-2",
                                    colors.bg, colors.border
                                )}>
                                    <div className={cn("p-1.5 rounded", colors.text)}>
                                        <TypeIcon type={type} />
                                    </div>
                                    <span className="font-medium capitalize">{type}</span>
                                </div>

                                {/* Items */}
                                <div className="space-y-2 pl-4 border-l-2 border-dashed border-muted-foreground/20">
                                    {typeItems.slice(0, 4).map((item, index) => (
                                        <div
                                            key={item.id}
                                            className={cn(
                                                "relative p-3 rounded-lg border bg-card cursor-pointer transition-all hover:shadow-md",
                                                selectedNode === item.id && "ring-2 ring-violet-500 shadow-md"
                                            )}
                                            onClick={() => setSelectedNode(selectedNode === item.id ? null : item.id)}
                                        >
                                            {/* Connection line */}
                                            <div className="absolute -left-[17px] top-1/2 w-4 h-0.5 bg-muted-foreground/20" />
                                            <div className="absolute -left-[21px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-muted-foreground/40" />

                                            <p className="text-xs text-muted-foreground mb-1">
                                                {format(new Date(item.timestamp), 'MMM d, h:mm a')}
                                            </p>
                                            <p className="text-sm line-clamp-2">
                                                {item.title || (item.content?.slice(0, 50) ?? 'No content')}...
                                            </p>
                                        </div>
                                    ))}
                                    
                                    {typeItems.length > 4 && (
                                        <div className="text-center text-sm text-muted-foreground py-2">
                                            +{typeItems.length - 4} more
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Selected node details */}
                {selectedNode && (
                    <div className="mt-8 p-4 bg-card rounded-lg border shadow-lg animate-in">
                        {(() => {
                            const item = items.find(i => i.id === selectedNode);
                            if (!item) return null;
                            const colors = TypeColor(item.type);
                            
                            return (
                                <>
                                    <div className="flex items-start justify-between mb-3">
                                        <div className={cn("flex items-center gap-2 px-2 py-1 rounded", colors.bg, colors.text)}>
                                            <TypeIcon type={item.type} />
                                            <span className="text-sm font-medium capitalize">{item.type}</span>
                                        </div>
                                        <span className="text-sm text-muted-foreground">
                                            {format(new Date(item.timestamp), 'MMMM d, yyyy h:mm a')}
                                        </span>
                                    </div>
                                    {item.title && <h4 className="font-semibold mb-2">{item.title}</h4>}
                                    <p className="text-sm text-muted-foreground">{item.content ?? 'No content'}</p>
                                </>
                            );
                        })()}
                    </div>
                )}
            </div>
        </div>
    );
}

"use client"

import * as React from 'react';
import { getThreadById, generateItems } from '@/lib/mockData';
import { TimelineView } from '@/components/TimelineView';
import { GraphView } from '@/components/GraphView';
import { SmartSuggestions } from '@/components/SmartSuggestions';
import { AppLayout } from '@/components/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarGroup } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
    Dropdown,
    DropdownTrigger,
    DropdownContent,
    DropdownItem,
    DropdownSeparator,
} from '@/components/ui/dropdown';
import Link from 'next/link';
import {
    ArrowLeft,
    MoreHorizontal,
    Share2,
    Archive,
    Star,
    Bell,
    BellOff,
    Trash2,
    Edit2,
    UserPlus,
    FileText,
    ExternalLink,
    Copy,
    Clock,
    Folder,
    MessageSquare,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { notFound, useParams } from 'next/navigation';

export default function ThreadPage() {
    const params = useParams();
    const id = params.id as string;
    const thread = getThreadById(id);
    
    const [isStarred, setIsStarred] = React.useState(false);
    const [isNotificationsOn, setIsNotificationsOn] = React.useState(true);

    if (!thread) {
        notFound();
    }

    // Generate items for the timeline
    const items = React.useMemo(() => generateItems(thread.id, thread.itemCount), [thread.id, thread.itemCount]);

    const completedItems = thread.actionItems?.filter(ai => ai.status === 'completed').length || 0;
    const totalItems = thread.actionItems?.length || 0;
    const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

    return (
        <AppLayout>
            {/* Breadcrumb & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <Link href="/">
                        <Button variant="ghost" size="sm" className="gap-1.5">
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </Button>
                    </Link>
                    <div className="h-4 w-px bg-border" />
                    <nav className="flex items-center text-sm text-muted-foreground">
                        <Link href="/" className="hover:text-foreground transition-colors">
                            Threads
                        </Link>
                        <span className="mx-2">/</span>
                        <span className="text-foreground font-medium truncate max-w-[200px]">
                            {thread.title}
                        </span>
                    </nav>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsStarred(!isStarred)}
                        className={isStarred ? "text-yellow-500" : ""}
                    >
                        <Star className={`w-5 h-5 ${isStarred ? "fill-current" : ""}`} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsNotificationsOn(!isNotificationsOn)}
                    >
                        {isNotificationsOn ? (
                            <Bell className="w-5 h-5" />
                        ) : (
                            <BellOff className="w-5 h-5" />
                        )}
                    </Button>
                    <Button variant="outline" size="sm">
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                    </Button>
                    <Dropdown>
                        <DropdownTrigger asChild>
                            <Button variant="outline" size="icon">
                                <MoreHorizontal className="w-5 h-5" />
                            </Button>
                        </DropdownTrigger>
                        <DropdownContent align="end">
                            <DropdownItem>
                                <Edit2 className="w-4 h-4 mr-2" />
                                Edit Thread
                            </DropdownItem>
                            <DropdownItem>
                                <UserPlus className="w-4 h-4 mr-2" />
                                Add Participant
                            </DropdownItem>
                            <DropdownItem>
                                <Copy className="w-4 h-4 mr-2" />
                                Duplicate
                            </DropdownItem>
                            <DropdownItem>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Open in New Tab
                            </DropdownItem>
                            <DropdownSeparator />
                            <DropdownItem>
                                <Archive className="w-4 h-4 mr-2" />
                                Archive
                            </DropdownItem>
                            <DropdownItem className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                            </DropdownItem>
                        </DropdownContent>
                    </Dropdown>
                </div>
            </div>

            {/* Thread Header */}
            <div className="bg-card border rounded-xl p-6 mb-6">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
                                {thread.title}
                            </h1>
                            <Badge variant={thread.status as any} className="text-sm">
                                {thread.status}
                            </Badge>
                            {thread.priority === 'high' && (
                                <Badge variant="destructive">High Priority</Badge>
                            )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4" />
                                Last active {formatDistanceToNow(new Date(thread.lastActivity))} ago
                            </span>
                            <span className="flex items-center gap-1.5">
                                <MessageSquare className="w-4 h-4" />
                                {thread.itemCount} items
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Folder className="w-4 h-4" />
                                {thread.tags.join(', ')}
                            </span>
                        </div>

                        {/* Progress Bar */}
                        {totalItems > 0 && (
                            <div className="mt-4 max-w-md">
                                <div className="flex items-center justify-between text-sm mb-1.5">
                                    <span className="text-muted-foreground">Action items progress</span>
                                    <span className="font-medium">{completedItems}/{totalItems} completed</span>
                                </div>
                                <Progress 
                                    value={progressPercentage} 
                                    className="h-2"
                                    indicatorClassName="bg-gradient-to-r from-violet-500 to-indigo-500"
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm text-muted-foreground mb-1">Participants</p>
                            <p className="font-medium">{thread.participants.length} people</p>
                        </div>
                        <AvatarGroup max={4} size="lg">
                            {thread.participants.map((p) => (
                                <Avatar
                                    key={p.id}
                                    src={p.avatar}
                                    alt={p.name}
                                    size="lg"
                                />
                            ))}
                        </AvatarGroup>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Timeline/Content */}
                <div className="lg:col-span-2">
                    <Card>
                        <Tabs defaultValue="timeline" className="w-full">
                            <CardHeader className="pb-0">
                                <TabsList className="w-full sm:w-auto">
                                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                                    <TabsTrigger value="graph">Graph View</TabsTrigger>
                                    <TabsTrigger value="files">Files</TabsTrigger>
                                </TabsList>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <TabsContent value="timeline" className="mt-0">
                                    <TimelineView items={items} />
                                </TabsContent>
                                <TabsContent value="graph" className="mt-0">
                                    <GraphView items={items} />
                                </TabsContent>
                                <TabsContent value="files" className="mt-0">
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                                        <h3 className="font-semibold mb-2">No files yet</h3>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Files attached to this thread will appear here
                                        </p>
                                        <Button variant="outline">
                                            Upload File
                                        </Button>
                                    </div>
                                </TabsContent>
                            </CardContent>
                        </Tabs>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Smart Suggestions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-violet-500 to-indigo-500">
                                    <Star className="h-3.5 w-3.5 text-white" />
                                </span>
                                Smart Suggestions
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <SmartSuggestions thread={thread} />
                        </CardContent>
                    </Card>

                    {/* Participants */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">Participants</CardTitle>
                            <Button variant="ghost" size="sm">
                                <UserPlus className="w-4 h-4 mr-1" />
                                Add
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                {thread.participants.map(p => (
                                    <li key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                                        <Avatar
                                            src={p.avatar}
                                            alt={p.name}
                                            size="md"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{p.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{p.role}</p>
                                        </div>
                                        {p.id === 'u1' && (
                                            <Badge variant="secondary" className="text-xs">You</Badge>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Quick Stats */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Activity</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Total items</span>
                                <span className="font-medium">{thread.itemCount}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Unresolved</span>
                                <span className="font-medium text-amber-600">{thread.unresolvedCount}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Created</span>
                                <span className="font-medium">
                                    {format(new Date(thread.lastActivity), 'MMM d, yyyy')}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Tags</span>
                                <div className="flex gap-1">
                                    {thread.tags.slice(0, 2).map(tag => (
                                        <Badge key={tag} variant="secondary" className="text-xs">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

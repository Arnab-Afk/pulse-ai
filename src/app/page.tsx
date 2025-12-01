"use client"

import * as React from "react"
import { MOCK_THREADS } from '@/lib/mockData';
import { ThreadCard } from '@/components/ThreadCard';
import { AppLayout } from '@/components/AppLayout';
import { StatsCards } from '@/components/StatsCards';
import { CreateThreadDialog } from '@/components/CreateThreadDialog';
import { NoThreads, NoSearchResults } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Search, Filter, SlidersHorizontal, LayoutGrid, List, Sparkles } from 'lucide-react';
import { Thread } from '@/types';

export default function Home() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [threads, setThreads] = React.useState<Thread[]>(MOCK_THREADS)
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid")

  const filteredThreads = React.useMemo(() => {
    if (!searchQuery) return threads
    return threads.filter(
      (thread) =>
        thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        thread.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }, [threads, searchQuery])

  const activeThreads = filteredThreads.filter(t => t.status === 'active');
  const staleThreads = filteredThreads.filter(t => t.status === 'stale');
  const completedThreads = filteredThreads.filter(t => t.status === 'completed');

  const stats = {
    activeThreads: MOCK_THREADS.filter(t => t.status === 'active').length,
    unresolvedItems: MOCK_THREADS.reduce((sum, t) => sum + t.unresolvedCount, 0),
    completedThisWeek: MOCK_THREADS.filter(t => t.status === 'completed').length,
    avgResponseTime: "2.4h",
  }

  const handleCreateThread = (newThread: { title: string; priority: string; tags: string[] }) => {
    const thread: Thread = {
      id: `t${Date.now()}`,
      title: newThread.title,
      status: 'active',
      priority: newThread.priority as Thread['priority'],
      participants: [{ id: 'u1', name: 'You', role: 'Product Manager', email: 'me@pulse.ai' }],
      itemCount: 0,
      lastActivity: new Date().toISOString(),
      unresolvedCount: 0,
      tags: newThread.tags,
    }
    setThreads([thread, ...threads])
  }

  return (
    <AppLayout>
      {/* Hero Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              Welcome back
              <Sparkles className="h-6 w-6 text-violet-500" />
            </h1>
            <p className="text-muted-foreground mt-1">
              Your intelligent memory palace for every project.
            </p>
          </div>
          <CreateThreadDialog onCreateThread={handleCreateThread} />
        </div>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} />

      {/* Threads Section */}
      <div className="mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search threads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Sort
            </Button>
            <div className="border-l pl-2 ml-2 flex items-center gap-1">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {filteredThreads.length === 0 ? (
          searchQuery ? (
            <NoSearchResults query={searchQuery} />
          ) : (
            <NoThreads onCreateThread={() => {}} />
          )
        ) : (
          <Tabs defaultValue="active" className="space-y-6">
            <TabsList>
              <TabsTrigger value="active">
                Active
                <span className="ml-2 rounded-full bg-violet-100 dark:bg-violet-900/30 px-2 py-0.5 text-xs font-medium text-violet-600 dark:text-violet-400">
                  {activeThreads.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="stale">
                Needs Attention
                {staleThreads.length > 0 && (
                  <span className="ml-2 rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                    {staleThreads.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed
                <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {completedThreads.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              {activeThreads.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No active threads
                </div>
              ) : (
                <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" : "space-y-3"}>
                  {activeThreads.map(thread => (
                    <ThreadCard key={thread.id} thread={thread} viewMode={viewMode} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="stale">
              {staleThreads.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No stale threads - great job keeping up!
                </div>
              ) : (
                <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" : "space-y-3"}>
                  {staleThreads.map(thread => (
                    <ThreadCard key={thread.id} thread={thread} viewMode={viewMode} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed">
              {completedThreads.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No completed threads yet
                </div>
              ) : (
                <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 opacity-75" : "space-y-3 opacity-75"}>
                  {completedThreads.map(thread => (
                    <ThreadCard key={thread.id} thread={thread} viewMode={viewMode} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="all">
              <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" : "space-y-3"}>
                {filteredThreads.map(thread => (
                  <ThreadCard key={thread.id} thread={thread} viewMode={viewMode} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
}

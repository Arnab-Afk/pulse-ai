import { MOCK_THREADS } from '@/lib/mockData';
import { ThreadCard } from '@/components/ThreadCard';
import { Search, Plus } from 'lucide-react';

export default function Home() {
  const activeThreads = MOCK_THREADS.filter(t => t.status === 'active');
  const staleThreads = MOCK_THREADS.filter(t => t.status === 'stale');
  const completedThreads = MOCK_THREADS.filter(t => t.status === 'completed');

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Context Threads</h1>
            <p className="text-muted-foreground mt-1">
              Your intelligent memory palace for every project.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search threads..."
                className="pl-9 h-10 w-64 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
              <Plus className="mr-2 h-4 w-4" />
              New Thread
            </button>
          </div>
        </header>

        <main className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              Active Threads
              <span className="ml-2 text-sm font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {activeThreads.length}
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeThreads.map(thread => (
                <ThreadCard key={thread.id} thread={thread} />
              ))}
            </div>
          </section>

          {staleThreads.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4 text-amber-600 flex items-center">
                Stale Threads
                <span className="ml-2 text-sm font-normal text-amber-600/80 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                  {staleThreads.length}
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {staleThreads.map(thread => (
                  <ThreadCard key={thread.id} thread={thread} />
                ))}
              </div>
            </section>
          )}

          {completedThreads.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4 text-muted-foreground">Completed</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-75">
                {completedThreads.map(thread => (
                  <ThreadCard key={thread.id} thread={thread} />
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

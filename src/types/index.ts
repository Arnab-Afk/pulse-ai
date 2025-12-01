export type ThreadStatus = 'active' | 'stale' | 'blocked' | 'completed';
export type ThreadPriority = 'high' | 'medium' | 'low';
export type ItemType = 'email' | 'meeting' | 'note' | 'todo' | 'slack';

export interface Participant {
    id: string;
    name: string;
    role: string;
    avatar?: string;
    email?: string;
}

export interface TimelineItem {
    id: string;
    type: ItemType;
    timestamp: string; // ISO string
    title?: string;
    content?: string;
    participants?: Participant[];
    source?: string;
    sourceId?: string;
    metadata?: Record<string, unknown>;
}

export interface ActionItem {
    id: string;
    text: string;
    assignee?: Participant;
    status: 'pending' | 'completed';
    dueDate?: string;
    createdAt: string;
}

export interface Thread {
    id: string;
    title: string;
    summary?: string;
    status: ThreadStatus;
    priority: ThreadPriority;
    participants: Participant[];
    lastActivity: string;
    itemCount: number;
    unresolvedCount: number;
    tags: string[];
    actionItems?: ActionItem[];
}

// Re-export for backwards compatibility
export type { TimelineItem as TimelineEvent };


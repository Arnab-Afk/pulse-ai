export type ThreadStatus = 'active' | 'stale' | 'blocked' | 'completed';
export type ThreadPriority = 'high' | 'medium' | 'low';
export type ItemType = 'email' | 'meeting' | 'note' | 'todo' | 'slack';

export interface Participant {
    id: string;
    name: string;
    role: string;
    avatar?: string;
    email: string;
}

export interface TimelineItem {
    id: string;
    type: ItemType;
    date: string; // ISO string
    authorId: string;
    title?: string;
    content: string;
    actionItems?: ActionItem[];
    metadata?: Record<string, any>;
}

export interface ActionItem {
    id: string;
    text: string;
    assigneeId?: string;
    isCompleted: boolean;
    dueDate?: string;
}

export interface Thread {
    id: string;
    title: string;
    status: ThreadStatus;
    priority: ThreadPriority;
    participants: Participant[];
    items: TimelineItem[];
    lastActivity: string;
    unresolvedCount: number;
    tags: string[];
}

import { Thread, Participant, TimelineItem } from '@/types';
import { addDays, subDays, formatISO } from 'date-fns';

const USERS: Participant[] = [
    { id: 'u1', name: 'You', role: 'Product Manager', email: 'me@pulse.ai' },
    { id: 'u2', name: 'Sarah Chen', role: 'Engineering Lead', email: 'sarah@pulse.ai', avatar: 'https://i.pravatar.cc/150?u=sarah' },
    { id: 'u3', name: 'Mike Johnson', role: 'DevOps Engineer', email: 'mike@pulse.ai', avatar: 'https://i.pravatar.cc/150?u=mike' },
    { id: 'u4', name: 'Lisa Park', role: 'Designer', email: 'lisa@pulse.ai', avatar: 'https://i.pravatar.cc/150?u=lisa' },
];

const generateItems = (threadId: string, count: number): TimelineItem[] => {
    const items: TimelineItem[] = [];
    for (let i = 0; i < count; i++) {
        const type = ['email', 'meeting', 'note', 'slack'][Math.floor(Math.random() * 4)] as any;
        const author = USERS[Math.floor(Math.random() * USERS.length)];

        items.push({
            id: `item-${threadId}-${i}`,
            type,
            date: formatISO(subDays(new Date(), Math.floor(Math.random() * 10))),
            authorId: author.id,
            content: `This is a sample ${type} content for thread ${threadId}. We discussed important things.`,
            title: type === 'email' || type === 'meeting' ? `Update regarding ${threadId}` : undefined,
            actionItems: Math.random() > 0.7 ? [{ id: `ai-${i}`, text: 'Follow up on this', isCompleted: Math.random() > 0.5 }] : [],
        });
    }
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const MOCK_THREADS: Thread[] = [
    {
        id: 't1',
        title: 'Atlas Project Launch',
        status: 'active',
        priority: 'high',
        participants: USERS,
        items: generateItems('t1', 12),
        lastActivity: formatISO(new Date()),
        unresolvedCount: 3,
        tags: ['launch', 'atlas', 'q4'],
    },
    {
        id: 't2',
        title: 'Q4 Budget Planning',
        status: 'active',
        priority: 'medium',
        participants: [USERS[0], USERS[1]],
        items: generateItems('t2', 8),
        lastActivity: formatISO(subDays(new Date(), 1)),
        unresolvedCount: 1,
        tags: ['budget', 'finance'],
    },
    {
        id: 't3',
        title: 'Website Redesign',
        status: 'stale',
        priority: 'low',
        participants: [USERS[0], USERS[3]],
        items: generateItems('t3', 5),
        lastActivity: formatISO(subDays(new Date(), 14)),
        unresolvedCount: 2,
        tags: ['design', 'website'],
    },
];

export const getThreadById = (id: string) => MOCK_THREADS.find(t => t.id === id);

import { Thread, Participant, TimelineItem } from '@/types';
import { subDays, formatISO } from 'date-fns';

const USERS: Participant[] = [
    { id: 'u1', name: 'You', role: 'Product Manager', email: 'me@pulse.ai' },
    { id: 'u2', name: 'Sarah Chen', role: 'Engineering Lead', email: 'sarah@pulse.ai', avatar: 'https://i.pravatar.cc/150?u=sarah' },
    { id: 'u3', name: 'Mike Johnson', role: 'DevOps Engineer', email: 'mike@pulse.ai', avatar: 'https://i.pravatar.cc/150?u=mike' },
    { id: 'u4', name: 'Lisa Park', role: 'Designer', email: 'lisa@pulse.ai', avatar: 'https://i.pravatar.cc/150?u=lisa' },
];

export const generateItems = (threadId: string, count: number): TimelineItem[] => {
    const items: TimelineItem[] = [];
    for (let i = 0; i < count; i++) {
        const type = (['email', 'meeting', 'note', 'slack'] as const)[Math.floor(Math.random() * 4)];
        const author = USERS[Math.floor(Math.random() * USERS.length)];

        items.push({
            id: `item-${threadId}-${i}`,
            type,
            timestamp: formatISO(subDays(new Date(), Math.floor(Math.random() * 10))),
            content: `This is a sample ${type} content for thread ${threadId}. We discussed important things.`,
            title: type === 'email' || type === 'meeting' ? `Update regarding ${threadId}` : undefined,
            participants: [author],
        });
    }
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const MOCK_THREADS: Thread[] = [
    {
        id: 't1',
        title: 'Atlas Project Launch',
        summary: 'Coordinating the launch of the Atlas project with all stakeholders. Key milestones include finalizing the marketing plan, completing the technical review, and setting up the deployment pipeline.',
        status: 'active',
        priority: 'high',
        participants: USERS,
        itemCount: 12,
        lastActivity: formatISO(new Date()),
        unresolvedCount: 3,
        tags: ['launch', 'atlas', 'q4'],
        actionItems: [
            { id: 'ai-1', text: 'Finalize marketing materials', status: 'pending', createdAt: formatISO(subDays(new Date(), 2)) },
            { id: 'ai-2', text: 'Complete security review', status: 'pending', createdAt: formatISO(subDays(new Date(), 3)), assignee: USERS[2] },
            { id: 'ai-3', text: 'Set up CI/CD pipeline', status: 'completed', createdAt: formatISO(subDays(new Date(), 5)), assignee: USERS[1] },
        ],
    },
    {
        id: 't2',
        title: 'Q4 Budget Planning',
        summary: 'Working through the Q4 budget allocation with finance. Need to finalize headcount requests and project budgets by end of week.',
        status: 'active',
        priority: 'medium',
        participants: [USERS[0], USERS[1]],
        itemCount: 8,
        lastActivity: formatISO(subDays(new Date(), 1)),
        unresolvedCount: 1,
        tags: ['budget', 'finance'],
        actionItems: [
            { id: 'ai-4', text: 'Submit headcount request', status: 'pending', createdAt: formatISO(subDays(new Date(), 1)), dueDate: formatISO(new Date()) },
        ],
    },
    {
        id: 't3',
        title: 'Website Redesign',
        summary: 'Design overhaul of the company website. Waiting for stakeholder feedback on the mockups.',
        status: 'stale',
        priority: 'low',
        participants: [USERS[0], USERS[3]],
        itemCount: 5,
        lastActivity: formatISO(subDays(new Date(), 14)),
        unresolvedCount: 2,
        tags: ['design', 'website'],
        actionItems: [
            { id: 'ai-5', text: 'Review design mockups', status: 'pending', createdAt: formatISO(subDays(new Date(), 14)) },
            { id: 'ai-6', text: 'Get stakeholder approval', status: 'pending', createdAt: formatISO(subDays(new Date(), 10)) },
        ],
    },
];

export const getThreadById = (id: string) => MOCK_THREADS.find(t => t.id === id);

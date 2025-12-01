import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { Priority, ThreadStatus } from "@/generated/prisma";

// GET /api/threads - List all threads
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") as ThreadStatus | null;
    const priority = searchParams.get("priority") as Priority | null;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const [threads, total] = await Promise.all([
      prisma.thread.findMany({
        where,
        include: {
          timelineItems: {
            orderBy: { timestamp: "desc" },
            take: 5,
          },
          actionItems: {
            where: { status: { not: "COMPLETED" } },
          },
          participants: {
            include: { user: true },
          },
          tags: {
            include: { tag: true },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.thread.count({ where }),
    ]);

    // Transform to match frontend Thread type
    const transformedThreads = threads.map((thread) => ({
      id: thread.id,
      title: thread.title,
      description: thread.description,
      status: thread.status.toLowerCase() as "active" | "stale" | "blocked" | "completed",
      priority: thread.priority.toLowerCase() as "high" | "medium" | "low",
      timelineItems: thread.timelineItems.map((item) => item.id),
      itemCount: thread.timelineItems.length,
      participants: thread.participants.map((p) => p.user.name || p.user.email),
      lastActivity: thread.updatedAt.toISOString(),
      createdAt: thread.createdAt.toISOString(),
      tags: thread.tags.map((t) => t.tag.name),
      actionItems: thread.actionItems.map((ai) => ({
        id: ai.id,
        text: ai.text,
        dueDate: ai.dueDate?.toISOString(),
        priority: ai.priority.toLowerCase(),
        status: ai.status.toLowerCase(),
      })),
    }));

    return NextResponse.json({
      threads: transformedThreads,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching threads:", error);
    return NextResponse.json(
      { error: "Failed to fetch threads" },
      { status: 500 }
    );
  }
}

// POST /api/threads - Create a new thread
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, priority = "MEDIUM", tags = [] } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Create thread with tags
    const thread = await prisma.thread.create({
      data: {
        title,
        description,
        priority: priority.toUpperCase() as Priority,
        status: "ACTIVE",
        tags: {
          create: await Promise.all(
            tags.map(async (tagName: string) => {
              const tag = await prisma.tag.upsert({
                where: { name: tagName },
                update: {},
                create: { name: tagName, color: getRandomColor() },
              });
              return { tagId: tag.id };
            })
          ),
        },
      },
      include: {
        tags: { include: { tag: true } },
        timelineItems: true,
        actionItems: true,
        participants: { include: { user: true } },
      },
    });

    return NextResponse.json({
      id: thread.id,
      title: thread.title,
      description: thread.description,
      status: thread.status.toLowerCase(),
      priority: thread.priority.toLowerCase(),
      timelineItems: [],
      itemCount: 0,
      participants: [],
      lastActivity: thread.updatedAt.toISOString(),
      createdAt: thread.createdAt.toISOString(),
      tags: thread.tags.map((t) => t.tag.name),
      actionItems: [],
    });
  } catch (error) {
    console.error("Error creating thread:", error);
    return NextResponse.json(
      { error: "Failed to create thread" },
      { status: 500 }
    );
  }
}

function getRandomColor(): string {
  const colors = [
    "#ef4444", "#f97316", "#eab308", "#22c55e",
    "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

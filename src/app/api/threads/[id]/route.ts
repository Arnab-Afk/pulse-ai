import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { Priority, ThreadStatus, ActionItemStatus } from "@/generated/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/threads/[id] - Get a specific thread
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const thread = await prisma.thread.findUnique({
      where: { id },
      include: {
        timelineItems: {
          orderBy: { timestamp: "desc" },
          include: {
            participants: { include: { user: true } },
          },
        },
        actionItems: {
          orderBy: { createdAt: "desc" },
        },
        participants: {
          include: { user: true },
        },
        tags: {
          include: { tag: true },
        },
      },
    });

    if (!thread) {
      return NextResponse.json(
        { error: "Thread not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: thread.id,
      title: thread.title,
      description: thread.description,
      status: thread.status.toLowerCase(),
      priority: thread.priority.toLowerCase(),
      timelineItems: thread.timelineItems.map((item) => ({
        id: item.id,
        type: item.type.toLowerCase(),
        title: item.title,
        content: item.content,
        timestamp: item.timestamp.toISOString(),
        source: item.source,
        participants: item.participants.map((p) => p.user.name || p.user.email),
        metadata: item.metadata,
      })),
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
      aiSummary: thread.aiSummary,
    });
  } catch (error) {
    console.error("Error fetching thread:", error);
    return NextResponse.json(
      { error: "Failed to fetch thread" },
      { status: 500 }
    );
  }
}

// PUT /api/threads/[id] - Update a thread
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, status, priority, tags, aiSummary } = body;

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status.toUpperCase() as ThreadStatus;
    if (priority !== undefined) updateData.priority = priority.toUpperCase() as Priority;
    if (aiSummary !== undefined) updateData.aiSummary = aiSummary;

    // Update tags if provided
    if (tags !== undefined) {
      // Remove existing tags
      await prisma.threadTag.deleteMany({ where: { threadId: id } });
      
      // Add new tags
      for (const tagName of tags) {
        const tag = await prisma.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName, color: getRandomColor() },
        });
        await prisma.threadTag.create({
          data: { threadId: id, tagId: tag.id },
        });
      }
    }

    const thread = await prisma.thread.update({
      where: { id },
      data: updateData,
      include: {
        timelineItems: { orderBy: { timestamp: "desc" } },
        actionItems: true,
        participants: { include: { user: true } },
        tags: { include: { tag: true } },
      },
    });

    return NextResponse.json({
      id: thread.id,
      title: thread.title,
      description: thread.description,
      status: thread.status.toLowerCase(),
      priority: thread.priority.toLowerCase(),
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
    });
  } catch (error) {
    console.error("Error updating thread:", error);
    return NextResponse.json(
      { error: "Failed to update thread" },
      { status: 500 }
    );
  }
}

// DELETE /api/threads/[id] - Delete a thread
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Delete related records first (cascade)
    await prisma.$transaction([
      prisma.itemParticipant.deleteMany({
        where: { timelineItem: { threadId: id } },
      }),
      prisma.timelineItem.deleteMany({ where: { threadId: id } }),
      prisma.actionItem.deleteMany({ where: { threadId: id } }),
      prisma.threadParticipant.deleteMany({ where: { threadId: id } }),
      prisma.threadTag.deleteMany({ where: { threadId: id } }),
      prisma.thread.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting thread:", error);
    return NextResponse.json(
      { error: "Failed to delete thread" },
      { status: 500 }
    );
  }
}

// PATCH /api/threads/[id] - Partial update (e.g., add action item)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case "add-action-item": {
        const actionItem = await prisma.actionItem.create({
          data: {
            threadId: id,
            text: data.text,
            dueDate: data.dueDate ? new Date(data.dueDate) : null,
            priority: (data.priority?.toUpperCase() || "MEDIUM") as Priority,
            status: "PENDING" as ActionItemStatus,
          },
        });
        return NextResponse.json({
          id: actionItem.id,
          text: actionItem.text,
          dueDate: actionItem.dueDate?.toISOString(),
          priority: actionItem.priority.toLowerCase(),
          status: actionItem.status.toLowerCase(),
        });
      }

      case "update-action-item": {
        const actionItem = await prisma.actionItem.update({
          where: { id: data.id },
          data: {
            text: data.text,
            dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
            priority: data.priority?.toUpperCase() as Priority,
            status: data.status?.toUpperCase() as ActionItemStatus,
          },
        });
        return NextResponse.json({
          id: actionItem.id,
          text: actionItem.text,
          dueDate: actionItem.dueDate?.toISOString(),
          priority: actionItem.priority.toLowerCase(),
          status: actionItem.status.toLowerCase(),
        });
      }

      case "delete-action-item": {
        await prisma.actionItem.delete({ where: { id: data.id } });
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json(
          { error: "Unknown action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error in thread patch:", error);
    return NextResponse.json(
      { error: "Failed to perform action" },
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

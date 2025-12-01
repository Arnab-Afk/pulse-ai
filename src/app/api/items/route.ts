import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ItemType } from "@/generated/prisma";

// GET /api/items - List timeline items
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const threadId = searchParams.get("threadId");
    const type = searchParams.get("type") as ItemType | null;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: Record<string, unknown> = {};
    if (threadId) where.threadId = threadId;
    if (type) where.type = type;

    const [items, total] = await Promise.all([
      prisma.timelineItem.findMany({
        where,
        include: {
          participants: { include: { user: true } },
          thread: true,
        },
        orderBy: { timestamp: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.timelineItem.count({ where }),
    ]);

    return NextResponse.json({
      items: items.map((item) => ({
        id: item.id,
        type: item.type.toLowerCase(),
        title: item.title,
        content: item.content,
        timestamp: item.timestamp.toISOString(),
        source: item.source,
        externalId: item.externalId,
        threadId: item.threadId,
        threadTitle: item.thread?.title,
        participants: item.participants.map((p) => p.user.name || p.user.email),
        metadata: item.metadata,
      })),
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching items:", error);
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    );
  }
}

// POST /api/items - Create a new timeline item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      threadId,
      type,
      title,
      content,
      timestamp,
      source,
      externalId,
      participants = [],
      metadata,
    } = body;

    if (!type || !title) {
      return NextResponse.json(
        { error: "Type and title are required" },
        { status: 400 }
      );
    }

    // Check for duplicate by externalId
    if (externalId) {
      const existing = await prisma.timelineItem.findUnique({
        where: { externalId },
      });
      if (existing) {
        return NextResponse.json({
          id: existing.id,
          duplicate: true,
          message: "Item already exists",
        });
      }
    }

    const item = await prisma.timelineItem.create({
      data: {
        threadId,
        type: type.toUpperCase() as ItemType,
        title,
        content,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        source,
        externalId,
        metadata,
      },
      include: {
        participants: { include: { user: true } },
      },
    });

    // Add participants if provided
    for (const participantEmail of participants) {
      const user = await prisma.user.upsert({
        where: { email: participantEmail },
        update: {},
        create: { email: participantEmail },
      });
      await prisma.itemParticipant.create({
        data: { timelineItemId: item.id, userId: user.id },
      });
    }

    // Update thread's updatedAt if associated
    if (threadId) {
      await prisma.thread.update({
        where: { id: threadId },
        data: { updatedAt: new Date() },
      });
    }

    return NextResponse.json({
      id: item.id,
      type: item.type.toLowerCase(),
      title: item.title,
      content: item.content,
      timestamp: item.timestamp.toISOString(),
      source: item.source,
      externalId: item.externalId,
      threadId: item.threadId,
      metadata: item.metadata,
    });
  } catch (error) {
    console.error("Error creating item:", error);
    return NextResponse.json(
      { error: "Failed to create item" },
      { status: 500 }
    );
  }
}

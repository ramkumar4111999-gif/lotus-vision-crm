import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/notifications — return all notifications, newest first, max 20
export async function GET() {
  try {
    const notifications = await db.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    const unreadCount = await db.notification.count({ where: { isRead: false } });
    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 },
    );
  }
}

// POST /api/notifications — create a new notification
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, message, type = "info", link } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: "title and message are required" },
        { status: 400 },
      );
    }

    const allowedTypes = ["info", "warning", "success", "error"];
    const notificationType = allowedTypes.includes(type) ? type : "info";

    const notification = await db.notification.create({
      data: {
        title,
        message,
        type: notificationType,
        link: link || null,
      },
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 },
    );
  }
}

// DELETE /api/notifications — clear all read notifications
export async function DELETE() {
  try {
    const result = await db.notification.deleteMany({
      where: { isRead: true },
    });
    return NextResponse.json({ deleted: result.count });
  } catch (error) {
    console.error("Error clearing notifications:", error);
    return NextResponse.json(
      { error: "Failed to clear notifications" },
      { status: 500 },
    );
  }
}
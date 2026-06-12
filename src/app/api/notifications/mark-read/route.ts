import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/notifications/mark-read
// Body: { id: string } to mark one, or { all: true } to mark all
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.all) {
      await db.notification.updateMany({ where: { isRead: false }, data: { isRead: true } });
      return NextResponse.json({ success: true });
    }

    if (!body.id) {
      return NextResponse.json({ error: "id or all:true is required" }, { status: 400 });
    }

    await db.notification.update({
      where: { id: body.id },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      { error: "Failed to mark notification as read" },
      { status: 500 },
    );
  }
}
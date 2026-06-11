import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const { id } = await params;

    const staff = await db.staff.findUnique({
      where: { id },
    });

    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    return NextResponse.json(staff);
  } catch (error) {
    console.error("Error fetching staff:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff member" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, phone, role, email, salary, commission, isActive, joinDate, loginId } =
      body;

    // Verify the staff exists
    const existing = await db.staff.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      ...(name !== undefined && { name }),
      ...(phone !== undefined && { phone }),
      ...(role !== undefined && { role }),
      ...(email !== undefined && { email }),
      ...(salary !== undefined && { salary: parseFloat(salary) }),
      ...(commission !== undefined && { commission: parseFloat(commission) }),
      ...(isActive !== undefined && { isActive }),
      ...(loginId !== undefined && { loginId }),
      ...(joinDate !== undefined && { joinDate: joinDate ? new Date(joinDate) : null }),
    };

    const staff = await db.staff.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(staff);
  } catch (error) {
    console.error("Error updating staff:", error);
    return NextResponse.json(
      { error: "Failed to update staff member" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const { id } = await params;

    // Verify the staff exists
    const existing = await db.staff.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    // Check if staff has associated sales
    const salesCount = await db.sale.count({ where: { staffId: id } });
    if (salesCount > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete staff member with existing sales. Deactivate instead.",
        },
        { status: 409 },
      );
    }

    await db.staff.delete({ where: { id } });

    return NextResponse.json({ message: "Staff member deleted successfully" });
  } catch (error) {
    console.error("Error deleting staff:", error);
    return NextResponse.json(
      { error: "Failed to delete staff member" },
      { status: 500 },
    );
  }
}

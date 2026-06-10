import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const saleId = searchParams.get("saleId");
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "25", 10);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (saleId) where.saleId = saleId;

    const [returns, total] = await Promise.all([
      db.return.findMany({
        where,
        include: {
          sale: {
            select: {
              id: true,
              invoiceNo: true,
              customer: { select: { id: true, name: true, phone: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.return.count({ where }),
    ]);

    return NextResponse.json({
      returns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching returns:", error);
    return NextResponse.json(
      { error: "Failed to fetch returns" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { saleId, reason, refundAmount, amount, items } = body;

    const finalAmount = refundAmount ?? amount;

    if (!saleId || !reason || finalAmount == null) {
      return NextResponse.json(
        { error: "saleId, reason, and refundAmount are required" },
        { status: 400 },
      );
    }

    const sale = await db.sale.findUnique({
      where: { id: saleId },
      include: { items: true },
    });

    if (!sale) {
      return NextResponse.json(
        { error: "Sale not found" },
        { status: 404 },
      );
    }

    const returnRecord = await db.$transaction(async (tx) => {
      // Create the return record
      const ret = await tx.return.create({
        data: {
          saleId,
          reason,
          amount: parseFloat(finalAmount),
          status: "Completed",
        },
        include: {
          sale: {
            select: {
              id: true,
              invoiceNo: true,
              customer: { select: { id: true, name: true } },
            },
          },
        },
      });

      // Update sale status to Return
      await tx.sale.update({
        where: { id: saleId },
        data: { status: "Return" },
      });

      // Restore stock for returned items
      if (items && Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          const saleItem = sale.items.find(
            (si) => si.id === item.saleItemId,
          );
          if (saleItem && item.returnQty > 0) {
            await tx.product.update({
              where: { id: saleItem.productId },
              data: { stock: { increment: item.returnQty } },
            });
          }
        }
      }

      return ret;
    });

    return NextResponse.json(returnRecord, { status: 201 });
  } catch (error) {
    console.error("Error creating return:", error);
    return NextResponse.json(
      { error: "Failed to create return" },
      { status: 500 },
    );
  }
}
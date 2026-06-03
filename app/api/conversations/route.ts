import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const conversations = await prisma.conversation.findMany({
    orderBy: { updatedAt: "desc" },
    take: 30,
    include: {
      nodes: {
        where: { type: "root" },
        take: 1
      }
    }
  });

  return NextResponse.json({ conversations });
}

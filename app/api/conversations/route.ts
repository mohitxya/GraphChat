import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const auth = await requireUserId();
  if (auth.response) {
    return auth.response;
  }

  const conversations = await prisma.conversation.findMany({
    where: { userId: auth.userId },
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

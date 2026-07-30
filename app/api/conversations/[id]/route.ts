import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireUserId();
  if (auth.response) {
    return auth.response;
  }

  const conversation = await prisma.conversation.findFirst({
    where: { id, userId: auth.userId },
    include: {
      nodes: { orderBy: { createdAt: "asc" } },
      edges: { orderBy: { createdAt: "asc" } },
      anchors: { orderBy: { createdAt: "asc" } }
    }
  });

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  return NextResponse.json({ conversation });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireUserId();
  if (auth.response) {
    return auth.response;
  }

  const conversation = await prisma.conversation.findFirst({
    where: { id, userId: auth.userId },
    select: { id: true }
  });

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  await prisma.conversation.delete({
    where: { id: conversation.id }
  });

  return NextResponse.json({ ok: true });
}

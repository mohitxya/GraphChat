import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

type UpdatePositionRequest = {
  nodeId?: string;
  x?: number;
  y?: number;
};

export async function POST(request: Request) {
  try {
    const auth = await requireUserId();
    if (auth.response) {
      return auth.response;
    }

    const { nodeId, x, y } = (await request.json()) as UpdatePositionRequest;

    if (!nodeId || typeof x !== "number" || typeof y !== "number") {
      return NextResponse.json({ error: "nodeId, x, and y are required." }, { status: 400 });
    }

    const existingNode = await prisma.graphNode.findFirst({
      where: {
        id: nodeId,
        conversation: { userId: auth.userId }
      }
    });

    if (!existingNode) {
      return NextResponse.json({ error: "Node not found." }, { status: 404 });
    }

    const node = await prisma.graphNode.update({
      where: { id: existingNode.id },
      data: { x, y }
    });

    return NextResponse.json({ node });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update node position." },
      { status: 500 }
    );
  }
}

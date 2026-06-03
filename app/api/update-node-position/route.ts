import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

type UpdatePositionRequest = {
  nodeId?: string;
  x?: number;
  y?: number;
};

export async function POST(request: Request) {
  try {
    const { nodeId, x, y } = (await request.json()) as UpdatePositionRequest;

    if (!nodeId || typeof x !== "number" || typeof y !== "number") {
      return NextResponse.json({ error: "nodeId, x, and y are required." }, { status: 400 });
    }

    const node = await prisma.graphNode.update({
      where: { id: nodeId },
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

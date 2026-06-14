import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { getDescendants } from "@/lib/graph/traversal";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireUserId();
    if (auth.response) {
      return auth.response;
    }

    const { id } = await params;
    const node = await prisma.graphNode.findFirst({
      where: {
        id,
        conversation: { userId: auth.userId }
      }
    });

    if (!node) {
      return NextResponse.json({ error: "Node not found." }, { status: 404 });
    }

    const descendants = await getDescendants(node.id);
    const deletedNodeIds = [node.id, ...descendants.map((descendant) => descendant.id)];

    const relatedEdges = await prisma.graphEdge.findMany({
      where: {
        conversationId: node.conversationId,
        OR: [
          { sourceNodeId: { in: deletedNodeIds } },
          { targetNodeId: { in: deletedNodeIds } }
        ]
      },
      select: { id: true }
    });

    const deletedEdgeIds = relatedEdges.map((edge) => edge.id);

    const result = await prisma.$transaction(async (tx) => {
      await tx.anchor.deleteMany({
        where: {
          conversationId: node.conversationId,
          OR: [
            { sourceNodeId: { in: deletedNodeIds } },
            { targetNodeId: { in: deletedNodeIds } }
          ]
        }
      });

      await tx.graphEdge.deleteMany({
        where: {
          conversationId: node.conversationId,
          OR: [
            { sourceNodeId: { in: deletedNodeIds } },
            { targetNodeId: { in: deletedNodeIds } }
          ]
        }
      });

      await tx.graphNode.deleteMany({
        where: {
          conversationId: node.conversationId,
          id: { in: deletedNodeIds }
        }
      });

      const remainingNodeCount = await tx.graphNode.count({
        where: { conversationId: node.conversationId }
      });

      if (remainingNodeCount === 0) {
        await tx.conversation.delete({ where: { id: node.conversationId } });
        return { conversationDeleted: true };
      }

      await tx.conversation.update({
        where: { id: node.conversationId },
        data: { updatedAt: new Date() }
      });

      return { conversationDeleted: false };
    });

    return NextResponse.json({
      deletedNodeIds,
      deletedEdgeIds,
      conversationDeleted: result.conversationDeleted
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete node." },
      { status: 500 }
    );
  }
}

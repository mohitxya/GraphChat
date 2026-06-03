import { prisma } from "@/lib/db/prisma";
import type { GraphNode } from "@prisma/client";

export async function getAncestors(nodeId: string): Promise<GraphNode[]> {
  const node = await prisma.graphNode.findUnique({ where: { id: nodeId } });
  if (!node?.parentNodeId) {
    return [];
  }

  const parentAncestors = await getAncestors(node.parentNodeId);
  const parent = await prisma.graphNode.findUniqueOrThrow({
    where: { id: node.parentNodeId }
  });

  return [...parentAncestors, parent];
}

export async function getBranchPath(nodeId: string): Promise<GraphNode[]> {
  const node = await prisma.graphNode.findUniqueOrThrow({ where: { id: nodeId } });
  const ancestors = await getAncestors(nodeId);
  return [...ancestors, node];
}

export async function getDescendants(nodeId: string): Promise<GraphNode[]> {
  const children = await prisma.graphNode.findMany({
    where: { parentNodeId: nodeId },
    orderBy: { createdAt: "asc" }
  });

  const nested = await Promise.all(children.map((child) => getDescendants(child.id)));
  return children.flatMap((child, index) => [child, ...nested[index]]);
}

export async function getSiblingNodes(nodeId: string): Promise<GraphNode[]> {
  const node = await prisma.graphNode.findUniqueOrThrow({ where: { id: nodeId } });
  if (!node.parentNodeId) {
    return [];
  }

  return prisma.graphNode.findMany({
    where: {
      parentNodeId: node.parentNodeId,
      id: { not: nodeId }
    },
    orderBy: { createdAt: "asc" }
  });
}

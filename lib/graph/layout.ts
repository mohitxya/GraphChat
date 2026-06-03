import type { GraphNode } from "@prisma/client";

export function getChildPosition(parent: Pick<GraphNode, "x" | "y">, siblingCount: number) {
  return {
    x: parent.x + 540,
    y: parent.y + siblingCount * 320
  };
}

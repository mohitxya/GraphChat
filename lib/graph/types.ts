import type { Anchor, Conversation, GraphEdge, GraphNode } from "@prisma/client";

export type ConversationGraph = Conversation & {
  nodes: GraphNode[];
  edges: GraphEdge[];
  anchors: Anchor[];
};

export type SelectionAnchorPayload = {
  selectedText: string;
  startOffset: number | null;
  endOffset: number | null;
  prefixText: string;
  suffixText: string;
  surroundingContext: string;
};

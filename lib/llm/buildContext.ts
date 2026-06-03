import { prisma } from "@/lib/db/prisma";
import { buildSpanQuestionMessages } from "./prompts";
import { getBranchPath } from "@/lib/graph/traversal";

export type BuildContextForSpanQuestionInput = {
  conversationId: string;
  sourceNodeId: string;
  selectedText: string;
  surroundingContext?: string | null;
  userQuestion: string;
};

export async function buildContextForSpanQuestion({
  conversationId,
  sourceNodeId,
  selectedText,
  surroundingContext,
  userQuestion
}: BuildContextForSpanQuestionInput) {
  const [conversation, sourceNode, branchPath] = await Promise.all([
    prisma.conversation.findUniqueOrThrow({ where: { id: conversationId } }),
    prisma.graphNode.findUniqueOrThrow({ where: { id: sourceNodeId } }),
    getBranchPath(sourceNodeId)
  ]);

  const pathText = branchPath
    .map((node, index) => {
      const label = node.type === "root" ? "Root" : `Branch ${index}`;
      const question = node.question ? ` Question: ${node.question}` : "";
      return `${label}:${question} ${node.selectedText ? `Selected: "${node.selectedText}"` : ""}`.trim();
    })
    .join("\n");

  return buildSpanQuestionMessages({
    title: conversation.title,
    branchPath: pathText || "Source node is the root.",
    parentContent: sourceNode.content,
    selectedText,
    surroundingContext,
    userQuestion
  });
}

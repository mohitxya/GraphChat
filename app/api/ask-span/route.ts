import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createLlmClient } from "@/lib/llm/client";
import { buildContextForSpanQuestion } from "@/lib/llm/buildContext";
import { getChildPosition } from "@/lib/graph/layout";

type AskSpanRequest = {
  conversationId?: string;
  sourceNodeId?: string;
  selectedText?: string;
  startOffset?: number | null;
  endOffset?: number | null;
  prefixText?: string;
  suffixText?: string;
  surroundingContext?: string;
  userQuestion?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AskSpanRequest;

    if (!body.conversationId || !body.sourceNodeId || !body.selectedText || !body.userQuestion) {
      return NextResponse.json(
        { error: "conversationId, sourceNodeId, selectedText, and userQuestion are required." },
        { status: 400 }
      );
    }

    const sourceNode = await prisma.graphNode.findUniqueOrThrow({
      where: { id: body.sourceNodeId }
    });

    const siblingCount = await prisma.graphNode.count({
      where: {
        conversationId: body.conversationId,
        parentNodeId: body.sourceNodeId
      }
    });

    const messages = await buildContextForSpanQuestion({
      conversationId: body.conversationId,
      sourceNodeId: body.sourceNodeId,
      selectedText: body.selectedText,
      surroundingContext: body.surroundingContext,
      userQuestion: body.userQuestion
    });

    const llm = createLlmClient();
    const answer = await llm.generateText({ messages });
    const position = getChildPosition(sourceNode, siblingCount);

    const result = await prisma.$transaction(async (tx) => {
      const node = await tx.graphNode.create({
        data: {
          conversationId: body.conversationId!,
          type: "branch",
          role: "mixed",
          content: answer,
          question: body.userQuestion!.trim(),
          selectedText: body.selectedText!,
          parentNodeId: body.sourceNodeId!,
          x: position.x,
          y: position.y
        }
      });

      const edge = await tx.graphEdge.create({
        data: {
          conversationId: body.conversationId!,
          sourceNodeId: body.sourceNodeId!,
          targetNodeId: node.id,
          type: "span_question"
        }
      });

      const anchor = await tx.anchor.create({
        data: {
          conversationId: body.conversationId!,
          sourceNodeId: body.sourceNodeId!,
          targetNodeId: node.id,
          selectedText: body.selectedText!,
          startOffset: body.startOffset ?? null,
          endOffset: body.endOffset ?? null,
          prefixText: body.prefixText,
          suffixText: body.suffixText,
          surroundingContext: body.surroundingContext
        }
      });

      await tx.conversation.update({
        where: { id: body.conversationId! },
        data: { updatedAt: new Date() }
      });

      return { node, edge, anchor };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to answer span question." },
      { status: 500 }
    );
  }
}

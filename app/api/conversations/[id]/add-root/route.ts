import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { createLlmClient, LlmProviderRateLimitError } from "@/lib/llm/client";
import { buildRootExplanationMessages } from "@/lib/llm/prompts";
import { enforceLlmRateLimit } from "@/lib/rate-limit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireUserId();
    if (auth.response) {
      return auth.response;
    }

    const { id } = await params;
    const { question } = (await request.json()) as { question?: string };

    if (!question?.trim()) {
      return NextResponse.json({ error: "Question is required." }, { status: 400 });
    }

    const conversation = await prisma.conversation.findFirst({
      where: { id, userId: auth.userId },
      include: {
        nodes: {
          where: { type: "root" },
          orderBy: { y: "desc" }
        }
      }
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }

    const rateLimit = await enforceLlmRateLimit({
      request,
      userId: auth.userId,
      route: "generate-root"
    });

    if (!rateLimit.allowed) {
      return rateLimit.response;
    }

    const llm = createLlmClient();
    const content = await llm.generateText({
      messages: buildRootExplanationMessages(question.trim())
    });

    const lowestRootY = conversation.nodes[0]?.y ?? -700;
    const node = await prisma.graphNode.create({
      data: {
        conversationId: conversation.id,
        type: "root",
        role: "assistant",
        question: question.trim(),
        content,
        x: 0,
        y: lowestRootY + 700
      }
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json({ node }, { headers: rateLimit.headers });
  } catch (error) {
    console.error(error);
    if (error instanceof LlmProviderRateLimitError) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add root node." },
      { status: 500 }
    );
  }
}

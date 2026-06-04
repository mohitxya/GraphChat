import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { createLlmClient, LlmProviderRateLimitError } from "@/lib/llm/client";
import { buildRootExplanationMessages } from "@/lib/llm/prompts";
import { enforceLlmRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const auth = await requireUserId();
    if (auth.response) {
      return auth.response;
    }

    const { question } = (await request.json()) as { question?: string };

    if (!question?.trim()) {
      return NextResponse.json({ error: "Question is required." }, { status: 400 });
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

    const conversation = await prisma.conversation.create({
      data: {
        userId: auth.userId,
        title: question.trim(),
        nodes: {
          create: {
            type: "root",
            role: "assistant",
            question: question.trim(),
            content,
            x: 0,
            y: 0
          }
        }
      },
      include: {
        nodes: true
      }
    });

    return NextResponse.json({ conversation }, { headers: rateLimit.headers });
  } catch (error) {
    console.error(error);
    if (error instanceof LlmProviderRateLimitError) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create conversation." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createLlmClient } from "@/lib/llm/client";
import { buildRootExplanationMessages } from "@/lib/llm/prompts";

export async function POST(request: Request) {
  try {
    const { question } = (await request.json()) as { question?: string };

    if (!question?.trim()) {
      return NextResponse.json({ error: "Question is required." }, { status: 400 });
    }

    const llm = createLlmClient();
    const content = await llm.generateText({
      messages: buildRootExplanationMessages(question.trim())
    });

    const conversation = await prisma.conversation.create({
      data: {
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

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create conversation." },
      { status: 500 }
    );
  }
}

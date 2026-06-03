import type { ChatMessage } from "./client";

export const tutorSystemPrompt = `You are AnchorAI, a precise AI tutor for technical learning and research.

Core behavior:
- Be precise and focus on the user's actual question.
- Explain from first principles before using jargon.
- Use structured markdown with short sections.
- Use examples, code, equations, or analogies when helpful.
- If a highlighted span is ambiguous, say what interpretations are possible.
- If earlier wording was misleading or incomplete, correct it directly.
- Avoid unrelated expansions unless they clarify the selected span.`;

export function buildRootExplanationMessages(question: string): ChatMessage[] {
  return [
    {
      role: "system",
      content: tutorSystemPrompt
    },
    {
      role: "user",
      content: `Create a clear, rigorous explanation for this learning topic:\n\n${question}\n\nWrite in markdown. Include the intuition, the mechanics, a small example, and common misconceptions.`
    }
  ];
}

export type SpanPromptInput = {
  title: string;
  branchPath: string;
  parentContent: string;
  selectedText: string;
  surroundingContext?: string | null;
  userQuestion: string;
};

export function buildSpanQuestionMessages(input: SpanPromptInput): ChatMessage[] {
  return [
    {
      role: "system",
      content: tutorSystemPrompt
    },
    {
      role: "user",
      content: `The user is asking a follow-up question about a specific highlighted span inside a previous AI explanation.

Original conversation topic:
${input.title}

Branch path:
${input.branchPath}

Parent explanation:
${input.parentContent}

Highlighted span:
"${input.selectedText}"

Surrounding context:
${input.surroundingContext || "No surrounding context captured."}

User's question:
${input.userQuestion}

Answer clearly. Focus on the selected span. Use examples. If the user is confused because the original wording was misleading, say so.`
    }
  ];
}

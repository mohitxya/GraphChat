export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type GenerateTextInput = {
  messages: ChatMessage[];
  temperature?: number;
};

export type LlmClient = {
  generateText(input: GenerateTextInput): Promise<string>;
};

type OpenAiChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

export class LlmProviderRateLimitError extends Error {
  constructor(message = "The AI provider rate limit was reached. Please try again later.") {
    super(message);
    this.name = "LlmProviderRateLimitError";
  }
}

export class OpenAiCompatibleClient implements LlmClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY ?? "";
    this.baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
    this.model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  }

  async generateText({ messages, temperature = 0.3 }: GenerateTextInput) {
    if (!this.apiKey) {
      throw new Error("OPENAI_API_KEY is not configured.");
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature
      })
    });

    const payload = (await response.json()) as OpenAiChatResponse;

    if (response.status === 429) {
      throw new LlmProviderRateLimitError(payload.error?.message);
    }

    if (!response.ok) {
      throw new Error(payload.error?.message ?? "LLM request failed.");
    }

    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("LLM returned an empty response.");
    }

    return content;
  }
}

export function createLlmClient(): LlmClient {
  return new OpenAiCompatibleClient();
}

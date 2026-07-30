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

type ProviderConfig = {
  name: string;
  apiKey: string;
  baseUrl: string;
  model: string;
};

export type LlmProviderInfo = {
  name: string;
  model: string;
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
  constructor(
    message = "The AI provider rate limit was reached. Please try again later.",
    public readonly provider?: string
  ) {
    super(message);
    this.name = "LlmProviderRateLimitError";
  }
}

export class OpenAiCompatibleClient implements LlmClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly name: string;

  constructor(config?: Partial<ProviderConfig>) {
    this.name = config?.name ?? "openai";
    this.apiKey = config?.apiKey ?? process.env.OPENAI_API_KEY ?? "";
    this.baseUrl = config?.baseUrl ?? process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
    this.model = config?.model ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  }

  async generateText({ messages, temperature = 0.3 }: GenerateTextInput) {
    if (!this.apiKey) {
      throw new Error(`${this.name} API key is not configured.`);
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
      throw new LlmProviderRateLimitError(
        payload.error?.message ?? `${this.name} rate limit reached.`,
        this.name
      );
    }

    if (!response.ok) {
      throw new Error(payload.error?.message ?? `${this.name} LLM request failed.`);
    }

    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("LLM returned an empty response.");
    }

    return content;
  }
}

export class FallbackLlmClient implements LlmClient {
  constructor(private readonly clients: LlmClient[]) {}

  async generateText(input: GenerateTextInput) {
    const errors: Error[] = [];

    for (const client of this.clients) {
      try {
        return await client.generateText(input);
      } catch (error) {
        errors.push(error instanceof Error ? error : new Error("Unknown LLM error."));
      }
    }

    const nonRateLimitError = errors.findLast((error) => !(error instanceof LlmProviderRateLimitError));
    if (nonRateLimitError) {
      throw nonRateLimitError;
    }

    throw errors.at(-1) ?? new Error("All LLM providers failed.");
  }
}

function getProviderConfig(name: string): ProviderConfig | null {
  if (name === "gemini") {
    return {
      name: "gemini",
      apiKey: process.env.GEMINI_API_KEY ?? "",
      baseUrl: process.env.GEMINI_BASE_URL ?? "https://generativelanguage.googleapis.com/v1beta/openai",
      model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash"
    };
  }

  if (name === "groq") {
    return {
      name: "groq",
      apiKey: process.env.GROQ_API_KEY ?? "",
      baseUrl: process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1",
      model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile"
    };
  }

  if (name === "openai") {
    return {
      name: "openai",
      apiKey: process.env.OPENAI_API_KEY ?? "",
      baseUrl: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini"
    };
  }

  return null;
}

function getProviderNames() {
  return (process.env.LLM_PROVIDER_SEQUENCE ?? "gemini,groq,openai")
    .split(",")
    .map((provider) => provider.trim().toLowerCase())
    .filter(Boolean);
}

export function getConfiguredLlmProviders(): LlmProviderInfo[] {
  return getProviderNames()
    .map(getProviderConfig)
    .filter((config): config is ProviderConfig => Boolean(config?.apiKey))
    .map(({ name, model }) => ({ name, model }));
}

export function createLlmClient(): LlmClient {
  const clients = getProviderNames()
    .map(getProviderConfig)
    .filter((config): config is ProviderConfig => Boolean(config?.apiKey))
    .map((config) => new OpenAiCompatibleClient(config));

  if (clients.length === 0) {
    return new OpenAiCompatibleClient();
  }

  return new FallbackLlmClient(clients);
}

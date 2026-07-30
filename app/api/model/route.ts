import { NextResponse } from "next/server";
import { getConfiguredLlmProviders } from "@/lib/llm/client";

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export async function GET() {
  const providers = getConfiguredLlmProviders();
  const primary = providers[0];

  if (!primary) {
    return NextResponse.json({
      model: null,
      provider: null,
      label: "No model configured"
    });
  }

  return NextResponse.json({
    model: primary.model,
    provider: primary.name,
    label: `${titleCase(primary.name)}: ${primary.model}`
  });
}

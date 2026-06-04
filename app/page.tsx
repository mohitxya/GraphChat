"use client";

import { SignInButton, useUser } from "@clerk/nextjs";
import { ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function HomePage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const [question, setQuestion] = useState("Explain KV cache in transformers.");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!question.trim()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-root", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to generate the root node.");
      }

      router.push(`/conversations/${payload.conversation.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen">
      <Topbar />
      <section className="mx-auto grid min-h-[calc(100vh-3.5rem)] max-w-6xl content-center gap-10 px-5 py-12 md:grid-cols-[1fr_0.85fr]">
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.28em] text-accent">Non-linear AI learning</p>
          <h1 className="max-w-3xl text-5xl font-black leading-tight md:text-6xl">
            Ask questions exactly where your doubt appears.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            GraphChat turns AI explanations into a graph of grounded clarifications. Highlight a phrase, ask a follow-up, and branch the conversation from that span.
          </p>
        </div>

        <form onSubmit={onSubmit} className="border border-border bg-panel/80 p-5 shadow-node backdrop-blur">
          <label className="text-sm font-semibold text-slate-200" htmlFor="question">
            Start with a topic or question
          </label>
          <Textarea
            id="question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            className="mt-3 min-h-36"
            placeholder="Explain virtual memory, attention heads, database indexes..."
          />
          {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
          {isLoaded && isSignedIn ? (
            <Button type="submit" disabled={isLoading} className="mt-4 w-full">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              Generate root explanation
            </Button>
          ) : null}
          {isLoaded && !isSignedIn ? (
            <SignInButton mode="modal">
              <Button type="button" className="mt-4 w-full">
                <ArrowRight className="h-4 w-4" />
                Sign in to generate
              </Button>
            </SignInButton>
          ) : null}
        </form>
      </section>
    </main>
  );
}

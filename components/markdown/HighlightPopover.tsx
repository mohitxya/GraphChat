"use client";

import { FormEvent, useState } from "react";
import { Loader2, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { SelectionAnchorPayload } from "@/lib/graph/types";

export type HighlightPopoverProps = {
  anchor: SelectionAnchorPayload;
  position: { x: number; y: number };
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (question: string) => Promise<void>;
};

export function HighlightPopover({
  anchor,
  position,
  isSubmitting,
  onCancel,
  onSubmit
}: HighlightPopoverProps) {
  const [question, setQuestion] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!question.trim()) {
      return;
    }

    await onSubmit(question);
    setQuestion("");
  }

  return (
    <div
      className="fixed z-50 w-80 border border-border bg-panel p-3 shadow-node"
      style={{ left: position.x, top: position.y }}
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-gold">Ask about this</div>
          <p className="mt-1 line-clamp-3 text-xs leading-5 text-slate-300">&quot;{anchor.selectedText}&quot;</p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md p-1 text-muted hover:bg-white/5 hover:text-foreground"
          aria-label="Cancel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <form onSubmit={handleSubmit}>
        <Textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Why does this matter? Can you give an example?"
          className="min-h-20"
          autoFocus
        />
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="text-[11px] text-muted">
            Offset {anchor.startOffset ?? "?"}-{anchor.endOffset ?? "?"}
          </div>
          <Button type="submit" disabled={isSubmitting || !question.trim()} className="h-9 px-3">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Ask
          </Button>
        </div>
      </form>
    </div>
  );
}

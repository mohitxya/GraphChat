"use client";

import { Copy, Trash2 } from "lucide-react";
import { Handle, Position, type NodeProps } from "reactflow";
import { SelectableMarkdown } from "@/components/markdown/SelectableMarkdown";
import type { SelectionAnchorPayload } from "@/lib/graph/types";

export type GraphChatNodeData = {
  id: string;
  type: "root" | "branch" | "summary" | "note";
  question: string | null;
  content: string;
  selectedText: string | null;
  persistentHighlights: PersistentHighlight[];
  onAskSpan: (nodeId: string, payload: SelectionAnchorPayload & { userQuestion: string }) => Promise<void>;
  onDeleteNode: (nodeId: string) => Promise<void>;
};

export type PersistentHighlight = {
  id: string;
  selectedText: string;
  startOffset: number | null;
  endOffset: number | null;
  prefixText: string | null;
  suffixText: string | null;
};

export function ExplanationNode({ data }: NodeProps<GraphChatNodeData>) {
  return (
    <article className="w-[460px] border border-border bg-panel/95 shadow-node backdrop-blur">
      <Handle type="target" position={Position.Left} className="!border-accent !bg-background" />
      <header className="border-b border-border/80 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-accent">Root Explanation</div>
            {data.question ? <h2 className="mt-1 text-base font-semibold text-foreground">{data.question}</h2> : null}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(data.content)}
              className="rounded-md p-2 text-muted hover:bg-white/5 hover:text-foreground"
              aria-label="Copy node content"
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => data.onDeleteNode(data.id)}
              className="rounded-md p-2 text-muted hover:bg-red-500/10 hover:text-red-200"
              aria-label="Delete node"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>
      <div className="nodrag nopan max-h-[560px] cursor-text overflow-y-auto px-4 py-3">
        <SelectableMarkdown
          markdown={data.content}
          persistentHighlights={data.persistentHighlights}
          onAskSpan={(payload) => data.onAskSpan(data.id, payload)}
        />
      </div>
      <Handle type="source" position={Position.Right} className="!border-accent !bg-accent" />
    </article>
  );
}

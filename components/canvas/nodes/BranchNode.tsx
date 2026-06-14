"use client";

import { Copy, Trash2 } from "lucide-react";
import { Handle, Position, type NodeProps } from "reactflow";
import { SelectableMarkdown } from "@/components/markdown/SelectableMarkdown";
import type { GraphChatNodeData } from "./ExplanationNode";

export function BranchNode({ data }: NodeProps<GraphChatNodeData>) {
  return (
    <article className="w-[460px] border border-border bg-panel/95 shadow-node backdrop-blur">
      <Handle type="target" position={Position.Left} className="!border-gold !bg-background" />
      <header className="border-b border-border/80 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-gold">Span Question</div>
            {data.selectedText ? (
              <p className="mt-2 line-clamp-3 border-l-2 border-gold/70 pl-3 text-xs leading-5 text-slate-300">
                {data.selectedText}
              </p>
            ) : null}
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
        {data.question ? <div className="mt-3 rounded-md bg-black/25 p-3 text-sm text-slate-200">{data.question}</div> : null}
      </header>
      <div className="nodrag nopan max-h-[520px] cursor-text overflow-y-auto px-4 py-3">
        <SelectableMarkdown
          markdown={data.content}
          persistentHighlights={data.persistentHighlights}
          onAskSpan={(payload) => data.onAskSpan(data.id, payload)}
        />
      </div>
      <Handle type="source" position={Position.Right} className="!border-gold !bg-gold" />
    </article>
  );
}

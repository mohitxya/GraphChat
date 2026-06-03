"use client";

import { MouseEvent, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { getSelectionOffsets } from "@/lib/selection/getSelectionOffsets";
import type { SelectionAnchorPayload } from "@/lib/graph/types";
import { HighlightPopover } from "./HighlightPopover";

export type SelectableMarkdownProps = {
  markdown: string;
  onAskSpan: (payload: SelectionAnchorPayload & { userQuestion: string }) => Promise<void>;
};

export function SelectableMarkdown({ markdown, onAskSpan }: SelectableMarkdownProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [anchor, setAnchor] = useState<SelectionAnchorPayload | null>(null);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleMouseUp(event: MouseEvent<HTMLDivElement>) {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const payload = getSelectionOffsets(container);
    if (!payload) {
      return;
    }

    const selection = window.getSelection();
    const rect = selection?.rangeCount ? selection.getRangeAt(0).getBoundingClientRect() : null;
    setAnchor(payload);
    setPopoverPosition({
      x: Math.min(window.innerWidth - 340, Math.max(12, rect?.left ?? event.clientX)),
      y: Math.min(window.innerHeight - 260, Math.max(70, (rect?.bottom ?? event.clientY) + 10))
    });
  }

  async function submitQuestion(userQuestion: string) {
    if (!anchor) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onAskSpan({ ...anchor, userQuestion });
      setAnchor(null);
      window.getSelection()?.removeAllRanges();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div ref={containerRef} onMouseUp={handleMouseUp} className="nodrag nopan markdown-body cursor-text select-text">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
          {markdown}
        </ReactMarkdown>
      </div>
      {anchor ? (
        <HighlightPopover
          anchor={anchor}
          position={popoverPosition}
          isSubmitting={isSubmitting}
          onCancel={() => {
            setAnchor(null);
            window.getSelection()?.removeAllRanges();
          }}
          onSubmit={submitQuestion}
        />
      ) : null}
    </>
  );
}

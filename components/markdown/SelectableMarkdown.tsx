"use client";

import { MouseEvent, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { getSelectionOffsets } from "@/lib/selection/getSelectionOffsets";
import type { SelectionAnchorPayload } from "@/lib/graph/types";
import { HighlightPopover } from "./HighlightPopover";
import type { PersistentHighlight } from "@/components/canvas/nodes/ExplanationNode";

export type SelectableMarkdownProps = {
  markdown: string;
  persistentHighlights: PersistentHighlight[];
  onAskSpan: (payload: SelectionAnchorPayload & { userQuestion: string }) => Promise<void>;
};

const SKIPPED_HIGHLIGHT_PARENTS = new Set(["CODE", "PRE", "BUTTON", "TEXTAREA", "MARK", "SCRIPT", "STYLE"]);

function unwrapPersistentMarks(container: HTMLElement) {
  container.querySelectorAll("mark[data-anchor-id]").forEach((mark) => {
    mark.replaceWith(document.createTextNode(mark.textContent ?? ""));
  });
  container.normalize();
}

function isHighlightableTextNode(node: Node) {
  const parent = node.parentElement;
  if (!parent || !node.textContent?.trim()) {
    return false;
  }

  return !parent.closest(Array.from(SKIPPED_HIGHLIGHT_PARENTS).join(","));
}

function wrapFirstMatch(container: HTMLElement, highlight: PersistentHighlight) {
  if (!highlight.selectedText.trim()) {
    return;
  }

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      isHighlightableTextNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
  });

  let current = walker.nextNode();
  while (current) {
    const text = current.textContent ?? "";
    const index = text.indexOf(highlight.selectedText);

    if (index >= 0) {
      const range = document.createRange();
      range.setStart(current, index);
      range.setEnd(current, index + highlight.selectedText.length);

      const mark = document.createElement("mark");
      mark.dataset.anchorId = highlight.id;
      mark.className = "rounded bg-gold/35 px-0.5 text-foreground ring-1 ring-gold/30";
      range.surroundContents(mark);
      return;
    }

    current = walker.nextNode();
  }
}

function getHighlightableTextNodes(container: HTMLElement) {
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      isHighlightableTextNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
  });

  let current = walker.nextNode();
  while (current) {
    nodes.push(current as Text);
    current = walker.nextNode();
  }

  return nodes;
}

function findTextPosition(nodes: Text[], offset: number) {
  let cursor = 0;

  for (const node of nodes) {
    const length = node.textContent?.length ?? 0;
    if (offset <= cursor + length) {
      return {
        node,
        offset: Math.max(0, offset - cursor)
      };
    }

    cursor += length;
  }

  return null;
}

function wrapByOffsets(container: HTMLElement, highlight: PersistentHighlight) {
  if (
    highlight.startOffset === null ||
    highlight.endOffset === null ||
    highlight.endOffset <= highlight.startOffset
  ) {
    return false;
  }

  const nodes = getHighlightableTextNodes(container);
  const start = findTextPosition(nodes, highlight.startOffset);
  const end = findTextPosition(nodes, highlight.endOffset);

  if (!start || !end) {
    return false;
  }

  try {
    const range = document.createRange();
    range.setStart(start.node, start.offset);
    range.setEnd(end.node, end.offset);

    const mark = document.createElement("mark");
    mark.dataset.anchorId = highlight.id;
    mark.className = "rounded bg-gold/35 px-0.5 text-foreground ring-1 ring-gold/30";
    mark.appendChild(range.extractContents());
    range.insertNode(mark);
    return true;
  } catch {
    return false;
  }
}

export function SelectableMarkdown({ markdown, persistentHighlights, onAskSpan }: SelectableMarkdownProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [anchor, setAnchor] = useState<SelectionAnchorPayload | null>(null);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    unwrapPersistentMarks(container);
    persistentHighlights.forEach((highlight) => {
      if (!wrapByOffsets(container, highlight)) {
        wrapFirstMatch(container, highlight);
      }
    });
  }, [markdown, persistentHighlights]);

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

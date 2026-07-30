import { getSurroundingContext } from "./getSurroundingContext";

const SKIPPED_SELECTION_PARENTS = new Set(["CODE", "PRE", "BUTTON", "TEXTAREA", "MARK", "SCRIPT", "STYLE"]);

function isSelectableTextNode(node: Node) {
  const parent = node.parentElement;
  if (!parent || !node.textContent) {
    return false;
  }

  return !parent.closest(Array.from(SKIPPED_SELECTION_PARENTS).join(","));
}

function getSelectableTextNodes(container: HTMLElement) {
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      isSelectableTextNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
  });

  let current = walker.nextNode();
  while (current) {
    nodes.push(current as Text);
    current = walker.nextNode();
  }

  return nodes;
}

function getSelectionTextOffsets(nodes: Text[], range: Range) {
  let cursor = 0;
  let startOffset: number | null = null;
  let endOffset: number | null = null;

  for (const node of nodes) {
    const textLength = node.textContent?.length ?? 0;

    if (range.intersectsNode(node)) {
      const nodeStart = node === range.startContainer ? range.startOffset : 0;
      const nodeEnd = node === range.endContainer ? range.endOffset : textLength;

      if (startOffset === null) {
        startOffset = cursor + nodeStart;
      }
      endOffset = cursor + nodeEnd;
    }

    cursor += textLength;
  }

  if (startOffset === null || endOffset === null || endOffset <= startOffset) {
    return null;
  }

  return { startOffset, endOffset };
}

function trimOffsets(plainText: string, startOffset: number, endOffset: number) {
  let start = startOffset;
  let end = endOffset;

  while (start < end && /\s/.test(plainText[start] ?? "")) {
    start += 1;
  }

  while (end > start && /\s/.test(plainText[end - 1] ?? "")) {
    end -= 1;
  }

  return { startOffset: start, endOffset: end };
}

export function getSelectionOffsets(container: HTMLElement) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  if (range.collapsed || !container.contains(range.commonAncestorContainer)) {
    return null;
  }

  const nodes = getSelectableTextNodes(container);
  const offsets = getSelectionTextOffsets(nodes, range);
  if (!offsets) {
    return null;
  }

  const plainText = nodes.map((node) => node.textContent ?? "").join("");
  const { startOffset, endOffset } = trimOffsets(plainText, offsets.startOffset, offsets.endOffset);
  const selectedText = plainText.slice(startOffset, endOffset);

  if (!selectedText.trim()) {
    return null;
  }

  const context = getSurroundingContext(plainText, startOffset, endOffset);

  return {
    selectedText,
    startOffset,
    endOffset,
    ...context
  };
}

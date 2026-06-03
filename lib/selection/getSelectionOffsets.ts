import { getSurroundingContext } from "./getSurroundingContext";

function getTextBeforeRange(container: HTMLElement, range: Range) {
  const preSelectionRange = range.cloneRange();
  preSelectionRange.selectNodeContents(container);
  preSelectionRange.setEnd(range.startContainer, range.startOffset);
  return preSelectionRange.toString();
}

export function getSelectionOffsets(container: HTMLElement) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const selectedText = selection.toString().trim();

  if (!selectedText || !container.contains(range.commonAncestorContainer)) {
    return null;
  }

  const plainText = container.innerText;
  const startOffset = getTextBeforeRange(container, range).length;
  const endOffset = startOffset + selection.toString().length;
  const context = getSurroundingContext(plainText, startOffset, endOffset);

  return {
    selectedText,
    startOffset,
    endOffset,
    ...context
  };
}

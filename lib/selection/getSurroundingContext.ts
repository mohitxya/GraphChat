export function getSurroundingContext(
  plainText: string,
  startOffset: number | null,
  endOffset: number | null,
  radius = 220
) {
  if (startOffset === null || endOffset === null) {
    return {
      prefixText: "",
      suffixText: "",
      surroundingContext: plainText.slice(0, radius * 2)
    };
  }

  const prefixStart = Math.max(0, startOffset - radius);
  const suffixEnd = Math.min(plainText.length, endOffset + radius);

  return {
    prefixText: plainText.slice(prefixStart, startOffset),
    suffixText: plainText.slice(endOffset, suffixEnd),
    surroundingContext: plainText.slice(prefixStart, suffixEnd)
  };
}

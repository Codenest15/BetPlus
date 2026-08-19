/** Schedule work after the current effect so data-fetching setState is not synchronous. */
export function deferEffect(work: () => void): () => void {
  const id = setTimeout(work, 0);
  return () => clearTimeout(id);
}

export type MarkdownSegment =
  | { type: "markdown"; content: string }
  | { type: "mermaid"; chart: string };

const MERMAID_FENCE = /```mermaid\n([\s\S]*?)```/g;

/**
 * Split post markdown into alternating prose and mermaid diagram segments.
 * Fenced blocks use the ```mermaid syntax (same as README / GitHub).
 */
export function splitMarkdownSegments(raw: string): MarkdownSegment[] {
  const segments: MarkdownSegment[] = [];
  let lastIndex = 0;

  for (const match of raw.matchAll(MERMAID_FENCE)) {
    const index = match.index ?? 0;
    const before = raw.slice(lastIndex, index).trim();
    if (before) {
      segments.push({ type: "markdown", content: before });
    }
    const chart = match[1]?.trim();
    if (chart) {
      segments.push({ type: "mermaid", chart });
    }
    lastIndex = index + match[0].length;
  }

  const tail = raw.slice(lastIndex).trim();
  if (tail) {
    segments.push({ type: "markdown", content: tail });
  }

  return segments.length > 0 ? segments : [{ type: "markdown", content: raw }];
}

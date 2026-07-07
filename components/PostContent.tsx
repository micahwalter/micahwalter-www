import MermaidDiagram from "@/components/MermaidDiagram";
import { renderMarkdown } from "@/lib/markdown";
import { splitMarkdownSegments } from "@/lib/markdown-segments";

interface PostContentProps {
  content: string;
  folderName: string;
}

export default async function PostContent({ content, folderName }: PostContentProps) {
  const segments = splitMarkdownSegments(content);

  const rendered = await Promise.all(
    segments.map(async (segment, index) => {
      if (segment.type === "mermaid") {
        return (
          <div
            key={`mermaid-${index}`}
            className="my-10 border border-charcoal/10 rounded p-4 bg-cream not-prose"
          >
            <MermaidDiagram chart={segment.chart} />
          </div>
        );
      }

      const html = await renderMarkdown(segment.content, folderName);
      return (
        <div
          key={`md-${index}`}
          className="prose-content"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    })
  );

  return <>{rendered}</>;
}

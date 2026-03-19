"use client";

import { useEffect, useRef, useState } from "react";

interface MermaidDiagramProps {
  chart: string;
}

export default function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function render() {
      const mermaid = (await import("mermaid")).default;
      mermaid.initialize({
        startOnLoad: false,
        theme: "base",
        themeVariables: {
          background: "#fafaf2",
          primaryColor: "#c8f0d8",
          primaryTextColor: "#191919",
          primaryBorderColor: "#3da85e",
          lineColor: "#5F5F5F",
          secondaryColor: "#b3d9f5",
          tertiaryColor: "#e0d4f5",
          fontFamily: "EB Garamond, Georgia, serif",
          fontSize: "14px",
        },
      });

      const id = `mermaid-${Math.random().toString(36).slice(2)}`;
      const { svg: rendered } = await mermaid.render(id, chart);
      if (!cancelled) {
        setSvg(rendered);
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [chart]);

  if (!svg) {
    return (
      <div ref={ref} className="text-gray text-sm italic py-8 text-center">
        Loading diagram…
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

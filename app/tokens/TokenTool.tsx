"use client";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  tokenizeNouns,
  type NounReplacement,
  type TokenizeResult,
} from "@/lib/tokens/tokenizeNouns";

const EXAMPLES = [
  {
    label: "Fox & dog",
    text: "The quick brown fox jumped over the lazy dog.",
  },
  {
    label: "Blues Brothers",
    text: "It's 106 miles to Chicago, we got a full tank of gas, half a pack of cigarettes, it's dark... and we're wearing sunglasses.",
  },
  {
    label: "Possessives",
    text: "John's dogs chased the cat's toy across New York.",
  },
] as const;

const chrome: CSSProperties = {
  fontFamily: "system-ui, -apple-system, sans-serif",
};

function splitOutput(source: string, result: TokenizeResult) {
  const pieces: Array<
    | { type: "text"; text: string }
    | { type: "swap"; item: NounReplacement }
  > = [];
  let cursor = 0;
  for (const item of result.replacements) {
    if (item.start > cursor) {
      pieces.push({ type: "text", text: source.slice(cursor, item.start) });
    }
    pieces.push({ type: "swap", item });
    cursor = item.end;
  }
  if (cursor < source.length) {
    pieces.push({ type: "text", text: source.slice(cursor) });
  }
  return pieces;
}

function GhostButton({
  children,
  onClick,
  disabled,
  pressed,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={pressed}
      className="text-sm text-gray hover:text-charcoal transition-colors disabled:opacity-40 disabled:cursor-not-allowed px-2 py-1"
      style={chrome}
    >
      {children}
    </button>
  );
}

export default function TokenTool() {
  const [source, setSource] = useState<string>(EXAMPLES[0].text);
  const [showOriginals, setShowOriginals] = useState(true);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => tokenizeNouns(source), [source]);
  const pieces = useMemo(() => splitOutput(source, result), [source, result]);
  const nounCount = result.replacements.filter((item) => item.kind === "noun").length;
  const trimmed = source.trim();

  async function copyOutput() {
    if (!result.text) return;
    await navigator.clipboard.writeText(result.text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="max-w-wide mx-auto px-6 py-12">
      <header className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-reading">
          <p
            className="text-xs tracking-[0.18em] uppercase text-gray mb-3"
            style={chrome}
          >
            Token optimization and opperations
          </p>
          <h1 className="font-serif font-semibold text-4xl md:text-5xl text-charcoal mb-4">
            Token Tool
          </h1>
          <p className="text-gray text-lg leading-relaxed">
            Paste a long passage and optimize your tokens to the max amount of
            tokens possible. We stamp every noun as{" "}
            <span className="text-charcoal">token</span>. More tokens. Better
            tokens. Peak token throughput.
          </p>
        </div>
        <p
          className="text-sm text-gray leading-relaxed md:text-right"
          style={chrome}
        >
          fox → token
          <br />
          miles → tokens
          <br />
          Chicago → Token
        </p>
      </header>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span
          className="text-xs tracking-wide uppercase text-gray mr-1"
          style={chrome}
        >
          Try
        </span>
        {EXAMPLES.map((example) => (
          <button
            key={example.label}
            type="button"
            onClick={() => setSource(example.text)}
            className="border border-gray/30 px-3 py-1.5 text-sm text-charcoal hover:border-charcoal transition-colors"
            style={chrome}
          >
            {example.label}
          </button>
        ))}
      </div>

      <div className="grid items-stretch gap-6 lg:grid-cols-2">
        <section className="flex min-h-[28rem] flex-col border border-charcoal/10 p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-serif font-semibold text-2xl text-charcoal">
              Manuscript
            </h2>
            <GhostButton disabled={!source} onClick={() => setSource("")}>
              Clear
            </GhostButton>
          </div>
          <label className="sr-only" htmlFor="manuscript">
            Source text
          </label>
          <textarea
            id="manuscript"
            value={source}
            onChange={(event) => setSource(event.target.value)}
            placeholder="Paste or type a paragraph. Nouns will be stamped token."
            className="min-h-0 flex-1 w-full resize-none border border-gray/30 bg-cream px-4 py-3 text-charcoal leading-relaxed focus:outline-none focus:border-charcoal"
          />
          <p className="mt-3 text-sm text-gray" style={chrome}>
            {trimmed
              ? `${source.length} characters`
              : "Empty — nothing to stamp yet."}
          </p>
        </section>

        <section className="flex min-h-[28rem] flex-col border border-charcoal/10 p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-serif font-semibold text-2xl text-charcoal">
              Reprint
            </h2>
            <div className="flex items-center gap-1">
              <GhostButton
                pressed={showOriginals}
                onClick={() => setShowOriginals((value) => !value)}
              >
                {showOriginals ? "Hide originals" : "Show originals"}
              </GhostButton>
              <button
                type="button"
                disabled={!result.text}
                onClick={() => {
                  void copyOutput();
                }}
                className="bg-charcoal text-cream px-4 py-2 text-sm tracking-wide hover:bg-charcoal/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={chrome}
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          <div
            className={`min-h-0 flex-1 overflow-auto border border-gray/30 bg-cream px-4 py-3 leading-relaxed whitespace-pre-wrap text-charcoal ${
              showOriginals && nounCount > 0 ? "leading-9" : ""
            }`}
            aria-live="polite"
          >
            {!trimmed ? (
              <p className="text-gray">
                The reprint appears here after you enter a sentence.
              </p>
            ) : nounCount === 0 ? (
              <p>
                {result.text || source}
                <span className="mt-3 block text-sm text-gray">
                  No nouns found to replace.
                </span>
              </p>
            ) : (
              pieces.map((piece, index) => {
                if (piece.type === "text") {
                  return <span key={index}>{piece.text}</span>;
                }
                const { item } = piece;
                if (item.kind === "article") {
                  return (
                    <span key={index} className="text-charcoal">
                      {item.replacement}
                    </span>
                  );
                }
                return (
                  <span key={index} title={item.original} className="text-charcoal">
                    <span className="underline decoration-accent decoration-2 underline-offset-4">
                      {item.replacement}
                    </span>
                    {showOriginals ? (
                      <span
                        className="ml-1 align-super text-[10px] tracking-wide text-gray uppercase"
                        style={chrome}
                      >
                        {item.original}
                      </span>
                    ) : null}
                  </span>
                );
              })
            )}
          </div>

          <p className="mt-3 text-sm text-gray" style={chrome}>
            {trimmed
              ? `${nounCount} ${nounCount === 1 ? "noun" : "nouns"} stamped`
              : "Waiting for copy"}
          </p>
        </section>
      </div>

      <p className="mt-10 max-w-reading text-gray leading-relaxed">
        Singular nouns become <em>token</em>, plurals and mass nouns become{" "}
        <em>tokens</em>, and names keep their capital letter: <em>Token</em>.
        Possessives land as <em>token&apos;s</em> or <em>tokens&apos;</em>. A
        preceding <em>an</em> is tightened to <em>a</em> when the noun becomes{" "}
        <em>token</em>.
      </p>
    </div>
  );
}

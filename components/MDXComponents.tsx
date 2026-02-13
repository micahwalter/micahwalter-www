import type { MDXComponents } from "mdx/types";
import ZoomableImage from "./ZoomableImage";

export const mdxComponents: MDXComponents = {
  h1: ({ children }) => (
    <h1 className="text-4xl font-serif font-semibold mt-12 mb-6 text-charcoal">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-3xl font-serif font-semibold mt-10 mb-5 text-charcoal">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-2xl font-serif font-semibold mt-8 mb-4 text-charcoal">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-xl font-serif font-semibold mt-6 mb-3 text-charcoal">
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="mb-6 leading-relaxed text-charcoal">{children}</p>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-charcoal underline decoration-accent decoration-2 underline-offset-2 hover:decoration-charcoal transition-colors"
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="mb-6 space-y-2 list-disc list-outside ml-6">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-6 space-y-2 list-decimal list-outside ml-6">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-accent pl-6 py-2 my-8 italic text-gray">
      {children}
    </blockquote>
  ),
  code: ({ children, className }) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code className="bg-gray/10 text-charcoal px-1.5 py-0.5 rounded text-sm font-mono">
          {children}
        </code>
      );
    }
    return (
      <code className={`${className} text-sm`}>
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="bg-charcoal text-cream p-6 rounded-lg overflow-x-auto my-8 text-sm leading-relaxed">
      {children}
    </pre>
  ),
  img: ({ src, alt }) => (
    <ZoomableImage
      src={src}
      alt={alt}
      className="rounded-lg my-8 w-full"
    />
  ),
  hr: () => <hr className="my-12 border-gray/20" />,
  table: ({ children }) => (
    <div className="overflow-x-auto my-8">
      <table className="min-w-full divide-y divide-gray/20">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="px-4 py-3 text-left text-sm font-semibold text-charcoal bg-gray/5">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-3 text-sm text-charcoal border-t border-gray/10">
      {children}
    </td>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-charcoal">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
};

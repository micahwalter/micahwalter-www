import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";

const CDN_BASE = process.env.NEXT_PUBLIC_CDN_URL || '';
const SIZES = [400, 800, 1200];
const DEFAULT_SIZES = '(max-width: 640px) 100vw, (max-width: 1024px) 800px, 1200px';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function walkAndTransform(node: any, folderName?: string): void {
  if (node.type === 'element' && node.tagName === 'img') {
    const src = node.properties?.src as string | undefined;
    if (src?.startsWith('./') && folderName) {
      const filename = src.replace('./', '').replace(/\.(jpg|jpeg|png|gif|webp)$/i, '');
      const basePath = `/images/posts/${folderName}/${filename}`;
      const alt = (node.properties?.alt as string) || '';
      const webpSrcset = SIZES.map(s => `${CDN_BASE}${basePath}-${s}.webp ${s}w`).join(', ');
      const jpgSrcset = SIZES.map(s => `${CDN_BASE}${basePath}-${s}.jpg ${s}w`).join(', ');
      node.tagName = 'picture';
      node.properties = {};
      node.children = [
        {
          type: 'element',
          tagName: 'source',
          properties: { srcSet: webpSrcset, type: 'image/webp', sizes: DEFAULT_SIZES },
          children: [],
        },
        {
          type: 'element',
          tagName: 'source',
          properties: { srcSet: jpgSrcset, type: 'image/jpeg', sizes: DEFAULT_SIZES },
          children: [],
        },
        {
          type: 'element',
          tagName: 'img',
          properties: {
            src: `${CDN_BASE}${basePath}-800.jpg`,
            alt,
            loading: 'lazy',
            decoding: 'async',
          },
          children: [],
        },
      ];
    }
    return;
  }

  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      walkAndTransform(child, folderName);
    }
  }
}

function rehypeTransforms(folderName?: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return () => (tree: any) => walkAndTransform(tree, folderName);
}

export async function renderMarkdown(content: string, folderName?: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeTransforms(folderName))
    .use(rehypeHighlight)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(content);

  return String(result);
}
